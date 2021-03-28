import { Build, BuildDefinitionReference } from "azure-devops-extension-api/Build";
import { Card } from "azure-devops-ui/Card";
import { Checkbox } from "azure-devops-ui/Checkbox";
import React from "react";
import { BuildService, IBuildService } from "../Services/BuildService";
import { ISettingsService, SettingsService } from "../Services/SettingsService";
import { IgnoredPiplineStage } from "./IgnoredPipelineStage";
import { IncludedBranches } from "./IncludedBranches";
import { PipelineStagesConfiguration } from "./PipelineStagesConfiguration";

export interface IPipelineSettingProps {
    buildDefinition: BuildDefinitionReference,
}

interface IPipelineSettingsState {
    includePipeline: boolean,
    pipelineBuilds: Build[]
}

export class PipelineSetting extends React.Component<IPipelineSettingProps, IPipelineSettingsState> {
    private settingsService?: ISettingsService;
    private buildService?: IBuildService;

    constructor(props: IPipelineSettingProps) {
        super(props);

        this.state = {
            includePipeline: false,
            pipelineBuilds: []
        }
    }

    public componentDidMount() {
        this.initializeState();
    }

    private async initializeState(): Promise<void> {
        this.settingsService = await SettingsService.getInstance();
        this.buildService = await BuildService.getInstance();

        var includedPipelines: number[] = await this.settingsService.getIncludedPipelines();
        var isIncluded = includedPipelines.includes(this.props.buildDefinition.id);

        var builds : Build[] = [];
        if (isIncluded){
            builds = await this.buildService.getBuildsForPipeline(this.props.buildDefinition.id);
        }

        this.setState({ includePipeline: isIncluded, pipelineBuilds: builds });
    }

    private async setIncludedPipelineState(isIncluded: boolean) {
        var builds = this.state.pipelineBuilds;

        if (isIncluded) {
            await this.settingsService?.addIncludedPipeline(this.props.buildDefinition.id);

            if (builds.length < 1){
                builds = await this.buildService?.getBuildsForPipeline(this.props.buildDefinition.id) ?? [];
            }
        }
        else {
            await this.settingsService?.removeIncludedPipeline(this.props.buildDefinition.id);
        }

        this.setState({ includePipeline: isIncluded, pipelineBuilds: builds });
    }

    public render(): JSX.Element {
        const { includePipeline, pipelineBuilds } = this.state;

        return (
            <Card
                titleProps={{ text: this.props.buildDefinition.name }}>
                <div className="flex-column rhythm-vertical-16">
                    <div className="flex-row" style={{ margin: "8px", alignItems: "center" }}>
                        <Checkbox
                            onChange={async (event, checked) => await this.setIncludedPipelineState(checked)}
                            checked={includePipeline}
                            label="Include Pipeline"
                        />
                    </div>

                    {includePipeline === true &&
                        <div className="flex-row" style={{ margin: "8px", alignItems: "top" }}>
                            <PipelineStagesConfiguration buildDefinition={this.props.buildDefinition} />
                            <div className="flex-column rhythm-vertical-16" style={{ display: "flex-column", width: "50%" }}>
                                <IncludedBranches buildDefinition={this.props.buildDefinition} builds={pipelineBuilds} />
                                <IgnoredPiplineStage buildDefinition={this.props.buildDefinition} builds={pipelineBuilds} />
                            </div>
                        </div>
                    }
                </div>
            </Card>
        );
    }
}