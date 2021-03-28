import { TaskResult, TimelineRecord, TimelineRecordState } from "azure-devops-extension-api/Build";
import * as React from "react";
import { Card } from "azure-devops-ui/Card";
import { IStatusProps, Statuses, Status, StatusSize } from "azure-devops-ui/Status";
import { IHeaderCommandBarItem } from "azure-devops-ui/HeaderCommandBar";
import * as SDK from "azure-devops-extension-sdk";
import { CommonServiceIds, IGlobalMessagesService, IHostPageLayoutService } from "azure-devops-extension-api";
import { BuildService, IBuildService } from "../Services/BuildService";
import { ISettingsService, SettingsService } from "../Services/SettingsService";
import { IApprovePanelResult } from "../../ApprovePanel/ApprovePanel";

export interface IStageComponentProps {
    currentStage: TimelineRecord,
    timelineRecords: TimelineRecord[],
    pipelineId: number
}

export interface IStageComponentState {
    commandBarItems: IHeaderCommandBarItem[],
    currentStageStage: TimelineRecordState,
    approval?: TimelineRecord
}

export class StageComponent extends React.Component<IStageComponentProps, IStageComponentState> {
    private buildService?: IBuildService;
    private settingsService?: ISettingsService;

    constructor(props: IStageComponentProps) {
        super(props);

        this.state = {
            commandBarItems: [],
            currentStageStage: props.currentStage.state
        }
    }

    public componentDidMount() {
        this.initializeState();
    }

    public async initializeState(): Promise<void> {
        this.buildService = await BuildService.getInstance();

        this.settingsService = await SettingsService.getInstance();

        var commandBarItems: IHeaderCommandBarItem[] = [];
        var approval: TimelineRecord | undefined = this.buildService.getApprovalForStage(this.props.timelineRecords, this.props.currentStage);

        if (approval) {
            commandBarItems.push({
                important: true,
                id: "approveStage",
                text: "Promote",
                disabled: approval.state !== TimelineRecordState.InProgress,
                onActivate: () => { this.onPanelClick() },
                iconProps: {
                    iconName: "TriggerApproval"
                }
            });
        }

        this.setState({ approval: approval, commandBarItems: commandBarItems });
    }

    private async onPanelClick(): Promise<void> {
        const panelService = await SDK.getService<IHostPageLayoutService>(CommonServiceIds.HostPageLayoutService);

        var variableGroupConfiguration = await this.settingsService?.getVariableGroupConfig(this.props.pipelineId) ?? {};
        var variableGroupIds = variableGroupConfiguration[this.props.currentStage.identifier] ?? [];

        // Cleanup NaNs just in case
        var cleanedIds = variableGroupIds.filter((id, index) => !Number.isNaN(id));
        var variableGroups = await this.buildService?.getVariableGroupsById(cleanedIds);

        panelService.openPanel<IApprovePanelResult | undefined>(SDK.getExtensionContext().id + ".approve-panel", {
            title: `${this.props.currentStage.name}`,
            description: `Configure and Approve Stage`,
            configuration: {
                stage: this.props.currentStage,
                variableGroups: variableGroups
            },
            onClose: async (result) => {
                if (result !== undefined) {
                    for (var variableGroup of result.variableGroups){
                        await this.buildService?.updateVariableGroup(variableGroup);
                    }

                    await this.onApproveStage(result.approvalComment);
                }
            }
        });
    }


    private async onApproveStage(approvalComment: string): Promise<void> {
        if (this.state.approval) {
            this.buildService?.approveStage(this.state.approval, approvalComment)

            var adjustedCommandBarItem = this.state.commandBarItems[0]
            adjustedCommandBarItem.disabled = true;

            this.setState({ currentStageStage: TimelineRecordState.InProgress, commandBarItems: [adjustedCommandBarItem] });

            await this.showApprovalSuccessMessage();
        }
    }

    private showApprovalSuccessMessage = async (): Promise<void> => {
        const globalMessagesSvc = await SDK.getService<IGlobalMessagesService>(CommonServiceIds.GlobalMessagesService);
        globalMessagesSvc.addToast({
            duration: 3000,
            message: `Successfully approved Stage ${this.props.currentStage.name}`
        });
    }

    private renderStatus = (className?: string) => {
        var status: IStatusProps = Statuses.Skipped;
        switch (this.state.currentStageStage) {
            case TimelineRecordState.Completed:
                switch (this.props.currentStage.result) {
                    case TaskResult.Succeeded:
                        status = Statuses.Success;
                        break;
                    case TaskResult.Failed:
                        status = Statuses.Failed;
                        break;
                    case TaskResult.SucceededWithIssues:
                        status = Statuses.Warning;
                        break;
                    case TaskResult.Canceled:
                    case TaskResult.Abandoned:
                        status = Statuses.Canceled
                        break;
                    case TaskResult.Skipped:
                        status = Statuses.Skipped
                }

                break;
            case TimelineRecordState.InProgress:
                status = Statuses.Running;
                break;
            case TimelineRecordState.Pending:
                status = Statuses.Waiting;
                break;
        }

        return <Status {...status} className={className} size={StatusSize.l} />;
    };

    public render(): JSX.Element {

        const { commandBarItems } = this.state;

        return (
            <Card
                className="flex-grow"
                titleProps={{ text: this.props.currentStage.name }}
                headerIconProps={{ render: this.renderStatus }}
                headerCommandBarItems={commandBarItems}>
            </Card>
        );
    }
}