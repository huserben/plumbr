import { Build, BuildDefinitionReference, TimelineRecord } from "azure-devops-extension-api/Build";
import { Card } from "azure-devops-ui/Card";
import { Toggle } from "azure-devops-ui/Toggle";
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
    pipelineBuilds: Build[],
    stages: TimelineRecord[]
}

export class PipelineSetting extends React.Component<IPipelineSettingProps, IPipelineSettingsState> {
    private settingsService?: ISettingsService;
    private buildService?: IBuildService;

    constructor(props: IPipelineSettingProps) {
        super(props);

        this.state = {
            includePipeline: false,
            pipelineBuilds: [],
            stages: []
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

        this.setState({ includePipeline: isIncluded });

        if (isIncluded) {
            await this.loadPipelineDetails();
        }
    }

    private async setIncludedPipelineState(isIncluded: boolean) {
        var builds = this.state.pipelineBuilds;

        if (isIncluded) {
            await this.settingsService?.addIncludedPipeline(this.props.buildDefinition.id);

            if (builds.length < 1) {
                await this.loadPipelineDetails();
            }
        }
        else {
            await this.settingsService?.removeIncludedPipeline(this.props.buildDefinition.id);
        }

        this.setState({ includePipeline: isIncluded });
    }

    private async loadPipelineDetails(): Promise<void> {
        var builds = await this.buildService?.getBuildsForPipeline(this.props.buildDefinition.id) ?? [];
        this.setState({ pipelineBuilds: builds });

        var allStages: TimelineRecord[] = []

        for (var build of builds) {
            var buildTimeline = await this.buildService?.getTimelineForBuild(build.id);
            var stages = buildTimeline?.records.filter((record, index) => record.type === "Stage") ?? [];

            stages.forEach(stage => {
                allStages.push(stage);
            });
        }

        var distinctStages = allStages.filter((stage, index, arr) => arr.findIndex(t => t.name === stage.name) === index);
        this.setState({ stages: distinctStages })
    }

    public render(): JSX.Element {
        const { includePipeline, pipelineBuilds, stages } = this.state;

        return (
            <Card
                titleProps={{ text: this.props.buildDefinition.name }}>
                <div className="flex-column rhythm-vertical-16">
                    <div className="flex-row" style={{ margin: "8px", alignItems: "center" }}>
                        <Toggle
                            offText="Pipeline not Included"
                            onText="Pipeline Included"
                            onChange={async (event, checked) => await this.setIncludedPipelineState(checked)}
                            checked={includePipeline}
                        />
                    </div>

                    {includePipeline === true &&
                        <div className="flex-row" style={{ margin: "8px", alignItems: "top" }}>
                            <div className="flex-column rhythm-vertical-16" style={{ display: "flex-column", width: "50%", margin: "4px" }}>
                                <IncludedBranches buildDefinition={this.props.buildDefinition} builds={pipelineBuilds} />
                                <IgnoredPiplineStage buildDefinition={this.props.buildDefinition} allStages={stages} />
                            </div>
                            <div style={{ display: "flex-column", width: "50%", margin: "4px" }}>
                                <PipelineStagesConfiguration buildDefinition={this.props.buildDefinition} />
                            </div>
                        </div>
                    }
                </div>
            </Card>
        );
    }
}