#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Exam3AugustStack } from '../lib/exam-3-august-stack';

const app = new cdk.App();
new Exam3AugustStack(app, 'Exam3AugustStack');
