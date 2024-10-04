// @ts-nocheck // FIXME: come back and fix typescript errors
import { APIGatewayEvent, Context, Handler } from "aws-lambda";
import {
  CreateBackendResponse,
  CreateBackendErrorResponse,
} from "../../../libs/types/src";
import { AdminListGroupsForUserCommand, CognitoIdentityProviderClient, ListUsersCommand } from "@aws-sdk/client-cognito-identity-provider";

// Define Environment Variables
const USER_POOL_ID = process.env.USER_POOL || "";
const ROLE_NAMES = new Set(['admin', 'editor', 'reader']); // FIXME: correct Role Names

// AWS SDK Clients
const client = new CognitoIdentityProviderClient();

export const handler: Handler = async (
  event: APIGatewayEvent,
  context: Context
) => {
  console.log(event);
  try {
    const command = new ListUsersCommand({
      UserPoolId: USER_POOL_ID,
    });

    const result = await client.send(command);

    const userReturnObj = await Promise.all(
      result.Users.map(async (user) => {
        const select = new Set(["given_name", "family_name", "email"]);

        const attributes = {};

        for (const attri of user.Attributes) {
          if (select.has(attri.Name)) attributes[attri.Name] = attri.Value;
        }

        const listGroupsCommand = new AdminListGroupsForUserCommand({
          UserPoolId: USER_POOL_ID,
          Username: user.Username,
        });

        const groupsResult = await client.send(listGroupsCommand);

        const validGroups = groupsResult.Groups.filter((grp) =>
          ROLE_NAMES.has(grp.GroupName)
        );

        // FIXME: fix the logic for determining the most senior role
        const mostSeniorRole = validGroups.reduce((accum, val) => {
          if (accum === "none") return val.GroupName;

          if (
            accum === "reader" &&
            (val.GroupName === "admin" || val.GroupName === "editor")
          )
            return val.GroupName;

          if (accum === "editor" && val.GroupName === "admin")
            return val.GroupName;

          return accum;
        }, "none");

        return {
          active: user.Enabled || false,
          role: mostSeniorRole,
          username: user.Username,
          lastLogin: user.UserLastModifiedDate.getTime(),
          attributes,
        };
      })
    );

    return CreateBackendResponse(200, userReturnObj);
  } catch (err) {
    return CreateBackendErrorResponse(500, "failed to check name unique");
  }
};
