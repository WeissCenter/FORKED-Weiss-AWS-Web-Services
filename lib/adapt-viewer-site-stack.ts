import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as route53targets from "aws-cdk-lib/aws-route53-targets";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import { AdaptStackProps } from "./adpat-stack-props";
import { Duration } from "aws-cdk-lib";

export interface AdaptViewerStaticSiteProps extends AdaptStackProps {
  hostedZone: string;
  subDomain: string;
}

export class AdaptViewerSite extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props?: AdaptViewerStaticSiteProps,
  ) {
    super(scope, id, props);

    if (!props?.hostedZone) throw Error("No HostedZone set for deployment.");
    if (!props?.subDomain) throw Error("No sub domain set for deployment.");

    // Create a VPC
    const vpc = ec2.Vpc.fromLookup(this, `${id}-ImportVPC`, {
      isDefault: true,
    });

    // Create an ECS cluster
    const cluster = new ecs.Cluster(this, `${id}-Cluster`, { vpc });
    cluster.addCapacity(`${id}-AutoScalingGroupCapacity`, {
      instanceType: new ec2.InstanceType("t3a.large"),
      desiredCapacity: 1,
    });

    // Create an ECR repository for the Angular image
    const repository = new ecr.Repository(this, `${id}-Repo`);

    // Define the task definition
    const taskDefinition = new ecs.Ec2TaskDefinition(
      this,
      `${id}-TaskDefinition`,
    );

    // Add a container to the task definition
    taskDefinition.addContainer(`${id}-Container`, {
      image: ecs.ContainerImage.fromEcrRepository(repository, "latest"),
      memoryLimitMiB: 3072,
      cpu: 1024,
      portMappings: [{ containerPort: 8080 }],
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: `${id}-ContainerLogStream`,
        mode: ecs.AwsLogDriverMode.NON_BLOCKING,
        maxBufferSize: cdk.Size.mebibytes(512),
      }),
    });

    // for Route53 hosted domains only
    // const hostedZone = route53.HostedZone.fromLookup(this, `${id}-Zone`, {
    //   domainName: props.hostedZone,
    // });

    // if not using Route53, a validation email will be sent to the following email addresses:
    // admin@<hostedZone>, administrator@<hostedZone>, hostmaster@<hostedZone>, postmaster@<hostedZone>, webmaster@<hostedZone>
    // the link in the email must be clicked in order to validate the certificate
    const certificate = new acm.Certificate(
      this,
      `${id}-server-wildcard-certificate`,
      {
        domainName: `${props.subDomain}.${props.hostedZone}`,
        subjectAlternativeNames: [`*.${props.subDomain}.${props.hostedZone}`],
        // validation: acm.CertificateValidation.fromDns(hostedZone) // Route53 only. DNS records must be manually added for validation
      },
    );

    // Create an ApplicationLoadBalancedEc2Service
    const alb = new ecs_patterns.ApplicationLoadBalancedEc2Service(
      this,
      `${id}-Service`,
      {
        cluster,
        taskDefinition,
        desiredCount: 1,
        minHealthyPercent: 10,
        listenerPort: 443,
        // domainName: `${props.subDomain}.${props.hostedZone}`,
        // domainZone: hostedZone,
        certificate,
        redirectHTTP: true,
      },
    );
    alb.targetGroup.configureHealthCheck({
      interval: cdk.Duration.seconds(120),
      timeout: cdk.Duration.seconds(90),
    });

    const customCachePolicy = new cloudfront.CachePolicy(
      this,
      `${id}-CustomCachePolicy`,
      {
        cachePolicyName: `${id}-CustomCachePolicy`,
        minTtl: Duration.seconds(1),
        defaultTtl: Duration.seconds(60),
        maxTtl: Duration.days(1),
        queryStringBehavior: cloudfront.CacheQueryStringBehavior.all(),
        headerBehavior: cloudfront.CacheHeaderBehavior.none(),
        cookieBehavior: cloudfront.CacheCookieBehavior.none(),
        enableAcceptEncodingGzip: true,
        enableAcceptEncodingBrotli: true,
      },
    );

    const distribution = new cloudfront.Distribution(
      this,
      `${id}-Distribution`,
      {
        defaultBehavior: {
          origin: new origins.LoadBalancerV2Origin(alb.loadBalancer, {
            protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
            keepaliveTimeout: cdk.Duration.seconds(60),
            readTimeout: cdk.Duration.seconds(60),
          }),
          cachePolicy: customCachePolicy,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        },
        httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
        domainNames: [`${props.subDomain}.${props.hostedZone}`],
        certificate: certificate,
      },
    );

    // new route53.ARecord(this, "AliasRecord", {
    //   zone: hostedZone,
    //   recordName: `${props.subDomain}.${props.hostedZone}`,
    //   target: route53.RecordTarget.fromAlias(
    //     new route53targets.CloudFrontTarget(distribution),
    //   ),
    // });
  }
}
