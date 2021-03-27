import * as React from "react";
import { Dropdown } from "azure-devops-ui/Dropdown";
import { DropdownSelection } from "azure-devops-ui/Utilities/DropdownSelection";
import { IListBoxItem } from "azure-devops-ui/ListBox";
import { PipelineRun } from "./Components/PipelineRun";
import { Spinner, SpinnerSize } from "azure-devops-ui/Spinner";
import { ISettingsService, SettingsService } from "./Services/SettingsService";
import { BuildService, IBuildService } from "./Services/BuildService";
import { Build, BuildDefinitionReference, BuildStatus } from "azure-devops-extension-api/Build";

export interface IOverviewTabState {
    pipelines: BuildDefinitionReference[];
    branches: string[];
    builds: Build[];
    ignoredStages: string[],
    ready: boolean;
}

export class OverviewTab extends React.Component<{}, IOverviewTabState> {

    private settingsService?: ISettingsService;
    private buildService?: IBuildService;

    private pipelineSelection = new DropdownSelection();
    private branchSelection = new DropdownSelection();

    private selectedPipeline: number = -1;
    private selectedBranch: string = "-1";

    constructor(props: {}) {
        super(props);

        this.state = {
            pipelines: [],
            branches: [],
            builds: [],
            ignoredStages: [],
            ready: false
        };
    }

    public componentDidMount() {
        this.initializeState();
    }

    private async initializeState(): Promise<void> {
        this.settingsService = await SettingsService.getInstance();
        this.buildService = await BuildService.getInstance();

        const buildDefinitions = await this.buildService.getBuildDefinitions();
        this.setState({ pipelines: buildDefinitions, ready: true });

        var currentPipeline = await this.settingsService.getCurrentPipeline();
        var currentBranch = await this.settingsService.getCurrentBranch();

        if (currentPipeline && currentBranch) {
            this.selectedPipeline = currentPipeline;
            this.selectedBranch = currentBranch;

            for (var index = 0; index < buildDefinitions.length; index++) {
                var buildDef = buildDefinitions[index];

                if (buildDef.id === currentPipeline) {
                    console.log(`Default Pipeline Selection: ${buildDef.id} (index ${index})`);
                    this.pipelineSelection.select(index)
                    break;
                }
            }

            var branches = await this.loadBranchesForSelectedPipeline();
            for (var index = 0; index < branches.length; index++) {
                var branch = branches[index];
                if (branch === currentBranch) {
                    console.log(`Default Branch Selection: ${branch} (index ${index})`);
                    this.branchSelection.select(index);
                    break;
                }
            }

            await this.loadBuildsForSelectedBranch();
        }
    }

    private onSelectedPipelineChanged = async (event: React.SyntheticEvent<HTMLElement>, item: IListBoxItem<BuildDefinitionReference>): Promise<void> => {
        if (item.data?.id) {
            this.selectedPipeline = item.data.id;
            this.settingsService?.setCurrentPipeline(this.selectedPipeline);
            
            this.selectedBranch = "";
            this.branchSelection.select(-1);
            this.settingsService?.setCurrentBranch(this.selectedBranch);

            this.setState({builds: []});

            await this.loadBranchesForSelectedPipeline();
        }
    }

    private async loadBranchesForSelectedPipeline(): Promise<string[]> {
        var buildsForDefinition: Build[] = await this.buildService?.getBuildsForPipeline(this.selectedPipeline, BuildStatus.InProgress) ?? [];

        var branches: string[] = buildsForDefinition.map((build, index) => (build.sourceBranch));
        var distinctBranches = branches.filter((branch, index) => branches.indexOf(branch) === index);

        this.setState({ branches: distinctBranches });

        return distinctBranches;
    }

    private onSelectedBranchChanged = async (event: React.SyntheticEvent<HTMLElement>, item: IListBoxItem<string>): Promise<void> => {

        if (item.data) {
            this.selectedBranch = item.data;

            this.settingsService?.setCurrentBranch(this.selectedBranch);

            await this.loadBuildsForSelectedBranch();
        }
    }

    private async loadBuildsForSelectedBranch() {
        var buildsForBranch: Build[] = await this.buildService?.getBuildsForPipeline(this.selectedPipeline, BuildStatus.InProgress, this.selectedBranch, 10) ?? [];
        
        var stagesToIgnore = await this.settingsService?.getIgnoredStagesForPipeline(this.selectedPipeline) ?? [];

        this.setState({ builds: buildsForBranch, ignoredStages: stagesToIgnore })
    }

    public render(): JSX.Element {

        const { pipelines, branches, builds, ignoredStages, ready } = this.state;

        if (!ready) {
            return (
                <div className="page-content flex-center">
                    <div className="flex-row">
                        <Spinner label="Loading" size={SpinnerSize.large} />
                    </div>
                </div>
            )
        } else {
            return (
                <div className="page-content page-content-top flex-column rhythm-vertical-16">
                    <div className="flex-row" style={{ margin: "8px", alignItems: "center" }}>
                        <div style={{ margin: "8px" }}>
                            <Dropdown<BuildDefinitionReference>
                                className="example-dropdown"
                                placeholder="Pick your Pipeline"
                                items={
                                    pipelines.map((pipeline, index) => (
                                        { id: `${pipeline.id}`, text: pipeline.name, data: pipeline }
                                    ))
                                }
                                onSelect={this.onSelectedPipelineChanged}
                                selection={this.pipelineSelection}
                            />
                        </div>

                        <div style={{ margin: "8px" }}>
                            <Dropdown<string>
                                className="example-dropdown"
                                placeholder="Pick your Branch"
                                items={
                                    branches.map((branch, index) => (
                                        { id: branch, text: branch, data: branch }
                                    ))
                                }
                                onSelect={this.onSelectedBranchChanged}
                                selection={this.branchSelection}
                            />
                        </div>
                    </div>


                    {builds.map((build, index) => (
                        <PipelineRun
                            build={build} ignoredStages={ignoredStages} />
                    ))}
                </div>
            );
        }
    }
}