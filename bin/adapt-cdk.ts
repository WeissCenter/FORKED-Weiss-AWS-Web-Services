#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { AdaptStack } from "../lib/adapt-stack";
import { AdaptDynamoStack } from "../lib/adapt-dynamo-stack";
import { AdaptDataStack } from "../lib/adapt-data-stack";
import { AdaptLoggingStack } from "../lib/adapt-logging-stack";
import { AdaptCognitoStack } from "../lib/adapt-cognito-stack";
import { AdaptUserPermissionStack } from "../lib/adapt-user-permission-stack";
import { AdaptStaticSite } from "../lib/adapt-static-site-stack";
import { AdaptViewerStack } from "../lib/adapt-viewer-stack";
import { AdaptViewerSite } from "../lib/adapt-viewer-site-stack";

const STAGE = process.env["STAGE"] || "dev"; // default to dev
const HOSTED_ZONE = process.env["HOSTED_ZONE"] || "adaptdata.org"; // default to adaptdata.org

const VIEWER_SUB_DOMAIN = process.env["VIEWER_SUB_DOMAIN"] || `${STAGE}-viewer`;
const ADMIN_SUB_DOMAIN = process.env["ADMIN_SUB_DOMAIN"] || `${STAGE}-admin`; // default to uat-admin
const DOMAIN_PREFIX = process.env["DOMAIN_PREFIX"] || `${STAGE}-AdaptAdmin`;

const CALLBACK_URL =
  process.env["CALLBACK_URL"] ||
  `https://${ADMIN_SUB_DOMAIN}.${HOSTED_ZONE}/auth/redirect`;

console.log(
  "CALLBACK_URL: ",
  CALLBACK_URL,
  ", HOSTED_ZONE: ",
  HOSTED_ZONE,
  ", ADMIN_SUB_DOMAIN: ",
  ADMIN_SUB_DOMAIN,
);

const PUBLIC_VAPID_KEY = process.env["PUBLIC_VAPID_KEY"] || "";
const PRIVATE_VAPID_KEY = process.env["PRIVATE_VAPID_KEY"] || "";

const AWS_ACCOUNT = process.env["AWS_ACCOUNT"] || "";
const AWS_DEFAULT_REGION = process.env["AWS_DEFAULT_REGION"] || "us-east-1";

const app = new cdk.App();

const cognitoStack = new AdaptCognitoStack(app, `${STAGE}-AdaptCognitoStack`, {
  stage: STAGE,
  domainPrefix: DOMAIN_PREFIX,
  includeLocalCallbackUrl: STAGE === "dev",
  callbackUrls: [CALLBACK_URL],
});

const loggingStack = new AdaptLoggingStack(app, `${STAGE}-AdaptLoggingStack`, {
  stage: STAGE,
});

const dynamoStack = new AdaptDynamoStack(app, `${STAGE}-AdaptDynamoStack`, {
  stage: STAGE,
});

const dataStack = new AdaptDataStack(app, `${STAGE}-AdaptDataStack`, {
  stage: STAGE,
  dynamoTables: dynamoStack.tables,
  vapidKeys: {
    publicKey: PUBLIC_VAPID_KEY,
    privateKey: PRIVATE_VAPID_KEY,
  },
  logGroup: loggingStack.logGroup,
});

// stack for adapt backend resources
const apiStack = new AdaptStack(app, `${STAGE}-AdaptStack`, {
  stage: STAGE,
  dynamoTables: dynamoStack.tables,
  cognito: {
    userPoolId: cognitoStack.userPoolId,
    clientId: cognitoStack.clientId,
  },
  stagingBucket: dataStack.stagingBucket,
  repoBucket: dataStack.repoBucket,
  dataSourceGlueRole: dataStack.dataSourceGlueRole,
  queryResultBucket: dataStack.queryResultBucket,
  renderTemplateServiceFunction: dataStack.renderTemplateServiceFunction,
  dataCatalog: dataStack.dataCatalog,
  publishGlueJob: dataStack.publishJob,
  crawlerRole: dataStack.dataSourceGlueRole,
  glueJob: dataStack.dataPullJob,
  suppressionServiceFunction: dataStack.suppressionServiceFunctionName,
  logGroup: loggingStack.logGroup,
  adminReportCache: dataStack.adminReportCache,
  viewerReportCache: dataStack.viewerReportCache,
});

const userPermissionStack = new AdaptUserPermissionStack(
  app,
  `${STAGE}-AdaptUserPermissionStack`,
  {
    stage: STAGE,
    userPoolId: cognitoStack.userPoolId,
    restApi: apiStack.restApi,
  },
);

const adaptViewerStack = new AdaptViewerStack(
  app,
  `${STAGE}-AdaptViewerStack`,
  {
    dynamoTables: dynamoStack.tables,
    stage: STAGE,
    logGroup: loggingStack.logGroup,
    dataCatalog: dataStack.dataCatalog,
    queryResultBucket: dataStack.queryResultBucket,
    renderTemplateServiceFunction: dataStack.renderTemplateServiceFunction,
    reportCache: dataStack.viewerReportCache,
  },
);

const adminSite = new AdaptStaticSite(app, `${STAGE}-AdaptStaticSiteStack`, {
  stage: STAGE,
});

const viewerSite = new AdaptViewerSite(app, `${STAGE}-ViewerSiteStack`, {
  stage: STAGE,
  hostedZone: HOSTED_ZONE,
  subDomain: VIEWER_SUB_DOMAIN,
  env: { account: AWS_ACCOUNT, region: AWS_DEFAULT_REGION },
});
