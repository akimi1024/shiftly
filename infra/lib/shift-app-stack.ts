import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';

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
      // ビルド環境(Apple Silicon=arm64)でbundleした wheel に合わせて Lambda も arm64 に。
      architecture: lambda.Architecture.ARM_64,
      handler: 'lambda_handler.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '..', '..', 'backend'), {
        // Lambda と同じ Linux 環境(Docker)の中で依存を pip install してから同梱する。
        // これで pydantic-core などのコンパイル済みwheelが Lambda 用(Linux)で入る。
        bundling: {
          image: lambda.Runtime.PYTHON_3_12.bundlingImage,
          command: [
            'bash',
            '-c',
            'pip install -r requirements.txt -t /asset-output && cp -au . /asset-output',
          ],
        },
      }),
      memorySize: 256,
      timeout: cdk.Duration.seconds(30),
      environment: {
        TABLE_NAME: table.tableName,
        // 共有トークン。デプロイ時に API_TOKEN を export して渡す（gitには入れない）
        API_TOKEN: process.env.API_TOKEN ?? '',
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
        // コスト保護：レート上限を低めに。超過分は API Gateway が429で弾く(Lambda起動せず)。
        throttlingRateLimit: 20, // 平均 req/秒
        throttlingBurstLimit: 10, // 瞬間バースト
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [...apigateway.Cors.DEFAULT_HEADERS, 'X-Role'],
      },
    });

    // ------------------------------------------------------------------
    // S3: 静的フロント(Next.js export)の置き場（非公開、CloudFront経由のみ）
    // ------------------------------------------------------------------
    const siteBucket = new s3.Bucket(this, 'SiteBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // MVP: スタック削除でバケットも消す
      autoDeleteObjects: true,
    });

    // CloudFront Function: ディレクトリ風URLを index.html に書き換え
    //   "/" -> "/index.html", "/requirements/" -> "/requirements/index.html"
    const rewriteToIndex = new cloudfront.Function(this, 'RewriteToIndex', {
      code: cloudfront.FunctionCode.fromInline(
        [
          'function handler(event) {',
          '  var request = event.request;',
          '  var uri = request.uri;',
          "  if (uri.endsWith('/')) {",
          "    request.uri += 'index.html';",
          "  } else if (!uri.includes('.')) {",
          "    request.uri += '/index.html';",
          '  }',
          '  return request;',
          '}',
        ].join('\n')
      ),
    });

    // ------------------------------------------------------------------
    // CloudFront: フロント(S3)を配信。APIはAPI Gatewayを直叩き(別オリジン)。
    // ------------------------------------------------------------------
    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      comment: 'Shiftly distribution',
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(siteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        functionAssociations: [
          {
            function: rewriteToIndex,
            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
          },
        ],
      },
      errorResponses: [
        { httpStatus: 403, responseHttpStatus: 404, responsePagePath: '/404.html' },
        { httpStatus: 404, responseHttpStatus: 404, responsePagePath: '/404.html' },
      ],
    });

    // フロントのビルド成果物(frontend/out)をS3へアップロード + CloudFront無効化
    new s3deploy.BucketDeployment(this, 'DeploySite', {
      sources: [s3deploy.Source.asset(path.join(__dirname, '..', '..', 'frontend', 'out'))],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ['/*'],
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
