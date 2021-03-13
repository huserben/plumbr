import { BuildRestClient, TaskResult, TimelineRecord, TimelineRecordState } from "azure-devops-extension-api/Build";
import * as React from "react";
import { Card } from "azure-devops-ui/Card";
import { IStatusProps, Statuses, Status, StatusSize } from "azure-devops-ui/Status";
import { IHeaderCommandBarItem } from "azure-devops-ui/HeaderCommandBar";

export interface IStageComponentProps {
    currentStage: TimelineRecord,
    timelineRecords: TimelineRecord[],
    buildService?: BuildRestClient
}

export interface IStageComponentState {
    commandBarItems: IHeaderCommandBarItem[],
    approval?: TimelineRecord
}

export class StageComponent extends React.Component<IStageComponentProps, IStageComponentState> {
    constructor(props: IStageComponentProps) {
        super(props);

        this.state = {
            commandBarItems: []
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
                    text: "Approve",
                    disabled: approval.state !== TimelineRecordState.InProgress,
                    onActivate: () => {
                        alert("Approve!");
                    },
                    iconProps: {
                        iconName: "TriggerApproval"
                    }
                });
            }
        }

        this.setState({ approval: approval, commandBarItems: commandBarItems });
    }

    private renderStatus = (className?: string) => {
        var status: IStatusProps = Statuses.Skipped;
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