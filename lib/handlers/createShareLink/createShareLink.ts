import { APIGatewayEvent, Context, Handler } from "aws-lambda";
import {
  CreateBackendResponse,
  CreateBackendErrorResponse,
  ShareReport,
} from "../../../libs/types/src";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

// Define Environment Variables
const SHARE_TABLE = process.env.SHARE_TABLE || "";
// AWS SDK Clients
const client = new DynamoDBClient({ region: 'us-east-1' });
const db = DynamoDBDocument.from(client);

export const handler: Handler = async (
  event: APIGatewayEvent,
  context: Context
) => {
  console.log(event);
  try {

    if(event.pathParameters && 'slug' in event.pathParameters){

        const getParams = {
            TableName: SHARE_TABLE,
            Key:{
                "slug": event.pathParameters['slug']
            }
          };

        const share = await db.get(getParams);

        if(!share.Item) return CreateBackendErrorResponse(404, 'share link does not exist')

        return CreateBackendResponse(200, share.Item)
    }


    if (!event?.body) {
      return CreateBackendErrorResponse(400, 'Missing body');
    }

    const body = JSON.parse(event.body) as ShareReport;

    const newSlugID = slug(8);

    const newShareItem = {
      slug: newSlugID,
      reportID: body.reportID,
      filters: body.filters
    };

    const putParams = {
      TableName: SHARE_TABLE,
      Item: newShareItem,
    };

    await db.put(putParams);
    return CreateBackendResponse(200, newSlugID);
  } catch (err) {
    console.log(err);
    return CreateBackendErrorResponse(500, 'Failed to share report');
  }
};

// from nanoid
// https://github.com/ai/nanoid/blob/main/nanoid.js
const a="useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";

export const slug=(e=21)=>{let t="",r=crypto.getRandomValues(new Uint8Array(e));for(let n=0;n<e;n++)t+=a[63&r[n]];return t};
