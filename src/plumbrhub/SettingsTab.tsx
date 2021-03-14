import * as React from "react";
import * as SDK from "azure-devops-extension-sdk";
import { CommonServiceIds, getClient, IExtensionDataManager, IExtensionDataService, IProjectPageService } from "azure-devops-extension-api";
import * as adoBuild from "azure-devops-extension-api/Build";

import { Button } from "azure-devops-ui/Button";
import { TextField } from "azure-devops-ui/TextField";
import { BuildRestClient } from "azure-devops-extension-api/Build";
import { Card } from "azure-devops-ui/Card";

export interface IStageSettings {
    stageId: number
}

export interface IPipelineSettings {
    pipelineId: number,
    pipelineName: string,
    defaultBranch: string,
    stageSettings: IStageSettings[]
}

export interface IPlumbrhubSettings {
    pipelineSettings: IPipelineSettings[]
}

export interface ISettingsState {
    settings: IPlumbrhubSettings,
    ready?: boolean;
}

export class SettingsTab extends React.Component<{}, ISettingsState> {

    private dataManager?: IExtensionDataManager;

    constructor(props: {}) {
        super(props);

        var defaultSettings: IPlumbrhubSettings = {
            pipelineSettings: []
        }

        this.state = {
            settings: defaultSettings
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

        this.dataManager.getValue<IPlumbrhubSettings>("PipelineSettings").then((settings) => {
            this.setPipelineSettingState(settings);
        }, () => {
            this.setPipelineSettingState(this.state.settings);
        });
    }

    private async setPipelineSettingState(settings: IPlumbrhubSettings): Promise<void> {
        const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
        const project = await projectService.getProject();

        const buildService: BuildRestClient = await getClient(adoBuild.BuildRestClient)
        const buildDefinitions = await buildService.getDefinitions(project?.name ?? "");

        buildDefinitions.forEach(buildDef => {
            if (settings?.pipelineSettings === undefined){
                settings = {
                    pipelineSettings: []
                }
            }
            
            if (!(settings.pipelineSettings.some(s => s.pipelineId === buildDef.id))){
                settings.pipelineSettings.push({
                    pipelineId: buildDef.id,
                    pipelineName: buildDef.name,
                    defaultBranch: "refs/heads/main",
                    stageSettings: []
                });
            }
        })

        this.setState({ ready: true, settings: settings })
    }

    public render(): JSX.Element {
        const { settings, ready } = this.state;

        return (
            <div className="page-content page-content-top flex-row rhythm-vertical-16">
                { settings?.pipelineSettings.map((pipelineSetting, index) => (
                    <Card
                        titleProps={{ text: pipelineSetting.pipelineName }}>
                        <TextField
                            label="Default Branch"
                            value={pipelineSetting.defaultBranch}
                            onChange={(e, newValue) => (settings.pipelineSettings[pipelineSetting.pipelineId].defaultBranch = newValue)}
                            placeholder="default branch"
                            disabled={!ready}
                        />
                    </Card>
                ))}
                <Button
                    text="Save"
                    primary={true}
                    onClick={this.onSaveData}
                    disabled={!ready}
                />
            </div>
        );
    }

    private onSaveData = (): void => {
        const { settings } = this.state;
        this.setState({ ready: false });

        this.dataManager!.setValue<IPlumbrhubSettings>("PipelineSettings", settings).then(() => {
            this.setState({
                ready: true,
            });
        });
    }
}