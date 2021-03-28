import { BuildDefinitionReference, TimelineRecord } from "azure-devops-extension-api/Build/Build";
import { VariableGroup } from "azure-devops-extension-api/TaskAgent";
import { Card } from "azure-devops-ui/Card";
import { Checkbox } from "azure-devops-ui/Checkbox";
import { FormItem } from "azure-devops-ui/FormItem";
import { Spinner, SpinnerSize } from "azure-devops-ui/Spinner";
import React from "react";
import { ISettingsService, SettingsService } from "../Services/SettingsService";

export interface IPipelineStagesConfigurationProps {
    buildDefinition: BuildDefinitionReference,
    variableGroups: VariableGroup[],
    stages: TimelineRecord[]
}

export interface IPipelineStagesConfigurationState {
    stageConfigurations: { [id: string]: number[] },
    ignoredStages: string[]
}

export class PipelineStagesConfiguration extends React.Component<IPipelineStagesConfigurationProps, IPipelineStagesConfigurationState> {
    private settingsService?: ISettingsService;

    constructor(props: IPipelineStagesConfigurationProps) {
        super(props);

        this.state = {
            stageConfigurations: {},
            ignoredStages: []
        }
    }

    public componentDidMount() {
        this.initializeState();
    }

    private async initializeState(): Promise<void> {
        this.settingsService = await SettingsService.getInstance();

        var stagesWithCustomConfig = await this.settingsService.getVariableGroupConfig(this.props.buildDefinition.id);

        var ignoredStages = await this.settingsService.getIgnoredStagesForPipeline(this.props.buildDefinition.id);

        this.setState({ stageConfigurations: stagesWithCustomConfig, ignoredStages: ignoredStages });
    }

    public render(): JSX.Element {

        const { stageConfigurations, ignoredStages } = this.state;

        return (
            <div className="page-content page-content-top flex-row rhythm-horizontal-16">
                {
                    this.props.stages.length < 1 ?
                        <Spinner label="Loading Stage Configuration" size={SpinnerSize.large} />
                        :
                        this.props.stages.filter((stage, index) => !ignoredStages.includes(stage.identifier)).map((stage, index) => (
                            <Card
                                titleProps={{ text: `${stage.name} Variable Group Configuration` }}>
                                <div className="rhythm-vertical-8 flex-column">
                                    {this.props.variableGroups.map((vg, index) => (
                                        <Checkbox
                                            label={vg.name}
                                            checked={stageConfigurations[stage.identifier]?.includes(vg.id) ?? false}
                                            onChange={(event, checked) => this.onVariableGroupConfigChanged(checked, stage.identifier, vg.id)}
                                        />
                                    ))}
                                </div>
                            </Card>
                        ))}
            </div>
        );
    }

    private async onVariableGroupConfigChanged(isSelected: boolean, stageName: string, variableGroupId: number) {
        var stagesWithConfig = this.state.stageConfigurations;

        if (!(stageName in stagesWithConfig)) {
            stagesWithConfig[stageName] = []
        }

        if (isSelected) {
            stagesWithConfig[stageName].push(variableGroupId);
        }
        else {
            const index = stagesWithConfig[stageName].indexOf(variableGroupId, 0);
            if (index > -1) {
                stagesWithConfig[stageName].splice(index, 1);
            }
        }

        this.setState({stageConfigurations: stagesWithConfig})

        await this.settingsService?.setVariableGroupConfig(this.props.buildDefinition.id, stagesWithConfig);
    }
}