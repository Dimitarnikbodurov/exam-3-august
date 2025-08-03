- dynamodb table for storing incorrect json
-REST API  only for the  POST -requests
-Lambda function – which triggers:
    * sending email if correct JSON body
    * write in the DDB if JSON body not correct
-SNS notifications for correct JSON body
-SNS notification when incorrect JSON body is deleted from the table


APIEndpoint = https://0tbqxhnd66.execute-api.eu-central-1.amazonaws.com/prod/process


The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template
