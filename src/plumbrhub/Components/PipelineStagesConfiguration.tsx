import { BuildDefinitionReference } from "azure-devops-extension-api/Build/Build";
import { Button } from "azure-devops-ui/Button";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { FormItem } from "azure-devops-ui/FormItem";
import { TextField, TextFieldWidth } from "azure-devops-ui/TextField";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import React from "react";
import { ISettingsService, SettingsService } from "../Services/SettingsService";
import PipelineStageConfiguration from "./PipelineStageConfiguration";

export interface IPipelineStagesConfigurationProps {
    buildDefinition: BuildDefinitionReference,
}

export interface IPipelineStagesConfigurationState {
    stagesWithCustomConfig: ArrayItemProvider<string>,
    selectedItem: ObservableValue<string>
}

export class PipelineStagesConfiguration extends React.Component<IPipelineStagesConfigurationProps, IPipelineStagesConfigurationState> {
    private settingsService?: ISettingsService;

    private stageWithCustomConfig = new ObservableValue<string>("");

    constructor(props: IPipelineStagesConfigurationProps) {
        super(props);

        this.state = {
            stagesWithCustomConfig: new ArrayItemProvider([]),
            selectedItem: new ObservableValue<string>("")
        }
    }

    public componentDidMount() {
        this.initializeState();
    }

    private async initializeState(): Promise<void> {
        this.settingsService = await SettingsService.getInstance();

        //var ignoredStages = await this.settingsService.getIgnoredStagesForPipeline(this.props.buildDefinition.id);
        var stagesWithCustomConfig = ["Stage2"]

        this.setState({ stagesWithCustomConfig: new ArrayItemProvider(stagesWithCustomConfig), selectedItem: new ObservableValue(stagesWithCustomConfig[0]) });
    }

    public render(): JSX.Element {

        const { stagesWithCustomConfig, selectedItem } = this.state;

        return (
            <div style={{ display: "flex-column", width: "70%" }}>
                <div style={{ display: "flex-row" }}>
                    <FormItem label="Stage with Custom Config:">
                        <TextField
                            value={this.stageWithCustomConfig}
                            width={TextFieldWidth.standard}
                            onChange={(e, newValue) => (this.stageWithCustomConfig.value = newValue)}
                        />
                    </FormItem>
                    <Button
                        ariaLabel="Add"
                        iconProps={{ iconName: "Add" }}
                        onClick={async () => await this.addCustomConfigStage()}
                    />
                    <Button
                        ariaLabel="Delete"
                        iconProps={{ iconName: "Delete" }}
                        onClick={async () => await this.removeCustomConfigStage()}
                    />
                </div>
                <PipelineStageConfiguration stagesWithConfig={stagesWithCustomConfig} selectedItem={selectedItem} />
            </div>
        );
    }

    private async addCustomConfigStage(): Promise<void> {
        var stagesWithConfig = this.state.stagesWithCustomConfig.value;
        stagesWithConfig.push(this.stageWithCustomConfig.value);

        this.setState({ stagesWithCustomConfig: new ArrayItemProvider(stagesWithConfig), selectedItem: new ObservableValue<string>(this.stageWithCustomConfig.value) })
        this.stageWithCustomConfig.value = "";

        //await this.settingsService?.setIgnoredStagesForPipeline(this.props.buildDefinition.id, stagesWithConfig);
    }

    private async removeCustomConfigStage(): Promise<void>{
        var stageConfigToRemove = this.state.selectedItem.value;
        var stagesWithConfig = this.state.stagesWithCustomConfig.value;
        const index = stagesWithConfig.indexOf(stageConfigToRemove, 0);
        if (index > -1) {
            stagesWithConfig.splice(index, 1);

            this.setState({ stagesWithCustomConfig: new ArrayItemProvider(stagesWithConfig), selectedItem: new ObservableValue<string>(stagesWithConfig[0]) })

            //await this.settingsService?.setIgnoredStagesForPipeline(this.props.buildDefinition.id, ignoredStages);
        }
    }
}