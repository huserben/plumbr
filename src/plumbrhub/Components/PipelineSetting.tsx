import { BuildDefinitionReference } from "azure-devops-extension-api/Build";
import { Button } from "azure-devops-ui/Button";
import { Card } from "azure-devops-ui/Card";
import { IListItemDetails, ListItem, ScrollableList } from "azure-devops-ui/List";
import { TextField } from "azure-devops-ui/TextField";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import React from "react";
import { BuildService, IBuildService } from "../Services/BuildService";
import { ISettingsService, SettingsService } from "../Services/SettingsService";

export interface IPipelineSettingProps {
    buildDefinition: BuildDefinitionReference,
}

export interface IPipelineSettingState {
    ignoredStages: ArrayItemProvider<string>,
}

export class PipelineSetting extends React.Component<IPipelineSettingProps, IPipelineSettingState> {
    private settingsService?: ISettingsService;
    private buildService?: IBuildService;

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
        this.buildService = await BuildService.getInstance();

        var ignoredStages = await this.settingsService.getIgnoredStagesForPipeline(this.props.buildDefinition.id);
        this.setState({ ignoredStages: new ArrayItemProvider(ignoredStages) });
    }

    public render(): JSX.Element {

        const { ignoredStages } = this.state;

        return (
            <Card
                titleProps={{ text: this.props.buildDefinition.name }}>
                <div style={{ display: "flex", height: "300px" }}>
                    <div>
                        <TextField />
                        <Button
                            ariaLabel="Add"
                            iconProps={{ iconName: "Add" }}
                            onClick={() => this.addIgnoredStage()}
                        />
                    </div>

                    <ScrollableList
                        itemProvider={ignoredStages}
                        width="100%"
                        renderRow={this.renderRow}
                    />
                </div>
            </Card>
        );
    }

    private addIgnoredStage(): void {
        var ignoredStage = "12";
        var ignoredStages = this.state.ignoredStages.value;
        ignoredStages.push(ignoredStage);

        this.setState({ ignoredStages: new ArrayItemProvider(ignoredStages) })
    }

    private removeIgnoredStage(stageToRemove: string): void {
        var ignoredStages = this.state.ignoredStages.value;
        const index = ignoredStages.indexOf(stageToRemove, 0);
        if (index > -1) {
            ignoredStages.splice(index, 1);

            this.setState({ ignoredStages: new ArrayItemProvider(ignoredStages) })
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
                        ariaLabel="Remove"
                        iconProps={{ iconName: "Delete" }}
                        onClick={() => this.removeIgnoredStage(item)}
                    />
                </div>
            </ListItem>
        );
    };
}