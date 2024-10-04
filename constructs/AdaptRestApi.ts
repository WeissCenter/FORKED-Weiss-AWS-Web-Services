import {
  AuthorizationType,
  Cors,
  LambdaIntegration,
  RequestAuthorizer,
  Resource,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { AdaptNodeLambda } from "./AdaptNodeLambda";
import { Construct } from "constructs";
import { request } from "http";
import { AdaptDynamoTable } from "./AdaptDynamoTable";

type PathPart = string;
type Method = "GET" | "POST" | "PUT" | "DELETE";

type AdaptApiEndpoint = {
    // These are the methods that can be called on this endpoint o
    [key in Method]?: AdaptNodeLambda;
};

type AdaptApiEndpoints = {
  [key: PathPart]: AdaptApiEndpoint;
};

interface AdaptRestApiProps {
  stage: string;
  cognitoUserPool: {
    id: string;
    clientId: string;
  };
  apiName: string;
  apiStageName: string;
  authorizer: RequestAuthorizer;
  endpoints: AdaptApiEndpoints;
}

export class AdaptRestApi extends Construct {
  api: RestApi;
  stageName: string;
  _endpoints: AdaptApiEndpoints;

  constructor(scope: Construct, id: string, props: AdaptRestApiProps) {
    super(scope, id);

    const adaptApi = new RestApi(this, "AdaptApi", {
      restApiName: props.apiName,
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
      },
      defaultMethodOptions: {
        authorizationType: AuthorizationType.CUSTOM,
        authorizer: props.authorizer,
      },
      deployOptions: {
        stageName: props.apiStageName,
      },
    });

    for (const [path, endpoint] of Object.entries(props.endpoints)) {
      const resource = adaptApi.root.resourceForPath(path);
      for (const method in endpoint) {
        resource.addMethod(method, new LambdaIntegration(endpoint[method as Method]!));
      }
    }

    this.api = adaptApi;
    this.stageName = props.apiStageName;
    this._endpoints = props.endpoints;
  }

  getLambdaFunctionForPath(path: string, method: Method): AdaptNodeLambda | undefined {
    return this._endpoints[path]?.[method];
  }
}
