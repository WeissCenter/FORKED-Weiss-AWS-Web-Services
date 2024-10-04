import { APIGatewayEvent, Context, Handler } from "aws-lambda";
import {
  CreateBackendResponse,
  CreateBackendErrorResponse,
  aws_generateDailyLogStreamID,
  aws_LogEvent,
  createUpdateItemFromObject,
  EventType,
  getReportFromDynamo,
  getUserDataFromEvent,
  IReport,
} from "../../../libs/types/src";
import { CloudWatchLogsClient } from "@aws-sdk/client-cloudwatch-logs";
import { DynamoDBClient, ReturnValue } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

// Define Environment Variables
const REPORT_TABLE = process.env.REPORT_TABLE || "";
const LOG_GROUP = process.env.LOG_GROUP || "";

// AWS SDK Clients
const client = new DynamoDBClient({ region: "us-east-1" });
const db = DynamoDBDocument.from(client);
const cloudwatch = new CloudWatchLogsClient({ region: "us-east-1" });

export const handler: Handler = async (
  event: APIGatewayEvent,
  context: Context
) => {
  console.log(event);
  try {
    const logStream = aws_generateDailyLogStreamID();
    const { username } = getUserDataFromEvent(event);

    if (!event?.body) {
      return CreateBackendErrorResponse(400, "Missing body");
    }

    const body = JSON.parse(event.body) as IReport;

    const dynamoReport = await getReportFromDynamo(
      db,
      REPORT_TABLE,
      body.reportID
    );

    if (!dynamoReport)
      return CreateBackendErrorResponse(
        404,
        `Report ${body.reportID} does not exist`
      );

    const updateReportItem = {
      updated: `${Date.now()}`,
      version: "draft",
      template: body.template,
      visibility: body.visibility,
      name: body.name,
    };

    const updateReportParams = {
      TableName: REPORT_TABLE,
      Key: {
        type: "Report",
        id: `ID#${body.reportID}#Version#draft`,
      },
      ReturnValues: ReturnValue.ALL_NEW,
      ...createUpdateItemFromObject(updateReportItem),
    };

    const updateAuditReport = {
      TableName: REPORT_TABLE,
      Key: {
        type: "Report",
        id: `ID#${body.reportID}#Version#draft-${body.updated}`,
      },
      ...createUpdateItemFromObject(
        { ...body, version: `draft-${body.updated}` },
        ["id", "type"]
      ),
    };

    const [result, audit] = await Promise.all([
      db.update(updateReportParams),
      db.update(updateAuditReport),
    ]);

    await aws_LogEvent(
      cloudwatch,
      LOG_GROUP,
      logStream,
      username,
      EventType.CREATE,
      `Report: ${body.reportID} was edited and new draft version was created`
    );

    return CreateBackendResponse(200, result.Attributes);
  } catch (err) {
    console.log(err);
    return CreateBackendErrorResponse(500, "Failed to create report");
  }
};
