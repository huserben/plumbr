import { BuildDefinitionReference } from "azure-devops-extension-api/Build";
import { Button } from "azure-devops-ui/Button";
import { Card } from "azure-devops-ui/Card";
import { TextField } from "azure-devops-ui/TextField";
import React from "react";
import { FormItem } from "azure-devops-ui/FormItem";
import { IgnoredPiplineStage } from "./IgnoredPipelineStage";

export interface IPipelineSettingProps {
    buildDefinition: BuildDefinitionReference,
}

export class PipelineSetting extends React.Component<IPipelineSettingProps> {
    

    constructor(props: IPipelineSettingProps) {
        super(props);
    }

    public componentDidMount() {
        this.initializeState();
    }

    public async initializeState(): Promise<void> {
    }

    public render(): JSX.Element {
        return (
            <Card
                titleProps={{ text: this.props.buildDefinition.name }}>
                <IgnoredPiplineStage buildDefinition={this.props.buildDefinition} />
                <div style={{ marginLeft: "10px", display: "flex-column", width: "40%" }}>
                    <FormItem label="Stage with custom config">
                        <TextField
                        />
                    </FormItem>
                    <Button
                        ariaLabel="Add"
                        iconProps={{ iconName: "Add" }}
                    />
                </div>
            </Card>
        );
    }
}