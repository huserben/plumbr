import * as React from "react";

import { BuildDefinitionReference } from "azure-devops-extension-api/Build";
import { Card } from "azure-devops-ui/Card";
import { BuildService, IBuildService } from "./Services/BuildService";

export interface ISettingsState {
    buildPipelines: BuildDefinitionReference[]
}

export class SettingsTab extends React.Component<{}, ISettingsState> {
    private buildService?: IBuildService;

    constructor(props: {}) {
        super(props);

        this.state = {
            buildPipelines: []
        };
    }

    public componentDidMount() {
        this.initializeState();
    }

    private async initializeState(): Promise<void> {
        this.buildService = await BuildService.getInstance();

        await this.setPipelineSettingState();
    }

    private async setPipelineSettingState(): Promise<void> {
        const buildDefinitions = await this.buildService?.getBuildDefinitions() ?? [];

        this.setState({ buildPipelines: buildDefinitions });
    }

    public render(): JSX.Element {
        const { buildPipelines } = this.state;

        return (
            <div className="page-content page-content-top flex-column rhythm-vertical-16">
                { buildPipelines.map((pipeline, index) => (
                    <Card
                        titleProps={{ text: pipeline.name }}>
                    </Card>
                ))}
            </div>
        );
    }
}