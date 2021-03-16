import { BuildRestClient, TaskResult, TimelineRecord, TimelineRecordState } from "azure-devops-extension-api/Build";
import * as React from "react";
import { Card } from "azure-devops-ui/Card";
import { IStatusProps, Statuses, Status, StatusSize } from "azure-devops-ui/Status";
import { IHeaderCommandBarItem } from "azure-devops-ui/HeaderCommandBar";
import * as SDK from "azure-devops-extension-sdk";
import { CoreRestClient } from "azure-devops-extension-api/Core";
import { CommonServiceIds, getClient, IGlobalMessagesService, IHostNavigationService, IHostPageLayoutService, ILocationService, IProjectPageService } from "azure-devops-extension-api";

export interface IStageComponentProps {
    currentStage: TimelineRecord,
    timelineRecords: TimelineRecord[],
    buildService?: BuildRestClient
}

export interface IStageComponentState {
    commandBarItems: IHeaderCommandBarItem[],
    currentStageStage: TimelineRecordState,
    approval?: TimelineRecord
}

export class StageComponent extends React.Component<IStageComponentProps, IStageComponentState> {
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
        var approval: TimelineRecord | undefined = undefined;
        var commandBarItems: IHeaderCommandBarItem[] = [];

        var checkPoints = this.props.timelineRecords.filter((record, index) => (
            record.parentId === this.props.currentStage.id && record.type === "Checkpoint")
        );

        if (checkPoints.length === 1) {
            var checkPoint = checkPoints[0];

            var approvals = this.props.timelineRecords.filter((record, index) => record.parentId === checkPoint.id && record.type === "Checkpoint.Approval")

            if (approvals.length === 1) {
                approval = approvals[0];

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
        }

        this.setState({ approval: approval, commandBarItems: commandBarItems });
    }

    private async onPanelClick(): Promise<void> {
        const panelService = await SDK.getService<IHostPageLayoutService>(CommonServiceIds.HostPageLayoutService);
        panelService.openPanel<boolean | undefined>(SDK.getExtensionContext().id + ".panel-content", {
            title: "My Panel",
            description: "Description of my panel",
            configuration: {
                message: "Show header description?",
                initialValue: "Some Header Description"
            },
            onClose: async (result) => {
                if (result !== undefined) {
                    console.log("Result is NOT undefined");
                    await this.onApproveStage();
                }
                else{
                    console.log("Result IS undefined")
                }
            }
        });
    }


    private async onApproveStage(): Promise<void> {
        const accessToken = await SDK.getAccessToken();
        const service: ILocationService = await SDK.getService(CommonServiceIds.LocationService);
        const hostBaseUrl = await service.getResourceAreaLocation(CoreRestClient.RESOURCE_AREA_ID);
        const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
        const project = await projectService.getProject();
        var projectId = project?.id ?? "";

        var url = `${hostBaseUrl}${projectId}/_apis/pipelines/approvals/?api-version=6.0-preview`;

        var body = [
            {
                approvalId: this.state.approval?.id,
                status: 4,
                comment: "Approval by Plumbr"
            }
        ]

        await fetch(url, {
            method: 'PATCH',
            headers: new Headers({
                'Authorization': `Basic ${btoa(`:${accessToken}`)}`,
                'Content-Type': 'application/json'
            }),
            body: JSON.stringify(body)
        })


        var adjustedCommandBarItem = this.state.commandBarItems[0]
        adjustedCommandBarItem.disabled = true;

        this.setState({ currentStageStage: TimelineRecordState.InProgress, commandBarItems: [ adjustedCommandBarItem ] });

        await this.showApprovalSuccessMessage();
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