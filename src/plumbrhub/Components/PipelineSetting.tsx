import { BuildDefinitionReference } from "azure-devops-extension-api/Build";
import { Card } from "azure-devops-ui/Card";
import React from "react";
import { IgnoredPiplineStage } from "./IgnoredPipelineStage";
import { PipelineStagesConfiguration } from "./PipelineStagesConfiguration";

export interface IPipelineSettingProps {
    buildDefinition: BuildDefinitionReference,
}

export class PipelineSetting extends React.Component<IPipelineSettingProps> {
    

    constructor(props: IPipelineSettingProps) {
        super(props);
    }

    public componentDidMount() {
    }

    public render(): JSX.Element {
        return (
            <Card
                titleProps={{ text: this.props.buildDefinition.name }}>
                <PipelineStagesConfiguration buildDefinition={this.props.buildDefinition} />
                <IgnoredPiplineStage buildDefinition={this.props.buildDefinition} />
            </Card>
        );
    }
}