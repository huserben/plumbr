import { BuildRestClient, TaskResult, TimelineRecord, TimelineRecordState } from "azure-devops-extension-api/Build";
import * as React from "react";
import { Card } from "azure-devops-ui/Card";
import { IStatusProps, Statuses, Status, StatusSize } from "azure-devops-ui/Status";

export interface IStageComponentProps {
    currentStage: TimelineRecord,
    stages: TimelineRecord[],
    buildService?: BuildRestClient
}

export interface IStageComponentState {
    needsApproval: boolean,
    approvalState: TimelineRecordState
}

export class StageComponent extends React.Component<IStageComponentProps, IStageComponentState> {
    constructor(props: IStageComponentProps) {
        super(props);

        this.state = {
            needsApproval: false,
            approvalState: TimelineRecordState.Pending
        }
    }

    public componentDidMount() {
        this.initializeState();
    }

    public async initializeState(): Promise<void> {
        if (this.props.currentStage){
            
            var needsApproval = false;
            var approvalState = TimelineRecordState.Pending;

            var checkPoints = this.props.stages.filter((record, index) => record.parentId === this.props.currentStage.id && record.type === "Checkpoint");
            if (checkPoints.length === 1){
                var checkPoint = checkPoints[0];
                var approvals = checkPoints.filter((record, index) => record.parentId === checkPoint.id && record.type === "Checkpoint.Approval")

                if (approvals.length === 1){
                    needsApproval = true;

                    var approval = approvals[0];
                    approvalState = approval.state;
                }
            }

            this.setState({ needsApproval: needsApproval, approvalState: approvalState });
        }
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

        const { needsApproval } = this.state;

        return (
            <Card
                headerIconProps={{render: this.renderStatus}}>
                {this.props.currentStage.name} - Needs Approval: {needsApproval}</Card>
        );
    }
}