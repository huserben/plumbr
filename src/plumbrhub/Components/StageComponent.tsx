import { BuildArtifact, TaskResult, TimelineRecord, TimelineRecordState } from "azure-devops-extension-api/Build";
import * as React from "react";
import { Card } from "azure-devops-ui/Card";
import { IStatusProps, Statuses, Status, StatusSize } from "azure-devops-ui/Status";
import { IHeaderCommandBarItem } from "azure-devops-ui/HeaderCommandBar";
import * as SDK from "azure-devops-extension-sdk";
import { CommonServiceIds, IGlobalMessagesService, IHostPageLayoutService } from "azure-devops-extension-api";
import { BuildService, IBuildService } from "../Services/BuildService";
import { ISettingsService, SettingsService } from "../Services/SettingsService";
import { IApprovePanelResult } from "../../ApprovePanel/ApprovePanel";
import { ScrollableList, IListItemDetails, ListSelection, ListItem } from "azure-devops-ui/List";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import { Icon, IconSize } from "azure-devops-ui/Icon";
import { Link } from "azure-devops-ui/Link";

export interface IStageComponentProps {
    currentStage: TimelineRecord,
    timelineRecords: TimelineRecord[],
    pipelineId: number,
    buildId: number
}

export interface IStageComponentState {
    commandBarItems: IHeaderCommandBarItem[],
    approval?: TimelineRecord,
    artifacts: ArrayItemProvider<BuildArtifact>
}

export class StageComponent extends React.Component<IStageComponentProps, IStageComponentState> {
    private buildService?: IBuildService;
    private settingsService?: ISettingsService;

    private wasManuallyApproved: boolean = false;

    constructor(props: IStageComponentProps) {
        super(props);

        this.state = {
            commandBarItems: [],
            artifacts: new ArrayItemProvider<BuildArtifact>([])
        }
    }

    public componentDidMount() {
        this.initializeState();

        // Update Stage State every 60s
        setInterval(async () => {
            await this.initializeState();
        }, 60000);
    }

    public async initializeState(): Promise<void> {
        this.buildService = await BuildService.getInstance();
        this.settingsService = await SettingsService.getInstance();

        this.wasManuallyApproved = false;

        var commandBarItems: IHeaderCommandBarItem[] = [];
        var approval: TimelineRecord | undefined = this.buildService.getApprovalForStage(this.props.timelineRecords, this.props.currentStage);

        if (approval) {
            commandBarItems.push({
                important: true,
                id: "approveStage",
                text: "Approve",
                disabled: approval.state !== TimelineRecordState.InProgress,
                onActivate: () => { this.onPanelClick() },
                iconProps: {
                    iconName: "TriggerApproval"
                }
            });
        }

        this.setState({ approval: approval, commandBarItems: commandBarItems });

        var artifactsOfStage = await this.buildService.getArtifactsForStage(this.props.buildId, this.props.timelineRecords, this.props.currentStage);
        this.setState({ artifacts: new ArrayItemProvider<BuildArtifact>(artifactsOfStage) });
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
                    for (var variableGroup of result.variableGroups) {
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

            this.wasManuallyApproved = true;
            this.setState({ commandBarItems: [adjustedCommandBarItem] });

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

        if (this.wasManuallyApproved) {
            status = Statuses.Running;
        }
        else {
            switch (this.props.currentStage.state) {
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
        }

        return <Status {...status} className={className} size={StatusSize.l} />;
    };

    public render(): JSX.Element {

        const { commandBarItems, artifacts } = this.state;

        return (
            <Card
                className="flex-grow"
                titleProps={{ text: this.props.currentStage.name }}
                headerIconProps={{ render: this.renderStatus }}
                headerCommandBarItems={commandBarItems}>
                <div style={{ display: "flex", maxHeight: "300px" }}>
                    <ScrollableList
                        itemProvider={artifacts}
                        renderRow={this.renderArtifact}
                        width="100%" />
                </div>
            </Card>
        );
    }

    private renderArtifact = (
        index: number,
        item: BuildArtifact,
        details: IListItemDetails<BuildArtifact>,
        key?: string
    ): JSX.Element => {
        return (
            <ListItem key={key || "list-item" + index} index={index} details={details}>
                <div className="flex-row h-scroll-hidden">
                    <Icon iconName="CloudDownload" />
                    <div
                        style={{ marginLeft: "10px", padding: "10px 0px" }}
                        className="flex-column h-scroll-hidden">
                        <Link href={item.resource.downloadUrl}
                            target="_blank">{item.name}</Link>
                    </div>
                </div>
            </ListItem>
        );
    };
}