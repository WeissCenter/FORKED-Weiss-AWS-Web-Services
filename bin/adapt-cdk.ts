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

const STAGE = process.env["STAGE"] || "dev"; // default to dev
const DOMAIN_PREFIX = process.env["DOMAIN_PREFIX"] || `${STAGE}-AdaptAdmin`; // default to dev
const CALLBACK_URL = process.env["CALLBACK_URL"] || "https://dev-adaptadmin.adaptdata.org/auth/redirect"; // FIXME: variable
const PUBLIC_VAPID_KEY = process.env["PUBLIC_VAPID_KEY"] || "";
const PRIVATE_VAPID_KEY = process.env["PRIVATE_VAPID_KEY"] || "";

const USER_POOL_ID =
  process.env["COGNITO_USER_POOL_ID"] || "us-east-1_SoghcU5UV"; // default to dev
const CLIENT_ID =
  process.env["COGNITO_CLIENT_ID"] || "75u1hs7coq05nok0dv37pvo1gu"; // default to dev

const app = new cdk.App();

const cognitoStack = new AdaptCognitoStack(app, `${STAGE}-AdaptCognitoStack`, {
  stage: STAGE,
  domainPrefix: DOMAIN_PREFIX,
  includeLocalCallbackUrl: STAGE === "dev",
  callbackUrls: [
    CALLBACK_URL,
  ],
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
    // userPoolId: cognitoStack.userPoolId,
    // clientId: cognitoStack.clientId,
    userPoolId: USER_POOL_ID,
    clientId: CLIENT_ID,
  },
  stagingBucket: dataStack.stagingBucket,
  repoBucket: dataStack.repoBucket,
  queryResultBucket: dataStack.queryResultBucket,
  dataCatalog: dataStack.dataCatalog,
  crawlerRole: dataStack.dataSourceGlueRole,
  glueJob: dataStack.dataPullJob,
  suppressionServiceFunction: dataStack.suppressionServiceFunctionName,
  logGroup: loggingStack.logGroup,
});

const userPermissionStack = new AdaptUserPermissionStack(
  app,
  `${STAGE}-AdaptUserPermissionStack`,
  {
    stage: STAGE,
    // userPoolId: cognitoStack.userPoolId,
    userPoolId: USER_POOL_ID,
    restApi: apiStack.restApi,
  }
);

const staticSite = new AdaptStaticSite(app, `${STAGE}-AdaptStaticSiteStack`, {
  stage: STAGE,
});
