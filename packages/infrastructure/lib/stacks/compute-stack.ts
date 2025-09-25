import * as path from "node:path";

import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import type { Construct } from "constructs";

import type { EnvironmentConfig } from "../environments";

import type { AIStack } from "./ai-stack";
import type { DataStack } from "./data-stack";

export interface ComputeStackProps extends cdk.StackProps {
	stage: string;
	config: EnvironmentConfig;
	dataStack: DataStack;
	aiStack: AIStack;
}

export class ComputeStack extends cdk.Stack {
	public readonly api: apigateway.RestApi;
	public readonly lambdaFunctions: Record<string, lambda.Function> = {};
	public readonly lambdaExecutionRole: iam.Role;

	constructor(scope: Construct, id: string, props: ComputeStackProps) {
		super(scope, id, props);

		const { config, dataStack } = props;
		// Create Lambda execution role
		this.lambdaExecutionRole = this.createLambdaExecutionRole(dataStack);

		// Create Lambda functions
		this.createLambdaFunctions(config, dataStack);

		// Create API Gateway
		this.api = this.createApiGateway(config);

		// Add outputs
		this.addOutputs();
	}

	private createLambdaExecutionRole(dataStack: DataStack): iam.Role {
		const role = new iam.Role(this, "LambdaExecutionRole", {
			assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
			description: "Execution role for Lambda functions",
			managedPolicies: [
				iam.ManagedPolicy.fromAwsManagedPolicyName(
					"service-role/AWSLambdaBasicExecutionRole",
				),
				iam.ManagedPolicy.fromAwsManagedPolicyName("AWSXRayDaemonWriteAccess"),
			],
		});

		// Add DynamoDB permissions
		Object.values(dataStack.dynamoTables).forEach((table) => {
			table.grantReadWriteData(role);
		});

		// Add S3 permissions
		dataStack.documentsBucket.grantReadWrite(role);

		// Add OpenSearch permissions
		role.addToPolicy(
			new iam.PolicyStatement({
				effect: iam.Effect.ALLOW,
				actions: [
					"es:ESHttpDelete",
					"es:ESHttpGet",
					"es:ESHttpHead",
					"es:ESHttpPost",
					"es:ESHttpPut",
				],
				resources: [dataStack.openSearchDomain.domainArn + "/*"],
			}),
		);

		// Add Bedrock permissions
		role.addToPolicy(
			new iam.PolicyStatement({
				effect: iam.Effect.ALLOW,
				actions: [
					"bedrock:InvokeModel",
					"bedrock:InvokeModelWithResponseStream",
					"bedrock:ListFoundationModels",
					"bedrock:GetFoundationModel",
				],
				resources: [
					"arn:aws:bedrock:*::foundation-model/anthropic.claude-*",
					"arn:aws:bedrock:*::foundation-model/amazon.titan-*",
				],
			}),
		);

		return role;
	}

	private createLambdaFunctions(
		config: EnvironmentConfig,
		dataStack: DataStack,
	): void {
		const functionsDir = path.join(__dirname, "../../../functions/src");

		// Environment variables common to all functions
		const commonEnvironment = {
			...config.lambda.environment,
			BEDROCK_REGION: config.ai.bedrockRegion,
			MODEL_ID: config.ai.modelId,
			EMBEDDING_MODEL_ID: config.ai.embeddingModelId,
			MAX_TOKENS: config.ai.maxTokens.toString(),
			TEMPERATURE: config.ai.temperature.toString(),
			DOCUMENTS_BUCKET: dataStack.documentsBucket.bucketName,
			OPENSEARCH_ENDPOINT: dataStack.openSearchDomain.domainEndpoint,
		};

		// Add DynamoDB table names to environment
		const envVariables = commonEnvironment as Record<string, string>;
		Object.entries(dataStack.dynamoTables).forEach(([name, table]) => {
			envVariables[`TABLE_${name.toUpperCase().replace(/-/g, "_")}`] =
				table.tableName;
		});

		// Chat Handler
		this.lambdaFunctions.chatHandler = new lambda.Function(
			this,
			"ChatHandler",
			{
				runtime: lambda.Runtime.NODEJS_20_X,
				handler: "chat/handler.handler",
				code: lambda.Code.fromAsset(functionsDir),
				role: this.lambdaExecutionRole,
				timeout: cdk.Duration.seconds(config.lambda.timeout),
				memorySize: config.lambda.memorySize,
				environment: envVariables,
				tracing: lambda.Tracing.ACTIVE,
				logRetention: logs.RetentionDays.ONE_WEEK,
			},
		);

		// Analysis Handler
		this.lambdaFunctions.analysisHandler = new lambda.Function(
			this,
			"AnalysisHandler",
			{
				runtime: lambda.Runtime.NODEJS_20_X,
				handler: "analysis/handler.handler",
				code: lambda.Code.fromAsset(functionsDir),
				role: this.lambdaExecutionRole,
				timeout: cdk.Duration.seconds(config.lambda.timeout * 2), // Analysis might take longer
				memorySize: config.lambda.memorySize * 2, // More memory for AI processing
				environment: envVariables,
				tracing: lambda.Tracing.ACTIVE,
				logRetention: logs.RetentionDays.ONE_WEEK,
			},
		);

		// Document Ingest Handler (if exists)
		// this.lambdaFunctions.ingestHandler = new lambda.Function(
		//   this,
		//   "IngestHandler",
		//   {
		//     runtime: lambda.Runtime.NODEJS_20_X,
		//     handler: "ingest/handler.handler",
		//     code: lambda.Code.fromAsset(functionsDir),
		//     role: this.lambdaExecutionRole,
		//     timeout: cdk.Duration.minutes(5), // Document processing can take time
		//     memorySize: config.lambda.memorySize * 2,
		//     environment: commonEnvironment,
		//     tracing: lambda.Tracing.ACTIVE,
		//     logRetention: logs.RetentionDays.ONE_WEEK,
		//   }
		// );
	}

	private createApiGateway(config: EnvironmentConfig): apigateway.RestApi {
		const api = new apigateway.RestApi(this, "AwsAiApi", {
			restApiName: `aws-ai-api-${config.stage}`,
			description: `AWS AI API for ${config.stage} environment`,
			defaultCorsPreflightOptions: {
				allowOrigins: config.api.cors.allowOrigins,
				allowMethods: config.api.cors.allowMethods,
				allowHeaders: config.api.cors.allowHeaders,
			},
			deployOptions: {
				stageName: config.stage,
				tracingEnabled: true,
				metricsEnabled: true,
				loggingLevel: apigateway.MethodLoggingLevel.INFO,
			},
		});

		// Create v1 API version
		const v1 = api.root.addResource("v1");

		// Chat endpoints
		const chat = v1.addResource("chat");
		const chatById = chat.addResource("{sessionId}");
		const messages = chatById.addResource("messages");

		// Chat routes
		chat.addMethod(
			"POST",
			new apigateway.LambdaIntegration(this.lambdaFunctions.chatHandler),
		); // Create session
		chat.addMethod(
			"GET",
			new apigateway.LambdaIntegration(this.lambdaFunctions.chatHandler),
		); // Get sessions
		chatById.addMethod(
			"GET",
			new apigateway.LambdaIntegration(this.lambdaFunctions.chatHandler),
		); // Get session
		chatById.addMethod(
			"DELETE",
			new apigateway.LambdaIntegration(this.lambdaFunctions.chatHandler),
		); // Delete session
		messages.addMethod(
			"POST",
			new apigateway.LambdaIntegration(this.lambdaFunctions.chatHandler),
		); // Send message
		messages.addMethod(
			"GET",
			new apigateway.LambdaIntegration(this.lambdaFunctions.chatHandler),
		); // Get messages

		// Analysis endpoints
		const analysis = v1.addResource("analysis");
		analysis.addMethod(
			"POST",
			new apigateway.LambdaIntegration(this.lambdaFunctions.analysisHandler),
		);

		// Document ingest endpoints (if handler exists)
		// const documents = v1.addResource("documents");
		// documents.addMethod(
		//   "POST",
		//   new apigateway.LambdaIntegration(this.lambdaFunctions.ingestHandler)
		// );

		return api;
	}

	private addOutputs(): void {
		new cdk.CfnOutput(this, "ApiGatewayUrl", {
			value: this.api.url,
			exportName: `${this.stackName}-ApiGatewayUrl`,
		});

		new cdk.CfnOutput(this, "ApiGatewayId", {
			value: this.api.restApiId,
			exportName: `${this.stackName}-ApiGatewayId`,
		});

		// Lambda function outputs
		Object.entries(this.lambdaFunctions).forEach(([name, fn]) => {
			new cdk.CfnOutput(this, `${name}Arn`, {
				value: fn.functionArn,
				exportName: `${this.stackName}-${name}Arn`,
			});
		});
	}
}
