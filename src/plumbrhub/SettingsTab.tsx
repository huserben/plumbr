import * as React from "react";
import * as SDK from "azure-devops-extension-sdk";
import { CommonServiceIds, getClient, IExtensionDataManager, IExtensionDataService, IProjectPageService } from "azure-devops-extension-api";
import * as adoBuild from "azure-devops-extension-api/Build";

import { Button } from "azure-devops-ui/Button";
import { TextField } from "azure-devops-ui/TextField";
import { BuildDefinitionReference, BuildRestClient } from "azure-devops-extension-api/Build";

export interface ISettingsState {
    defaultPipeline?: string;
    defaultBranch?: string;
    buildDefinitions: BuildDefinitionReference[],
    ready?: boolean;
}

export class SettingsTab extends React.Component<{}, ISettingsState> {

    private readonly DefaultPipelineId: string = "DefaultPipeline";
    private readonly DefaultBranchId: string = "DefaultBranch";

    private dataManager?: IExtensionDataManager;

    constructor(props: {}) {
        super(props);
        this.state = {
            buildDefinitions: []
        };
    }

    public componentDidMount() {
        this.initializeState();
    }

    private async initializeState(): Promise<void> {
        await SDK.ready();

        await this.loadSettings();

        const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
        const project = await projectService.getProject();

        const buildService: BuildRestClient = await getClient(adoBuild.BuildRestClient)
        const buildDefinitions = await buildService.getDefinitions(project?.name ?? "");

        this.setState({ buildDefinitions: buildDefinitions })
    }

    private async loadSettings(): Promise<void> {
        const accessToken = await SDK.getAccessToken();
        const extDataService = await SDK.getService<IExtensionDataService>(CommonServiceIds.ExtensionDataService);

        this.dataManager = await extDataService.getExtensionDataManager(SDK.getExtensionContext().id, accessToken);

        this.dataManager.getValue<string>(this.DefaultPipelineId).then((data) => {
            this.setState({
                defaultPipeline: data,
                ready: true
            });
        }, () => {
            this.setState({
                defaultPipeline: "",
                ready: true
            });
        });

        this.dataManager.getValue<string>(this.DefaultBranchId).then((data) => {
            this.setState({
                defaultBranch: data,
                ready: true
            });
        }, () => {
            this.setState({
                defaultBranch: "refs/heads/main",
                ready: true
            });
        });

    }

    public render(): JSX.Element {
        const { defaultPipeline, defaultBranch, buildDefinitions, ready } = this.state;

        return (
            <div className="page-content page-content-top flex-row rhythm-horizontal-16">
                <TextField
                    label="Default Pipeline"
                    value={defaultPipeline}
                    placeholder="Default Pipeline"
                    onChange={this.onDefaultPipelineChanged}
                    disabled={!ready}
                />
                <TextField
                    label="Default Branch"
                    value={defaultBranch}
                    placeholder="refs/heads/main"
                    onChange={this.onDefaultBranchChanged}
                    disabled={!ready}
                />
                <Button
                    text="Save"
                    primary={true}
                    onClick={this.onSaveData}
                    disabled={!ready}
                />
            </div>
        );
    }

    private onDefaultPipelineChanged = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, value: string): void => {
        this.setState({ defaultPipeline: value });
    }

    private onDefaultBranchChanged = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, value: string): void => {
        this.setState({ defaultBranch: value });
    }

    private onSaveData = (): void => {
        const { defaultPipeline, defaultBranch } = this.state;
        this.setState({ ready: false });

        this.dataManager!.setValue<string>(this.DefaultPipelineId, defaultPipeline || "").then(() => {
            this.setState({
                ready: true,
            });
        });

        this.dataManager!.setValue<string>(this.DefaultBranchId, defaultBranch || "").then(() => {
            this.setState({
                ready: true,
            });
        });
    }
}