import {
  ConditionalCheckFailedException,
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument, PutCommandInput } from "@aws-sdk/lib-dynamodb";
import { readFileSync } from "fs";
import { globSync } from "glob";

const client = new DynamoDBClient({ region: "us-east-1" });

const db = DynamoDBDocument.from(client);

function putIfNotExists(Item: any, TableName: string, force = false) {
  const params: PutCommandInput = {
    TableName,
    Item,
    ConditionExpression: force ? undefined : "attribute_not_exists(id)",
  };
  return db
    .put(params)
    .then(() => {
      console.log(`Successfully put ${Item.type} ${Item.id} in ${TableName}`);
    })
    .catch((err) => {
      if (err instanceof ConditionalCheckFailedException) {
        console.log(
          `Skipping ${Item.type} ${Item.id} in ${TableName} due to existing item`,
        );
      } else {
        console.error(err);
        console.error(
          `Failed to put ${Item.type} ${Item.id} in ${TableName} using force: ${force}`,
        );
      }
    });
}

(async () => {
  const settingJSONs = globSync("./seed/AdaptSettings/*.json");
  const templateJSONs = globSync("./seed/AdaptTemplates/*.json");

  // check if dynamos already have the data needed

  for (const setting of settingJSONs) {
    const force = !setting.includes("settings.json"); // do not force put for settings.json
    const data = readFileSync(setting).toString();

    const parsedData = JSON.parse(data);
    await putIfNotExists(
      parsedData,
      `${process.env.ENVIRONMENT}-AdaptSettings`,
      force,
    );
  }

  for (const template of templateJSONs) {
    const force = true; // always force put for templates
    const data = readFileSync(template).toString();

    const parsedData = JSON.parse(data);
    await putIfNotExists(
      parsedData,
      `${process.env.ENVIRONMENT}-AdaptTemplates`,
      force,
    );
  }
})();
