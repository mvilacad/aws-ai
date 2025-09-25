import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import type { Construct } from "constructs";

import type { EnvironmentConfig } from "../environments";

export interface AIStackProps extends cdk.StackProps {
	stage: string;
	config: EnvironmentConfig;
}

export class AIStack extends cdk.Stack {
	public readonly bedrockExecutionRole: iam.Role;
	public readonly bedrockAccessPolicy: iam.PolicyDocument;

	constructor(scope: Construct, id: string, props: AIStackProps) {
		super(scope, id, props);

		const { config } = props;

		// Create execution role for Bedrock operations
		this.bedrockExecutionRole = this.createBedrockExecutionRole();

		// Create policy document for Bedrock access
		this.bedrockAccessPolicy = this.createBedrockAccessPolicy(config);

		// Add outputs
		this.addOutputs();
	}

	private createBedrockExecutionRole(): iam.Role {
		return new iam.Role(this, "BedrockExecutionRole", {
			assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
			description: "Execution role for Lambda functions accessing Bedrock",
			managedPolicies: [
				iam.ManagedPolicy.fromAwsManagedPolicyName(
					"service-role/AWSLambdaBasicExecutionRole",
				),
			],
			inlinePolicies: {
				BedrockAccess: new iam.PolicyDocument({
					statements: [
						new iam.PolicyStatement({
							effect: iam.Effect.ALLOW,
							actions: [
								"bedrock:InvokeModel",
								"bedrock:InvokeModelWithResponseStream",
							],
							resources: [
								`arn:aws:bedrock:*::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0`,
								`arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v1`,
								`arn:aws:bedrock:*::foundation-model/anthropic.claude-*`,
								`arn:aws:bedrock:*::foundation-model/amazon.titan-*`,
							],
						}),
						new iam.PolicyStatement({
							effect: iam.Effect.ALLOW,
							actions: [
								"bedrock:ListFoundationModels",
								"bedrock:GetFoundationModel",
							],
							resources: ["*"],
						}),
					],
				}),
			},
		});
	}

	private createBedrockAccessPolicy(config: EnvironmentConfig): iam.PolicyDocument {
		return new iam.PolicyDocument({
			statements: [
				new iam.PolicyStatement({
					effect: iam.Effect.ALLOW,
					actions: [
						"bedrock:InvokeModel",
						"bedrock:InvokeModelWithResponseStream",
					],
					resources: [
						`arn:aws:bedrock:${config.ai.bedrockRegion}::foundation-model/${config.ai.modelId}`,
						`arn:aws:bedrock:${config.ai.bedrockRegion}::foundation-model/${config.ai.embeddingModelId}`,
						`arn:aws:bedrock:${config.ai.bedrockRegion}::foundation-model/anthropic.claude-*`,
						`arn:aws:bedrock:${config.ai.bedrockRegion}::foundation-model/amazon.titan-*`,
					],
					conditions: {
						StringEquals: {
							"aws:RequestedRegion": config.ai.bedrockRegion,
						},
					},
				}),
				new iam.PolicyStatement({
					effect: iam.Effect.ALLOW,
					actions: [
						"bedrock:ListFoundationModels",
						"bedrock:GetFoundationModel",
					],
					resources: ["*"],
					conditions: {
						StringEquals: {
							"aws:RequestedRegion": config.ai.bedrockRegion,
						},
					},
				}),
			],
		});
	}

	private addOutputs(): void {
		new cdk.CfnOutput(this, "BedrockExecutionRoleArn", {
			value: this.bedrockExecutionRole.roleArn,
			exportName: `${this.stackName}-BedrockExecutionRoleArn`,
		});

		new cdk.CfnOutput(this, "BedrockExecutionRoleName", {
			value: this.bedrockExecutionRole.roleName,
			exportName: `${this.stackName}-BedrockExecutionRoleName`,
		});
	}
}