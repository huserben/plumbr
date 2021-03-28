import * as React from "react";
import { PipelineRun } from "./Components/PipelineRun";
import { SettingsService } from "./Services/SettingsService";
import { BuildService, IBuildService } from "./Services/BuildService";
import { Build, BuildStatus } from "azure-devops-extension-api/Build";
import { Spinner, SpinnerSize } from "azure-devops-ui/Spinner";
import { ZeroData } from "azure-devops-ui/ZeroData";

export interface IOverviewTabState {
    builds: Build[];
    ignoredStages: { [id: string]: string[] },
    ready: boolean
}

export class OverviewTab extends React.Component<{}, IOverviewTabState> {
    private buildService?: IBuildService;

    constructor(props: {}) {
        super(props);

        this.state = {
            builds: [],
            ignoredStages: {},
            ready: false
        };
    }

    public componentDidMount() {
        this.initializeState();

        // Auto-Refresh every 60s
        setInterval(async () => {
            await this.initializeState();
        }, 60000);
    }

    private async initializeState(): Promise<void> {
        this.buildService = await BuildService.getInstance();
        var settingsService = await SettingsService.getInstance();

        var includedPipelines = await settingsService.getIncludedPipelines();

        var builds: Build[] = [];
        var ignoredStages: { [id: string]: string[] } = {}

        for (var pipelineId of includedPipelines) {
            var includedBranches = await settingsService.getIncludedBranches(pipelineId);

            for (var branch of includedBranches) {
                var runsOfPipeline = await this.buildService.getBuildsForPipeline(pipelineId, BuildStatus.InProgress, branch, 10);
                builds.push.apply(builds, runsOfPipeline);
            }

            var stagesToIgnore = await settingsService.getIgnoredStagesForPipeline(pipelineId) ?? [];
            ignoredStages[pipelineId] = stagesToIgnore
        }

        var pipelineRunSorter = function (record1: Build, record2: Build): number {
            if (record1.startTime) {
                if (record2.startTime) {
                    if (record1.startTime > record2.startTime) return -1;
                    if (record1.startTime < record2.startTime) return 1;
                    return 0;
                }

                return 1;
            }

            if (record2.startTime) {
                return -1
            }

            return 0
        }

        var buildsSortedByDate = builds.sort(pipelineRunSorter);

        this.setState({ builds: buildsSortedByDate, ignoredStages: ignoredStages, ready: true })
    }

    public render(): JSX.Element {

        const { ready, builds, ignoredStages } = this.state;
        return (
            <div className="page-content page-content-top flex-column rhythm-vertical-16">
                {!ready ?
                    <div className="flex-row" style={{ margin: "8px", alignItems: "center" }}>
                        <Spinner size={SpinnerSize.large} label="Loading Builds..." />
                    </div>
                    :
                    builds.length > 0 ?
                        builds.map((build, index) => (
                            <PipelineRun
                                build={build} ignoredStages={ignoredStages[build.definition.id]} />
                        ))
                        :
                        <div>
                            <ZeroData
                                primaryText="No Builds in Progress"
                                secondaryText="Check Settings to select which builds and branches to include"
                                imageAltText="Plubmer Icon"
                                imagePath="plumber.png"
                            />
                        </div>
                }
            </div>
        );
    }
}