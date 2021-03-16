import * as React from "react";
import * as SDK from "azure-devops-extension-sdk";
import { CommonServiceIds, IProjectPageService, getClient, IExtensionDataService, IExtensionDataManager, IProjectInfo } from "azure-devops-extension-api";
import * as adoBuild from "azure-devops-extension-api/Build";
import { BuildRestClient, BuildDefinitionReference, Build, BuildQueryOrder } from "azure-devops-extension-api/Build";
import { Dropdown } from "azure-devops-ui/Dropdown";
import { DropdownSelection } from "azure-devops-ui/Utilities/DropdownSelection";
import { IListBoxItem } from "azure-devops-ui/ListBox";
import { PipelineRun } from "./Components/PipelineRun";

export interface IOverviewTabState {
    userName: string;
    projectName: string;
    pipelines: BuildDefinitionReference[],
    branches: string[],
    builds: Build[],
    buildService?: BuildRestClient
}

export class OverviewTab extends React.Component<{}, IOverviewTabState> {
    private dataManager?: IExtensionDataManager;

    private pipelineSelection = new DropdownSelection();
    private branchSelection = new DropdownSelection();

    private selectedPipeline: number = -1;
    private selectedBranch: string = "-1";
    private project?: IProjectInfo;

    constructor(props: {}) {
        super(props);

        this.state = {
            userName: "",
            projectName: "",
            pipelines: [],
            branches: [],
            builds: []
        };
    }

    public componentDidMount() {
        this.initializeState();
    }

    private async initializeState(): Promise<void> {
        await SDK.ready();       

        const accessToken = await SDK.getAccessToken();
        const extDataService = await SDK.getService<IExtensionDataService>(CommonServiceIds.ExtensionDataService);

        this.dataManager = await extDataService.getExtensionDataManager(SDK.getExtensionContext().id, accessToken);

        const userName = SDK.getUser().displayName;
        this.setState({
            userName
        });

        const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
        this.project = await projectService.getProject();
        if (this.project) {
            const buildService: BuildRestClient = await getClient(adoBuild.BuildRestClient)

            const buildDefinitions = await buildService.getDefinitions(this.project.name);

            this.setState({ projectName: this.project.name, pipelines: buildDefinitions, buildService: buildService });
            
            var currentPipeline = await this.dataManager?.getValue<number>(`${this.project.id}_CurrentPipeline`);
            var currentBranch = (await this.dataManager?.getValue<string>(`${this.project.id}_CurrentBranch`));

            if (currentPipeline && currentBranch){
                this.selectedPipeline = currentPipeline;
                this.selectedBranch = currentBranch;

                for (var index = 0; index < buildDefinitions.length; index++){
                    var buildDef = buildDefinitions[index];
                    
                    if (buildDef.id === currentPipeline){
                        console.log(`Default Pipeline Selection: ${buildDef.id} (index ${index})`);
                        this.pipelineSelection.select(index)
                        break;
                    }
                }

                var branches = await this.loadBranchesForSelectedPipeline();
                for (var index = 0; index < branches.length; index++){
                    var branch = branches[index];
                    if (branch === currentBranch){
                        console.log(`Default Branch Selection: ${branch} (index ${index})`);
                        this.branchSelection.select(index);
                        break;
                    }
                }

                await this.loadBuildsForSelectedBranch();
            }
        }
    }
    
    private onSelectedPipelineChanged = async (event: React.SyntheticEvent<HTMLElement>, item: IListBoxItem<BuildDefinitionReference>): Promise<void> => {       

        if (item.data?.id) {            
            this.selectedPipeline = item.data.id;
            this.dataManager?.setValue<number>(`${this.project?.id}_CurrentPipeline`, this.selectedPipeline);

            await this.loadBranchesForSelectedPipeline();
        }
    }

    private async loadBranchesForSelectedPipeline():Promise<string[]>{
        var buildsForDefinition: Build[] = await this.state.buildService?.getBuilds(this.state.projectName, [this.selectedPipeline]) ?? [];

            var branches: string[] = buildsForDefinition.map((build, index) => (build.sourceBranch));
            var distinctBranches = branches.filter((branch, index) => branches.indexOf(branch) === index);

            this.setState({ branches: distinctBranches });

            return distinctBranches;
    }

    private onSelectedBranchChanged = async (event: React.SyntheticEvent<HTMLElement>, item: IListBoxItem<string>): Promise<void> => {

        if (item.data) {
            this.selectedBranch = item.data;
            this.dataManager?.setValue<string>(`${this.project?.id}_CurrentBranch`, this.selectedBranch);

            await this.loadBuildsForSelectedBranch();
        }
    }

    private async loadBuildsForSelectedBranch(){
        var buildsForBranch: Build[] = await this.state.buildService?.getBuilds(
            this.state.projectName, [this.selectedPipeline], undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 10, undefined, undefined, undefined, BuildQueryOrder.StartTimeDescending,  this.selectedBranch)
            ?? [];

        this.setState({ builds: buildsForBranch })

    }

    public render(): JSX.Element {

        const { userName, projectName, buildService, pipelines, branches, builds } = this.state;

        return (
            <div className="page-content page-content-top flex-column rhythm-vertical-16">
                <div>Hello, {userName}!</div>
                <div className="flex-row flex-center">
                    <div>
                        <label htmlFor="pipeline-picker">Pipeline: </label>
                        <Dropdown<BuildDefinitionReference>
                            className="margin-left-8"
                            items={
                                pipelines.map((pipeline, index) => (
                                    { id: `${pipeline.id}`, text: pipeline.name, data: pipeline }
                                ))
                            }
                            onSelect={this.onSelectedPipelineChanged}
                            selection={this.pipelineSelection}
                        />
                    </div>

                    <div>
                        <label htmlFor="branch-picker">Branch: </label>
                        <Dropdown<string>
                            className="margin-left-8"
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
                     build={build}
                     buildService={buildService}
                     projectName={projectName} />
                ))}
            </div>
        );
    }
}