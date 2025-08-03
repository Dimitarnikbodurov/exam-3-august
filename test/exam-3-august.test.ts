import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { SisiJsonApiStack } from '../lib/exam-3-august-stack';

test('Stack Snapshot', () => {
  const app = new cdk.App();
  const stack = new SisiJsonApiStack(app, 'TestStack');
  const template = Template.fromStack(stack);
  expect(template).toMatchSnapshot();
});