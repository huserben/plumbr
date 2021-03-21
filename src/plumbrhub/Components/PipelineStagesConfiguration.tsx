import { BuildDefinitionReference } from "azure-devops-extension-api/Build/Build";
import { VariableGroup } from "azure-devops-extension-api/TaskAgent";
import { Button } from "azure-devops-ui/Button";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { Dropdown } from "azure-devops-ui/Dropdown";
import { Checkbox } from "azure-devops-ui/Checkbox";
import { FormItem } from "azure-devops-ui/FormItem";
import { IListItemDetails, ListItem, ScrollableList } from "azure-devops-ui/List";
import { TextField, TextFieldWidth } from "azure-devops-ui/TextField";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import React from "react";
import { BuildService } from "../Services/BuildService";
import { ISettingsService, SettingsService } from "../Services/SettingsService";
import { IListBoxItem } from "azure-devops-ui/ListBox";

export interface IPipelineStagesConfigurationProps {
    buildDefinition: BuildDefinitionReference,
}

export interface IPipelineStagesConfigurationState {
    variableGroups: VariableGroup[],
    stageConfigurations: { [id: string]: number[] }
}

export class PipelineStagesConfiguration extends React.Component<IPipelineStagesConfigurationProps, IPipelineStagesConfigurationState> {
    private settingsService?: ISettingsService;

    private stageWithCustomConfig = new ObservableValue<string>("");

    constructor(props: IPipelineStagesConfigurationProps) {
        super(props);

        this.state = {
            variableGroups: [],
            stageConfigurations: {}
        }
    }

    public componentDidMount() {
        this.initializeState();
    }

    private async initializeState(): Promise<void> {
        this.settingsService = await SettingsService.getInstance();

        var buildService = await BuildService.getInstance();
        var variableGroups = await buildService.getVariableGroups();

        var stagesWithCustomConfig = await this.settingsService.getVariableGroupConfig(this.props.buildDefinition.id);

        this.setState({ variableGroups: variableGroups, stageConfigurations: stagesWithCustomConfig });
    }

    public render(): JSX.Element {

        const { stageConfigurations } = this.state;

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
                </div>

                <div style={{ display: "flex", height: "300px" }}>
                    <ScrollableList
                        itemProvider={new ArrayItemProvider<string>(Object.keys(stageConfigurations))}
                        width="100%"
                        renderRow={this.renderRow}
                    />
                </div>

            </div>
        );
    }

    private async addCustomConfigStage(): Promise<void> {
        var stagesWithConfig = this.state.stageConfigurations;

        stagesWithConfig[this.stageWithCustomConfig.value] = [];

        console.log(`Add Custom config for Stage ${this.stageWithCustomConfig.value}`);

        this.setState({ stageConfigurations: stagesWithConfig})
        this.stageWithCustomConfig.value = "";
        
        await this.settingsService?.setVariableGroupConfig(this.props.buildDefinition.id, stagesWithConfig);
    }

    private async removeCustomConfigStage(stageConfigToRemove: string): Promise<void> {
        var stagesWithConfig = this.state.stageConfigurations;
        console.log(`Removing Custom config for Stage ${stageConfigToRemove}`);

        delete stagesWithConfig[stageConfigToRemove]
        this.setState({ stageConfigurations: stagesWithConfig})
        await this.settingsService?.setVariableGroupConfig(this.props.buildDefinition.id, stagesWithConfig);
    }

    private async onSelect(stageId: string, variableGroupId: number, isSelected: boolean): Promise<void> {
        var currentlySelectedVariableGroups = this.state.stageConfigurations[stageId];

        if (isSelected) {
            currentlySelectedVariableGroups.push(variableGroupId);
        }
        else {
            const index = currentlySelectedVariableGroups.indexOf(variableGroupId, 0);
            if (index > -1) {
                currentlySelectedVariableGroups.splice(index, 1);
            }
        }

        var newStageConfiguration = this.state.stageConfigurations;
        newStageConfiguration[stageId] = currentlySelectedVariableGroups;
        this.setState({stageConfigurations: newStageConfiguration})

        await this.settingsService?.setVariableGroupConfig(this.props.buildDefinition.id, newStageConfiguration)        
    }

    private renderRow = (
        index: number,
        item: string,
        details: IListItemDetails<string>,
        key?: string
    ): JSX.Element => {
        return (
            <ListItem key={key || "list-item" + index} index={index} details={details}>
                <div className="list-example-row flex-row h-scroll-hidden">
                    <div
                        style={{ marginLeft: "10px", padding: "10px 0px" }}
                        className="flex-column h-scroll-hidden" >
                        <span className="text-ellipsis">{item}</span>
                    </div>

                    <div className="rhythm-vertical-8 flex-column">
                        {this.state.variableGroups.map((varGroup, index) => (
                            <Checkbox
                                label={varGroup.name}
                                checked={this.state.stageConfigurations[item].includes(varGroup.id)}
                                onChange={(evt, isChecked) => this.onSelect(item, varGroup.id, isChecked)}
                            />
                        ))}


                        {/*<Dropdown
                            ariaLabel="Multiselect"
                            items={
                                this.state.variableGroups.map((vg, index) => (
                                    { id: `${vg.id}`, text: vg.name }
                                ))}
                            onSelect={(evt, item) => this.onSelect(item)}
                                showFilterBox={true} /> */}
                    </div>

                    <Button
                        style={{ marginLeft: "50px", padding: "10px 0px", width: "30px" }}
                        ariaLabel="Remove"
                        iconProps={{ iconName: "Delete" }}
                        onClick={async () => await this.removeCustomConfigStage(item)}
                    />
                </div>
            </ListItem>
        );
    };
}