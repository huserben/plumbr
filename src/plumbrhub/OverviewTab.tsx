import * as React from "react";
import * as SDK from "azure-devops-extension-sdk";
import { CommonServiceIds, IProjectPageService, getClient } from "azure-devops-extension-api";
import * as adoBuild from "azure-devops-extension-api/Build";
import { BuildRestClient, BuildDefinitionReference } from "azure-devops-extension-api/Build";
import { Dropdown } from "azure-devops-ui/Dropdown";
import { IListBoxItem } from "azure-devops-ui/ListBox";


export interface IOverviewTabState {
    userName?: string;
    projectName?: string;
    pipelines: BuildDefinitionReference[],
    selectedPipeline?: BuildDefinitionReference
}

export class OverviewTab extends React.Component<{}, IOverviewTabState> {

    constructor(props: {}) {
        super(props);

        this.state = {
            pipelines: []
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
            
            this.setState({ projectName: project.name, pipelines: buildDefinitions });
        }
    }

    private onSelectedPipelineChanged = (event: React.SyntheticEvent<HTMLElement>, item: IListBoxItem<BuildDefinitionReference>): void => {
        this.setState({ selectedPipeline: item.data });
    }

    public render(): JSX.Element {

        const { userName, projectName, pipelines } = this.state;

        return (
            <div className="page-content page-content-top flex-column rhythm-vertical-16">
                <div>Hello, {userName}!</div>
                {
                    projectName &&
                    <div>Project: {projectName}</div>
                }
                <div className="flex-row flex-center">
                    <label htmlFor="message-level-picker">Pipeline: </label>
                    <Dropdown<BuildDefinitionReference>
                        className="margin-left-8"
                        items={
                            pipelines.map((pipeline, index) => (
                                {id: `${pipeline.id}`, text: pipeline.name, data: pipeline }
                            ))
                        }
                        onSelect={this.onSelectedPipelineChanged}
                    />
                </div>
            </div>
        );
    }
}