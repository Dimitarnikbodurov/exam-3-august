import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import {Subscription, SubscriptionProtocol, Topic} from "aws-cdk-lib/aws-sns";
import {RestApi} from "aws-cdk-lib/aws-apigateway";

export class SisiJsonApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const topic = new Topic(this,'SisiTopic');
    const subscription =new Subscription(this,'SisiSubscription',{
      protocol: SubscriptionProtocol.EMAIL,
      endpoint: 'dimitarnikbodurov@gmail.com',
      topic,
    });

    const emailRecipient = 'dimitarnikbodurov@gmail.com';

    //  DynamoDB Table
    const table = new dynamodb.Table(this, 'InvalidJsonTable', {
      partitionKey: {
        name: 'PK',
        type: dynamodb.AttributeType.STRING },
      sortKey: {
        name: 'SK',
        type: dynamodb.AttributeType.STRING },
      timeToLiveAttribute: 'ExpireAt',
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });



    //  Lambda if correct body then send to email
    const handlerFunction = new lambda.Function(this, 'JsonHandlerFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'handler.ts',
      environment: {
        TABLE_NAME: table.tableName,
        EMAIL_RECIPIENT: emailRecipient,
      },
    });

    table.grantWriteData(handlerFunction);

    handlerFunction.addToRolePolicy(
        new iam.PolicyStatement({
          actions: ['ses:SendEmail'],
          resources: ['*'],
        })
    );

    //  Lambda - On Delete Notification
    const onDeleteFunction = new lambda.Function(this, 'OnDeleteFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'deleteFromDB.ts',
      environment: {
        EMAIL_RECIPIENT: emailRecipient,
      },
    });

    table.grantStreamRead(onDeleteFunction);

    onDeleteFunction.addEventSource(
        new lambdaEventSources.DynamoEventSource(table, {
          startingPosition: lambda.StartingPosition.LATEST,
          batchSize: 5,
          retryAttempts: 2,
          filters: [
            lambda.FilterCriteria.filter({
              eventName: lambda.FilterRule.isEqual('REMOVE'),
            }),
          ],
        })
    );

    onDeleteFunction.addToRolePolicy(
        new iam.PolicyStatement({
          actions: ['ses:SendEmail'],
          resources: ['*'],
        })
    );

    //  API Gateway
    const api: RestApi = new apigateway.RestApi(this, 'SisiJsonApi', );
    const resource: cdk.aws_apigateway.Resource = api.root.addResource('process');
    resource.addMethod('POST', new apigateway.LambdaIntegration(handlerFunction, {
      proxy: true,
    }));


    //  Output
    new cdk.CfnOutput(this, 'API Endpoint', {
      value: `${api.url}process`,
    });
  }
}
