import * as React from "react";
import * as SDK from "azure-devops-extension-sdk";
import { CommonServiceIds, IProjectPageService, getClient } from "azure-devops-extension-api";
import * as adoBuild from "azure-devops-extension-api/Build";
import { BuildRestClient, BuildDefinitionReference, Build, BuildQueryOrder } from "azure-devops-extension-api/Build";
import { Dropdown } from "azure-devops-ui/Dropdown";
import { IListBoxItem } from "azure-devops-ui/ListBox";
import { PipelineRun } from "./Components/PipelineRun";

export interface IOverviewTabState {
    userName: string;
    projectName: string;
    pipelines: BuildDefinitionReference[],
    selectedPipeline: number,
    branches: string[],
    selectedBranch: string,
    builds: Build[],
    buildService?: BuildRestClient,
}

export class OverviewTab extends React.Component<{}, IOverviewTabState> {

    constructor(props: {}) {
        super(props);

        this.state = {
            userName: "",
            projectName: "",
            pipelines: [],
            selectedPipeline: -1,
            branches: [],
            selectedBranch: "-1",
            builds: []
        };
    }

    public componentDidMount() {
        this.initializeState();
    }

    private async initializeState(): Promise<void> {
        await SDK.ready();

        const userName = SDK.getUser().displayName;
        this.setState({
            userName
        });

        const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
        const project = await projectService.getProject();
        if (project) {
            const buildService: BuildRestClient = await getClient(adoBuild.BuildRestClient)

            const buildDefinitions = await buildService.getDefinitions(project.name);

            this.setState({ projectName: project.name, pipelines: buildDefinitions, buildService: buildService });
        }
    }

    private onSelectedPipelineChanged = async (event: React.SyntheticEvent<HTMLElement>, item: IListBoxItem<BuildDefinitionReference>): Promise<void> => {       

        if (item.data?.id) {
            var buildsForDefinition: Build[] = await this.state.buildService?.getBuilds(this.state.projectName, [item.data?.id]) ?? [];

            var branches: string[] = buildsForDefinition.map((build, index) => (build.sourceBranch));
            var distinctBranches = branches.filter((branch, index) => branches.indexOf(branch) === index);

            this.setState({ selectedPipeline: item.data.id, branches: distinctBranches });
        }
    }

    private onSelectedBranchChanged = async (event: React.SyntheticEvent<HTMLElement>, item: IListBoxItem<string>): Promise<void> => {

        if (item.data) {
            var buildsForBranch: Build[] = await this.state.buildService?.getBuilds(
                this.state.projectName, [this.state.selectedPipeline], undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 10, undefined, undefined, undefined, BuildQueryOrder.StartTimeDescending,  item.data)
                ?? [];

            this.setState({ selectedBranch: item.data, builds: buildsForBranch })
        }
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