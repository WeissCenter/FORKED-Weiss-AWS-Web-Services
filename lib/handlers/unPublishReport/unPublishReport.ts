import { APIGatewayEvent, Context, Handler } from "aws-lambda";
import {
  CreateBackendResponse,
  CreateBackendErrorResponse,
  aws_generateDailyLogStreamID,
  aws_LogEvent,
  createUpdateItemFromObject,
  EventType,
  getUserDataFromEvent,
  IReport,
} from "../../../libs/types/src";
import { CloudWatchLogsClient } from "@aws-sdk/client-cloudwatch-logs";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
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
  const logStream = aws_generateDailyLogStreamID();
  const username = getUserDataFromEvent(event).username;

  try {
    const id = event.pathParameters ? event.pathParameters["reportID"] : null;
    if (!id) return CreateBackendErrorResponse(400, "missing reportID");

    if (!event?.body) return CreateBackendErrorResponse(400, "missing body");

    const body = JSON.parse(event?.body);

    if (!("justification" in body))
      return CreateBackendErrorResponse(400, "missing justification");

    const getParams = {
      TableName: REPORT_TABLE,
      Key: {
        type: "Report",
        id: `ID#${id}#Version#finalized`,
      },
    };

    const result = await db.get(getParams);

    if (!result?.Item)
      return CreateBackendErrorResponse(
        404,
        "Report does not exist or has not been published"
      );

    const report = result.Item as IReport;

    const date = Date.now();

    const updateAuditReport = {
      TableName: REPORT_TABLE,
      Key: {
        type: "Report",
        id: `ID#${report.reportID}#Version#finalized-${date}`,
      },
      ...createUpdateItemFromObject({ ...report, version: date }, [
        "id",
        "type",
      ]),
    };

    const deleteOldFinalized = {
      TableName: REPORT_TABLE,
      Key: {
        type: "Report",
        id: `ID#${report.reportID}#Version#finalized`,
      },
    };

    await Promise.all([
      db.update(updateAuditReport),
      db.delete(deleteOldFinalized),
    ]);

    await aws_LogEvent(
      cloudwatch,
      LOG_GROUP,
      logStream,
      username,
      EventType.CREATE,
      `Report ${report.reportID} was unpublished`
    );

    return CreateBackendResponse(200, "report publish process started");
  } catch (err) {
    console.log(err);
    return CreateBackendErrorResponse(500, "Failed to publish report");
  }
};
