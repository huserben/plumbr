import { Build, BuildDefinitionReference } from "azure-devops-extension-api/Build";
import { Card } from "azure-devops-ui/Card";
import { Checkbox } from "azure-devops-ui/Checkbox";
import { Dropdown } from "azure-devops-ui/Dropdown";
import { FormItem } from "azure-devops-ui/FormItem";
import React from "react";
import { BuildService, IBuildService } from "../Services/BuildService";
import { ISettingsService, SettingsService } from "../Services/SettingsService";
import { IgnoredPiplineStage } from "./IgnoredPipelineStage";
import { PipelineStagesConfiguration } from "./PipelineStagesConfiguration";

export interface IPipelineSettingProps {
    buildDefinition: BuildDefinitionReference,
}

interface IPipelineSettingsState {
    includePipeline: boolean,
    branches: string[]
}

export class PipelineSetting extends React.Component<IPipelineSettingProps, IPipelineSettingsState> {
    private settingsService?: ISettingsService;

    constructor(props: IPipelineSettingProps) {
        super(props);

        this.state = {
            includePipeline: false,
            branches: []
        }
    }

    public componentDidMount() {
        this.initializeState();
    }

    private async initializeState(): Promise<void> {
        var buildService = await BuildService.getInstance();
        this.settingsService = await SettingsService.getInstance();

        var includedPipelines: number[] = await this.settingsService.getIncludedPipelines();

        var buildsForDefinition: Build[] = await buildService.getBuildsForPipeline(this.props.buildDefinition.id) ?? [];
        var branches: string[] = buildsForDefinition.map((build, index) => (build.sourceBranch));
        var distinctBranches = branches.filter((branch, index) => branches.indexOf(branch) === index);

        this.setState({ branches: distinctBranches, includePipeline: includedPipelines.includes(this.props.buildDefinition.id) });
    }

    private async setIncludedPipelineState(isIncluded: boolean) {
        if (isIncluded) {
            await this.settingsService?.addIncludedPipeline(this.props.buildDefinition.id);
        }
        else {
            await this.settingsService?.removeIncludedPipeline(this.props.buildDefinition.id);
        }

        this.setState({ includePipeline: isIncluded });
    }

    public render(): JSX.Element {
        const { includePipeline, branches } = this.state;

        return (
            <Card
                titleProps={{ text: this.props.buildDefinition.name }}>
                <div className="flex-column rhythm-vertical-16">
                    <div className="flex-row" style={{ margin: "8px", alignItems: "center" }}>
                        <Checkbox
                            onChange={async (event, checked) => await this.setIncludedPipelineState(checked)}
                            checked={includePipeline}
                            label="Include Pipeline"
                        />

                        <FormItem
                            label="Branches:">
                            <Dropdown
                                disabled={!includePipeline}
                                items={branches}
                                width={350}
                            />
                        </FormItem>
                    </div>

                    {includePipeline === true &&
                        <div className="flex-row" style={{ margin: "8px", alignItems: "center" }}>
                            <PipelineStagesConfiguration buildDefinition={this.props.buildDefinition} />
                            <IgnoredPiplineStage buildDefinition={this.props.buildDefinition} />
                        </div>
                    }
                </div>
            </Card>
        );
    }
}