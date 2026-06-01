import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';

export class ShiftAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ------------------------------------------------------------------
    // DynamoDB: single-table design
    //   PK: STORE#{storeId}#DATE#{date}
    //   SK: TYPE#{entityType}#...
    // ------------------------------------------------------------------
    const table = new dynamodb.Table(this, 'ShiftlyTable', {
      tableName: 'shiftly',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // MVP: drop table on stack delete
    });

    // ------------------------------------------------------------------
    // Lambda: FastAPI app (packaged from backend/)
    //   handler -> lambda_handler.handler (Mangum adapter)
    // ------------------------------------------------------------------
    const apiFn = new lambda.Function(this, 'ApiFunction', {
      functionName: 'shiftly-api',
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'lambda_handler.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '..', '..', 'backend')),
      memorySize: 256,
      timeout: cdk.Duration.seconds(30),
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    table.grantReadWriteData(apiFn);

    // ------------------------------------------------------------------
    // API Gateway: proxy all requests to the Lambda
    // ------------------------------------------------------------------
    const api = new apigateway.LambdaRestApi(this, 'ApiGateway', {
      restApiName: 'shiftly-api',
      handler: apiFn,
      proxy: true,
      deployOptions: {
        stageName: 'api',
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [...apigateway.Cors.DEFAULT_HEADERS, 'X-Role'],
      },
    });

    // ------------------------------------------------------------------
    // CloudFront: front the API Gateway (and later the Next.js frontend)
    // ------------------------------------------------------------------
    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      comment: 'Shiftly distribution',
      defaultBehavior: {
        origin: new origins.RestApiOrigin(api),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
      },
    });

    // ------------------------------------------------------------------
    // Outputs
    // ------------------------------------------------------------------
    new cdk.CfnOutput(this, 'TableNameOutput', { value: table.tableName });
    new cdk.CfnOutput(this, 'ApiUrlOutput', { value: api.url });
    new cdk.CfnOutput(this, 'DistributionDomainOutput', {
      value: distribution.distributionDomainName,
    });
  }
}
