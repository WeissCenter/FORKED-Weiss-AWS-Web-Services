import { APIGatewayEvent, Context, Handler } from "aws-lambda";
import {
  CreateBackendResponse,
  CreateBackendErrorResponse,
  getReportFromDynamo,
  ReportVersion,
} from "../../../libs/types/src";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

// Define Environment Variables
const REPORT_TABLE = process.env.REPORT_TABLE || "";

// AWS SDK Clients
const client = new DynamoDBClient({region: 'us-east-1'});
const db = DynamoDBDocument.from(client);

export const handler: Handler = async (
  event: APIGatewayEvent,
  context: Context
) => {
  console.log(event);
  try{
    const id = event.pathParameters?.['reportID'];
    if(!id){
        return CreateBackendErrorResponse(400, 'reportID is required')
    }
    const version  = (event?.queryStringParameters?.['version'] ?? 'draft') as ReportVersion;

    const report = await getReportFromDynamo(db, REPORT_TABLE, id, version)

    return CreateBackendResponse(200, report)
}catch(err){
    console.error(err);
    return CreateBackendErrorResponse(500, 'failed to retrieve reports')
}
};
