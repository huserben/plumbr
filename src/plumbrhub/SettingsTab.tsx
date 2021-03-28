import * as React from "react";

import { BuildDefinitionReference } from "azure-devops-extension-api/Build";
import { BuildService } from "./Services/BuildService";
import { PipelineSetting } from "./Components/PipelineSetting";
import { VariableGroup } from "azure-devops-extension-api/TaskAgent";

export interface ISettingsState {
    buildPipelines: BuildDefinitionReference[],
    variableGroups: VariableGroup[]
}

export class SettingsTab extends React.Component<{}, ISettingsState> {
    constructor(props: {}) {
        super(props);

        this.state = {
            buildPipelines: [],
            variableGroups: []
        };
    }

    public componentDidMount() {
        this.initializeState();
    }

    private async initializeState(): Promise<void> {
        var buildService = await BuildService.getInstance();

        const buildDefinitions = await buildService.getBuildDefinitions();
        this.setState({ buildPipelines: buildDefinitions });

        var variableGroups = await buildService.getVariableGroups();
        this.setState({ variableGroups: variableGroups });
    }

    public render(): JSX.Element {
        const { buildPipelines, variableGroups } = this.state;

        return (
            <div className="page-content page-content-top flex-column rhythm-vertical-16">
                { buildPipelines.map((pipeline, index) => (
                    <PipelineSetting buildDefinition={pipeline} variableGroups={variableGroups} />
                ))}
            </div>
        );
    }
}