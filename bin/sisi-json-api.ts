#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { SisiJsonApiStack } from '../lib/exam-3-august-stack';

const app = new cdk.App();
new SisiJsonApiStack(app, 'SisiJsonApiStack');