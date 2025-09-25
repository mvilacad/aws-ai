import * as cdk from "aws-cdk-lib";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as cloudwatchActions from "aws-cdk-lib/aws-cloudwatch-actions";
import * as sns from "aws-cdk-lib/aws-sns";
import * as snsSubscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import type { Construct } from "constructs";

import type { EnvironmentConfig } from "../environments";

import type { ComputeStack } from "./compute-stack";
import type { DataStack } from "./data-stack";

export interface MonitoringStackProps extends cdk.StackProps {
	stage: string;
	config: EnvironmentConfig;
	computeStack: ComputeStack;
	dataStack: DataStack;
}

export class MonitoringStack extends cdk.Stack {
	public readonly dashboard: cloudwatch.Dashboard;
	public readonly alarmTopic: sns.Topic;

	constructor(scope: Construct, id: string, props: MonitoringStackProps) {
		super(scope, id, props);

		const { config, computeStack, dataStack } = props;

		// Create SNS topic for alarms
		this.alarmTopic = this.createAlarmTopic(config);

		// Create CloudWatch dashboard
		this.dashboard = this.createDashboard(config, computeStack, dataStack);

		// Create alarms
		this.createAlarms(config, computeStack, dataStack);

		// Add outputs
		this.addOutputs();
	}

	private createAlarmTopic(config: EnvironmentConfig): sns.Topic {
		const topic = new sns.Topic(this, "AlarmTopic", {
			displayName: `AWS AI Alarms - ${config.stage}`,
			topicName: `aws-ai-alarms-${config.stage}`,
		});

		// Add email subscription if configured
		if (config.monitoring.alarmEmail) {
			topic.addSubscription(
				new snsSubscriptions.EmailSubscription(config.monitoring.alarmEmail),
			);
		}

		return topic;
	}

	private createDashboard(
		config: EnvironmentConfig,
		computeStack: ComputeStack,
		dataStack: DataStack,
	): cloudwatch.Dashboard {
		const dashboard = new cloudwatch.Dashboard(this, "AwsAiDashboard", {
			dashboardName: `aws-ai-${config.stage}`,
		});

		// Lambda metrics
		const lambdaWidgets = Object.entries(computeStack.lambdaFunctions).map(
			([name, fn]) => {
				return new cloudwatch.GraphWidget({
					title: `${name} Metrics`,
					left: [
						new cloudwatch.Metric({
							namespace: "AWS/Lambda",
							metricName: "Invocations",
							dimensionsMap: {
								FunctionName: fn.functionName,
							},
							statistic: "Sum",
						}),
						new cloudwatch.Metric({
							namespace: "AWS/Lambda",
							metricName: "Errors",
							dimensionsMap: {
								FunctionName: fn.functionName,
							},
							statistic: "Sum",
						}),
					],
					right: [
						new cloudwatch.Metric({
							namespace: "AWS/Lambda",
							metricName: "Duration",
							dimensionsMap: {
								FunctionName: fn.functionName,
							},
							statistic: "Average",
						}),
					],
				});
			},
		);

		// API Gateway metrics
		const apiWidget = new cloudwatch.GraphWidget({
			title: "API Gateway Metrics",
			left: [
				new cloudwatch.Metric({
					namespace: "AWS/ApiGateway",
					metricName: "Count",
					dimensionsMap: {
						ApiName: computeStack.api.restApiName,
						Stage: config.stage,
					},
					statistic: "Sum",
				}),
				new cloudwatch.Metric({
					namespace: "AWS/ApiGateway",
					metricName: "4XXError",
					dimensionsMap: {
						ApiName: computeStack.api.restApiName,
						Stage: config.stage,
					},
					statistic: "Sum",
				}),
				new cloudwatch.Metric({
					namespace: "AWS/ApiGateway",
					metricName: "5XXError",
					dimensionsMap: {
						ApiName: computeStack.api.restApiName,
						Stage: config.stage,
					},
					statistic: "Sum",
				}),
			],
			right: [
				new cloudwatch.Metric({
					namespace: "AWS/ApiGateway",
					metricName: "Latency",
					dimensionsMap: {
						ApiName: computeStack.api.restApiName,
						Stage: config.stage,
					},
					statistic: "Average",
				}),
			],
		});

		// DynamoDB metrics
		const dynamoWidgets = Object.entries(dataStack.dynamoTables).map(
			([name, table]) => {
				return new cloudwatch.GraphWidget({
					title: `DynamoDB ${name} Metrics`,
					left: [
						new cloudwatch.Metric({
							namespace: "AWS/DynamoDB",
							metricName: "ConsumedReadCapacityUnits",
							dimensionsMap: {
								TableName: table.tableName,
							},
							statistic: "Sum",
						}),
						new cloudwatch.Metric({
							namespace: "AWS/DynamoDB",
							metricName: "ConsumedWriteCapacityUnits",
							dimensionsMap: {
								TableName: table.tableName,
							},
							statistic: "Sum",
						}),
					],
					right: [
						new cloudwatch.Metric({
							namespace: "AWS/DynamoDB",
							metricName: "SuccessfulRequestLatency",
							dimensionsMap: {
								TableName: table.tableName,
								Operation: "Query",
							},
							statistic: "Average",
						}),
					],
				});
			},
		);

		// OpenSearch metrics
		const openSearchWidget = new cloudwatch.GraphWidget({
			title: "OpenSearch Metrics",
			left: [
				new cloudwatch.Metric({
					namespace: "AWS/ES",
					metricName: "SearchLatency",
					dimensionsMap: {
						DomainName: dataStack.openSearchDomain.domainName,
						ClientId: this.account,
					},
					statistic: "Average",
				}),
				new cloudwatch.Metric({
					namespace: "AWS/ES",
					metricName: "SearchRate",
					dimensionsMap: {
						DomainName: dataStack.openSearchDomain.domainName,
						ClientId: this.account,
					},
					statistic: "Sum",
				}),
			],
			right: [
				new cloudwatch.Metric({
					namespace: "AWS/ES",
					metricName: "CPUUtilization",
					dimensionsMap: {
						DomainName: dataStack.openSearchDomain.domainName,
						ClientId: this.account,
					},
					statistic: "Average",
				}),
			],
		});

		// Add all widgets to dashboard
		dashboard.addWidgets(apiWidget);
		dashboard.addWidgets(...lambdaWidgets);
		dashboard.addWidgets(...dynamoWidgets);
		dashboard.addWidgets(openSearchWidget);

		return dashboard;
	}

	private createAlarms(
		config: EnvironmentConfig,
		computeStack: ComputeStack,
		dataStack: DataStack,
	): void {
		// Lambda error alarms
		Object.entries(computeStack.lambdaFunctions).forEach(([name, fn]) => {
			const errorAlarm = new cloudwatch.Alarm(this, `${name}ErrorAlarm`, {
				alarmName: `${config.stage}-${name}-errors`,
				alarmDescription: `High error rate for ${name}`,
				metric: new cloudwatch.Metric({
					namespace: "AWS/Lambda",
					metricName: "Errors",
					dimensionsMap: {
						FunctionName: fn.functionName,
					},
					statistic: "Sum",
					period: cdk.Duration.minutes(5),
				}),
				threshold: 5,
				evaluationPeriods: 2,
				comparisonOperator:
					cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
			});

			errorAlarm.addAlarmAction(
				new cloudwatchActions.SnsAction(this.alarmTopic),
			);

			const durationAlarm = new cloudwatch.Alarm(this, `${name}DurationAlarm`, {
				alarmName: `${config.stage}-${name}-duration`,
				alarmDescription: `High duration for ${name}`,
				metric: new cloudwatch.Metric({
					namespace: "AWS/Lambda",
					metricName: "Duration",
					dimensionsMap: {
						FunctionName: fn.functionName,
					},
					statistic: "Average",
					period: cdk.Duration.minutes(5),
				}),
				threshold: config.lambda.timeout * 1000 * 0.8, // 80% of timeout
				evaluationPeriods: 3,
				comparisonOperator:
					cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
			});

			durationAlarm.addAlarmAction(
				new cloudwatchActions.SnsAction(this.alarmTopic),
			);
		});

		// API Gateway alarms
		const apiErrorAlarm = new cloudwatch.Alarm(this, "ApiGatewayErrorAlarm", {
			alarmName: `${config.stage}-api-errors`,
			alarmDescription: "High error rate for API Gateway",
			metric: new cloudwatch.Metric({
				namespace: "AWS/ApiGateway",
				metricName: "5XXError",
				dimensionsMap: {
					ApiName: computeStack.api.restApiName,
					Stage: config.stage,
				},
				statistic: "Sum",
				period: cdk.Duration.minutes(5),
			}),
			threshold: 10,
			evaluationPeriods: 2,
			comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
		});

		apiErrorAlarm.addAlarmAction(
			new cloudwatchActions.SnsAction(this.alarmTopic),
		);

		// OpenSearch alarms
		const openSearchCpuAlarm = new cloudwatch.Alarm(
			this,
			"OpenSearchCpuAlarm",
			{
				alarmName: `${config.stage}-opensearch-cpu`,
				alarmDescription: "High CPU utilization for OpenSearch",
				metric: new cloudwatch.Metric({
					namespace: "AWS/ES",
					metricName: "CPUUtilization",
					dimensionsMap: {
						DomainName: dataStack.openSearchDomain.domainName,
						ClientId: this.account,
					},
					statistic: "Average",
					period: cdk.Duration.minutes(5),
				}),
				threshold: 80,
				evaluationPeriods: 3,
				comparisonOperator:
					cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
			},
		);

		openSearchCpuAlarm.addAlarmAction(
			new cloudwatchActions.SnsAction(this.alarmTopic),
		);
	}

	private addOutputs(): void {
		new cdk.CfnOutput(this, "DashboardUrl", {
			value: `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${this.dashboard.dashboardName}`,
			exportName: `${this.stackName}-DashboardUrl`,
		});

		new cdk.CfnOutput(this, "AlarmTopicArn", {
			value: this.alarmTopic.topicArn,
			exportName: `${this.stackName}-AlarmTopicArn`,
		});
	}
}
