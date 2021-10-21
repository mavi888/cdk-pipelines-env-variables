import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import { Construct, SecretValue, Stack, StackProps } from '@aws-cdk/core';
import { CdkPipeline, SimpleSynthAction } from "@aws-cdk/pipelines";
import { CdkpipelinesDemoStage} from './cdkpipelines-demo-stage';
import { ShellScriptAction } from '@aws-cdk/pipelines';

import * as config from '../config.json'  

/**
 * The stack that defines the application pipeline
 */
 export class CdkpipelinesDemoPipelineStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
      super(scope, id, props);

      const sourceArtifact = new codepipeline.Artifact();
      const cloudAssemblyArtifact = new codepipeline.Artifact();

      const pipeline = new CdkPipeline(this, 'AWSCDKPipeline', {
        // The pipeline name
        pipelineName: config.cdk_pipeline.pipeline_name,
        cloudAssemblyArtifact,

        // Where the source can be found
        sourceAction: new codepipeline_actions.GitHubSourceAction({
          actionName: 'GitHub',
          output: sourceArtifact,
          oauthToken: SecretValue.secretsManager('github-token'),
          owner: config.cdk_pipeline.repository_owner,
          repo: config.cdk_pipeline.repository_name,
          branch: config.cdk_pipeline.branch
      }),

      // How it will be built and synthesized
      synthAction: SimpleSynthAction.standardNpmSynth({
        sourceArtifact,
        cloudAssemblyArtifact,
        
        // We need a build step to compile the TypeScript Lambda
        buildCommand: 'npm run build'
      }),
   });
   // This is where we add the application stages
   const preprod = new CdkpipelinesDemoStage(this, 'PreProd', {
    env: { account: config.environments.dev.env.account, region: config.environments.dev.env.region }
  });

  // put validations for the stages 
  const preprodStage = pipeline.addApplicationStage(preprod);
  
  preprodStage.addActions(new ShellScriptAction({
    actionName: 'TestService',
    useOutputs: {
      // Get the stack Output from the Stage and make it available in
      // the shell script as $ENDPOINT_URL.
      ENDPOINT_URL: pipeline.stackOutput(preprod.urlOutput),
    },
    commands: [
      // Use 'curl' to GET the given URL and fail if it returns an error
      'curl -Ssf $ENDPOINT_URL',
    ],
  }));

  pipeline.addApplicationStage(new CdkpipelinesDemoStage(this, 'Prod', {
    env: { account: config.environments.production.env.account, region: config.environments.production.env.region }
  }));
  }
}