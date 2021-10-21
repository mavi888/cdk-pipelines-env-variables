#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CdkpipelinesDemoPipelineStack} from '../lib/cdkpipelines-demo-pipeline-stack';

import * as config from '../config.json'  

const app = new cdk.App();
new CdkpipelinesDemoPipelineStack(app, 'CdkpipelinesDemoPipelineStack', {
  env: { account: config.cdk_pipeline.build_environment.account, region: config.cdk_pipeline.build_environment.region },
});

app.synth();
