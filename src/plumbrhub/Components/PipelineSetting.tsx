import { BuildDefinitionReference } from "azure-devops-extension-api/Build";
import { Button } from "azure-devops-ui/Button";
import { Card } from "azure-devops-ui/Card";
import { IListItemDetails, ListItem, ScrollableList } from "azure-devops-ui/List";
import { TextField } from "azure-devops-ui/TextField";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import React from "react";
import { ISettingsService, SettingsService } from "../Services/SettingsService";
import { FormItem } from "azure-devops-ui/FormItem";
import { ObservableValue } from "azure-devops-ui/Core/Observable";

export interface IPipelineSettingProps {
    buildDefinition: BuildDefinitionReference,
}

export interface IPipelineSettingState {
    ignoredStages: ArrayItemProvider<string>,
}

export class PipelineSetting extends React.Component<IPipelineSettingProps, IPipelineSettingState> {
    private settingsService?: ISettingsService;

    private stageToIgnore = new ObservableValue<string>("");

    constructor(props: IPipelineSettingProps) {
        super(props);

        this.state = {
            ignoredStages: new ArrayItemProvider([])
        }
    }

    public componentDidMount() {
        this.initializeState();
    }

    public async initializeState(): Promise<void> {
        this.settingsService = await SettingsService.getInstance();

        var ignoredStages = await this.settingsService.getIgnoredStagesForPipeline(this.props.buildDefinition.id);
        this.setState({ ignoredStages: new ArrayItemProvider(ignoredStages) });
    }

    public render(): JSX.Element {

        const { ignoredStages } = this.state;

        return (
            <Card
                titleProps={{ text: this.props.buildDefinition.name }}>
                <div style={{ display: "flex-column", width: "30%" }}>
                    <div>
                        <FormItem label="Stage to Ignore:">
                            <TextField                                
                                value={this.stageToIgnore}
                                onChange={(e, newValue) => (this.stageToIgnore.value = newValue)}
                            />
                        </FormItem>
                        <Button
                            ariaLabel="Add"
                            iconProps={{ iconName: "Add" }}
                            onClick={async () => await this.addIgnoredStage()}
                        />
                        <div style={{ display: "flex", height: "300px" }}>
                            <ScrollableList
                                itemProvider={ignoredStages}
                                width="100%"
                                renderRow={this.renderRow}
                            />
                        </div>
                    </div>
                </div>
            </Card>
        );
    }

    private async addIgnoredStage(): Promise<void> {
        var ignoredStages = this.state.ignoredStages.value;
        ignoredStages.push(this.stageToIgnore.value);

        this.setState({ ignoredStages: new ArrayItemProvider(ignoredStages) })
        this.stageToIgnore.value = "";

        await this.settingsService?.setIgnoredStagesForPipeline(this.props.buildDefinition.id, ignoredStages);
    }

    private async removeIgnoredStage(stageToRemove: string): Promise<void> {
        var ignoredStages = this.state.ignoredStages.value;
        const index = ignoredStages.indexOf(stageToRemove, 0);
        if (index > -1) {
            ignoredStages.splice(index, 1);

            this.setState({ ignoredStages: new ArrayItemProvider(ignoredStages) })

            await this.settingsService?.setIgnoredStagesForPipeline(this.props.buildDefinition.id, ignoredStages);
        }
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
                    <Button
                        style={{ marginLeft: "50px", padding: "10px 0px", width: "30px" }}
                        ariaLabel="Remove"
                        iconProps={{ iconName: "Delete" }}
                        onClick={async() => await this.removeIgnoredStage(item)}
                    />
                </div>
            </ListItem>
        );
    };
}