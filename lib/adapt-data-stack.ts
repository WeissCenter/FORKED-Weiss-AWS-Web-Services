import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { AdaptStackProps } from "./adpat-stack-props";
import {
  Database,
  Job,
  JobExecutable,
  Code,
  GlueVersion,
  PythonVersion,
  WorkerType,
} from "@aws-cdk/aws-glue-alpha";
import { CfnCrawler } from "aws-cdk-lib/aws-glue";
import { HttpMethods } from "aws-cdk-lib/aws-s3";
import { AdaptS3Bucket } from "../constructs/AdaptS3Bucket";
import {
  Effect,
  Policy,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { AdaptDynamoTable } from "../constructs/AdaptDynamoTable";
import { Rule } from "aws-cdk-lib/aws-events";
import { AdaptPythonLambda } from "../constructs/AdaptPythonLambda";
import { AdaptNodeLambda } from "../constructs/AdaptNodeLambda";
import path from "path";
import { LogGroup } from "aws-cdk-lib/aws-logs";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";

interface AdaptDataStackProps extends AdaptStackProps {
  dynamoTables: { [key: string]: AdaptDynamoTable };
  vapidKeys: {
    publicKey: string;
    privateKey: string;
  };
  logGroup: LogGroup;
}

export class AdaptDataStack extends cdk.Stack {
  stagingBucket: AdaptS3Bucket;
  repoBucket: AdaptS3Bucket;
  queryResultBucket: AdaptS3Bucket;
  assetsBucket: AdaptS3Bucket;
  dataCatalog: Database;
  dataPullJob: Job;
  dataSourceGlueRole: Role;
  suppressionServiceFunctionName: string;

  constructor(scope: Construct, id: string, props: AdaptDataStackProps) {
    super(scope, id, props);

    const adaptDataCatalog = new Database(this, `AdaptDataCatalog`, {
      databaseName: `${id}-AdaptDataCatalog`.toLowerCase(),
      description: "Adapt Data Catalog",
    });
    this.dataCatalog = adaptDataCatalog;

    const repositoryBucket = new AdaptS3Bucket(
      this,
      `AdaptDataRepositoryBucket`,
      {
        bucketName: `${id}-AdaptDataRepositoryBucket`,
      }
    );
    this.repoBucket = repositoryBucket;

    const stagingBucket = new AdaptS3Bucket(this, `AdaptDataStagingBucket`, {
      bucketName: `${id}-AdaptDataStagingBucket`,
      cors: [
        {
          allowedHeaders: ["*"],
          allowedMethods: [HttpMethods.PUT],
          allowedOrigins: ["*"],
          exposedHeaders: [
            "x-amz-server-side-encryption",
            "x-amz-request-id",
            "x-amz-id-2",
          ],
          maxAge: 3000,
        },
      ],
    });
    this.stagingBucket = stagingBucket;

    const queryResultBucket = new AdaptS3Bucket(
      this,
      `AdaptQueryResultBucket`,
      {
        bucketName: `${id}-AdaptQueryResultBucket`,
      }
    );
    this.queryResultBucket = queryResultBucket;

    const assetsBucket = new AdaptS3Bucket(this, `AdaptAssetsBucket`, {
      bucketName: `${id}-AdaptAssetsBucket`,
    });
    this.assetsBucket = assetsBucket;

    const gluePolicy = new Policy(this, `${id}-GluePolicy`, {
      statements: [
        new PolicyStatement({
          actions: ["iam:*"], // TODO: limit the actions
          effect: Effect.ALLOW,
          resources: ["*"], // TODO: determine the correct resources
        }),
        new PolicyStatement({
          actions: ["glue:*"], // TODO: limit the actions
          effect: Effect.ALLOW,
          resources: ["*"], // TODO: determine the correct resources
        }),
        new PolicyStatement({
          actions: ["s3:*"], // TODO: limit the actions
          effect: Effect.ALLOW,
          resources: ["*"], // TODO: determine the correct resources
        }),
        new PolicyStatement({
          actions: ["dynamodb:*"], // TODO: limit the actions
          effect: Effect.ALLOW,
          resources: ["*"], // TODO: determine the correct resources
        }),
      ],
    });

    const dataSourceGlueRole = new Role(this, `${id}-DataSourceGlueRole`, {
      assumedBy: new ServicePrincipal("glue.amazonaws.com"),
      inlinePolicies: {
        gluePolicy: gluePolicy.document,
      },
    });

    this.dataSourceGlueRole = dataSourceGlueRole;

    const adaptDataPullCrawler = new CfnCrawler(this, "AdaptDataCrawler", {
      name: `${id}-AdaptDataCrawler`,
      role: dataSourceGlueRole.roleArn,
      configuration: JSON.stringify({
        Version: 1.0,
        Grouping: {
          TableLevelConfiguration: 2,
        },
      }),
      targets: {
        s3Targets: [
          {
            path: repositoryBucket.bucketName,
          },
        ],
      },
      databaseName: adaptDataCatalog.databaseName,
      schemaChangePolicy: {
        updateBehavior: "UPDATE_IN_DATABASE",
        deleteBehavior: "LOG",
      },
    });

    const adaptReportCrawler = new CfnCrawler(this, "AdaptReportCrawler", {
      name: `${id}-AdaptReportCrawler`,
      role: dataSourceGlueRole.roleArn,
      configuration: JSON.stringify({
        Version: 1.0,
        Grouping: {
          TableLevelConfiguration: 2,
        },
      }),
      targets: {
        s3Targets: [
          {
            path: repositoryBucket.bucketName,
          },
        ],
      },
      databaseName: adaptDataCatalog.databaseName,
      schemaChangePolicy: {
        updateBehavior: "UPDATE_IN_DATABASE",
        deleteBehavior: "LOG",
      },
    });

    const uploadedScriptObject = new BucketDeployment(
      this,
      `${id}-PythonScripts`,
      {
        sources: [Source.asset(`scripts`)],
        destinationBucket: assetsBucket,
        destinationKeyPrefix: "scripts",
      }
    );

    const adaptDataPullJob = new Job(this, `${id}-AdaptDataPullJob`, {
      jobName: `${id}-AdaptDataPullJob`,
      role: dataSourceGlueRole,
      maxRetries: 0,
      maxConcurrentRuns: 5,
      executable: JobExecutable.pythonEtl({
        glueVersion: GlueVersion.V4_0,
        pythonVersion: PythonVersion.THREE,
        script: Code.fromBucket(assetsBucket, `scripts/dataPull.py`),
      }),
      defaultArguments: {
        "--extra-py-files": `s3://${assetsBucket.bucketName}/${id}-adapt-data-pull-lib.zip`,
        "--additional-python-modules": "sql-metadata,lxml,beautifulsoup4",
        "--data-pull-s3": repositoryBucket.bucketName,
        "--data-set-id": "default",
        "--table-name": props.dynamoTables["dataSourceTable"].tableName,
        "--data-staging-s3": stagingBucket.bucketName, // change to stage bucket eventually
        "--data-pull-crawler":
          adaptDataPullCrawler.name || `${id}-adapt-data-catalog`,
        "--user": "default",
      },
      workerType: WorkerType.STANDARD,
      workerCount: 2,
    });
    this.dataPullJob = adaptDataPullJob;

    const adaptPublishReportJob = new Job(this, `${id}-AdaptPublishReportJob`, {
      jobName: `${id}-AdaptPublishReportJob`,
      role: dataSourceGlueRole,
      maxRetries: 0,
      maxConcurrentRuns: 5,
      executable: JobExecutable.pythonEtl({
        glueVersion: GlueVersion.V4_0,
        pythonVersion: PythonVersion.THREE,
        script: Code.fromBucket(assetsBucket, `scripts/publishReport.py`),
      }),
      defaultArguments: {
        "--extra-py-files": `s3://${assetsBucket.bucketName}/${id}-adapt-publish-report-lib.zip`,
        "--additional-python-modules": "sql-metadata,dar-tool,pandas",
        "--data-pull-s3": repositoryBucket.bucketName,
        "--report-id": "default",
        "--glue-database": adaptDataCatalog.databaseName,
        "--table-name": props.dynamoTables["reportTable"].tableName,
        "--report-data-s3": repositoryBucket.bucketName,
        "--published-report-data-crawler": adaptReportCrawler.name!,
        "--user": "default",
      },
      workerType: WorkerType.STANDARD,
      workerCount: 2,
    });

    const dataPullJobStateChangeRule = new Rule(
      this,
      `${id}-adapt-data-pull-state-change-rule-cdk`,
      {
        eventPattern: {
          source: ["aws.glue"],
          detailType: [`Glue Job State Change`],
          detail: {
            jobName: [adaptDataPullJob.jobName],
            state: ["SUCCEEDED", "FAILED", "STOPPED"],
          },
        },
      }
    );

    const publishReportJobStateChangeRule = new Rule(
      this,
      `${id}-adapt-publish-report-state-change-rule-cdk`,
      {
        eventPattern: {
          source: ["aws.glue"],
          detailType: [`Glue Job State Change`],
          detail: {
            jobName: [adaptPublishReportJob.jobName],
            state: ["SUCCEEDED", "FAILED", "STOPPED"],
          },
        },
      }
    );

    const dataSuppressionServiceFunction = new AdaptPythonLambda(
      this,
      "DataSuppressionService",
      {
        prefix: props.stage,
        codePath: "./handlers/dataSuppress/",
        handler: "dataSuppress.handler",
      }
    );
    this.suppressionServiceFunctionName =
      dataSuppressionServiceFunction.functionName;

    const dataPullJobStatusHandler = new AdaptNodeLambda(
      this,
      "DataPullJobStatusHandler",
      {
        prefix: props.stage,
        handler: "handler",
        entry: path.join(
          __dirname,
          ".",
          "./handlers/dataPullJobStatus/dataPullJobStatus.ts"
        ),
        attachPolicies: [
          new Policy(this, "dataPullJobStatus", {
            statements: [
              new PolicyStatement({
                actions: ["glue:GetJobRun"],
                effect: Effect.ALLOW,
                resources: ["*"],
              }),
              new PolicyStatement({
                actions: ["dyanmodb:GetItem", "dynamodb:UpdateItem"],
                effect: Effect.ALLOW,
                resources: [props.dynamoTables["dataSourceTable"].tableArn],
              }),
              new PolicyStatement({
                actions: ["dyanmodb:GetItem"],
                effect: Effect.ALLOW,
                resources: [props.dynamoTables["pushNotificationsTable"].tableArn],
              }),
            ],
          }),
        ],
        environment: {
          TABLE_NAME: props.dynamoTables["dataSourceTable"].tableName,
          NOTIFICATION_TABLE_NAME:
            props.dynamoTables["pushNotificationsTable"].tableName,
          LOG_GROUP: props.logGroup.logGroupName,
          PUBLIC_VAPID_KEY: props.vapidKeys.publicKey,
          PRIVATE_VAPID_KEY: props.vapidKeys.privateKey,
        },
        nodeModules: ["web-push"],
      }
    );
    dataPullJobStateChangeRule.addTarget(
      new LambdaFunction(dataPullJobStatusHandler)
    );

    const reportPublishJobStatusHandler = new AdaptNodeLambda(
      this,
      "ReportPublishJobStatusHandler",
      {
        prefix: props.stage,
        handler: "handler",
        entry: path.join(
          __dirname,
          ".",
          "./handlers/reportPublishJobStatus/reportPublishJobStatus.ts"
        ),
        attachPolicies: [
          new Policy(this, "reportPublishJobStatus", {
            statements: [
              new PolicyStatement({
                actions: ["glue:GetJobRun"],
                effect: Effect.ALLOW,
                resources: ["*"],
              }),
              new PolicyStatement({
                actions: ["dyanmodb:GetItem", "dynamodb:UpdateItem"],
                effect: Effect.ALLOW,
                resources: [props.dynamoTables["dataSourceTable"].tableArn],
              }),
              new PolicyStatement({
                actions: ["dyanmodb:GetItem"],
                effect: Effect.ALLOW,
                resources: [props.dynamoTables["pushNotificationsTable"].tableArn],
              }),
            ],
          }),
        ],
        environment: {
          TABLE_NAME: props.dynamoTables["dataSourceTable"].tableName,
          NOTIFICATION_TABLE_NAME:
            props.dynamoTables["pushNotificationsTable"].tableName,
          LOG_GROUP: props.logGroup.logGroupName,
          PUBLIC_VAPID_KEY: props.vapidKeys.publicKey,
          PRIVATE_VAPID_KEY: props.vapidKeys.privateKey,
        },
        nodeModules: ["web-push"],
      }
    );
    publishReportJobStateChangeRule.addTarget(
      new LambdaFunction(reportPublishJobStatusHandler)
    );
  }
}
