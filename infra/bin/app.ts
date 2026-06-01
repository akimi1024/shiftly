#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ShiftAppStack } from '../lib/shift-app-stack';

const app = new cdk.App();

new ShiftAppStack(app, 'ShiftlyStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? 'ap-northeast-1',
  },
  description: 'Shiftly - shift adjustment app for small stores (MVP)',
});

app.synth();
