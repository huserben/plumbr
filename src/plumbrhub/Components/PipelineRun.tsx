import { Build, BuildRestClient, BuildResult, BuildStatus, Timeline, TimelineRecord } from "azure-devops-extension-api/Build";
import * as React from "react";
import { Page } from "azure-devops-ui/Page";
import { CustomHeader, HeaderDescription, HeaderIcon, HeaderTitle, HeaderTitleArea, HeaderTitleRow, TitleSize } from "azure-devops-ui/Header";
import { Card } from "azure-devops-ui/Card";
import { IStatusProps, Statuses, Status, StatusSize } from "azure-devops-ui/Status";

export interface IPipelineRunProps {
    build: Build,
    projectName: string,
    buildService?: BuildRestClient
}

export interface IPipelineRunState {
    stages: TimelineRecord[]
}

export class PipelineRun extends React.Component<IPipelineRunProps, IPipelineRunState> {
    constructor(props: IPipelineRunProps) {
        super(props);

        this.state = {
            stages: []
        }
    }

    public componentDidMount() {
        this.initializeState();
    }

    public async initializeState(): Promise<void> {
        if (this.props.buildService){
            var buildTimeline : Timeline = await this.props.buildService.getBuildTimeline(this.props.projectName, this.props.build.id);
            
            var stages = buildTimeline.records.filter((record, index) => record.type === "Stage").sort((rec1, rec2) => (
                rec1.startTime?.getTime() ?? Number.MAX_VALUE - rec2.startTime?.getTime() ?? Number.MAX_VALUE
                ));
            this.setState({ stages: stages });
        }
    }

    private renderStatus = (className?: string) => {
        var status: IStatusProps = Statuses.Skipped;
        switch (this.props.build.status) {
            case BuildStatus.Completed:
                switch (this.props.build.result) {
                    case BuildResult.Succeeded:
                        status = Statuses.Success;
                        break;
                    case BuildResult.Failed:
                        status = Statuses.Failed;
                        break;
                    case BuildResult.PartiallySucceeded:
                        status = Statuses.Warning;
                        break;
                    case BuildResult.Canceled:
                        status = Statuses.Canceled
                        break;
                }

                break;
            case BuildStatus.InProgress:
                status = Statuses.Running;
                break;
            case BuildStatus.NotStarted:
                status = Statuses.Queued;
                break;
        }

        return <Status {...status} className={className} size={StatusSize.l} />;
    };

    public render(): JSX.Element {

        const { stages } = this.state;

        return (
            <Page>
                <CustomHeader className="bolt-header-with-commandbar">
                    <HeaderIcon
                        className="bolt-table-status-icon-large"
                        iconProps={{ render: this.renderStatus }}
                        titleSize={TitleSize.Large}
                    />
                    <HeaderTitleArea>
                        <HeaderTitleRow>
                            <HeaderTitle className="text-ellipsis" titleSize={TitleSize.Large}>
                                {this.props.build.buildNumber}
                            </HeaderTitle>
                        </HeaderTitleRow>
                        <HeaderDescription>
                            {this.props.build.sourceVersion}
                        </HeaderDescription>
                    </HeaderTitleArea>
                </CustomHeader>

                <div className="page-content page-content-top flex-row rhythm-horizontal-16">
                    {
                        stages.map((stage, index) => (
                            <Card>{stage.name}</Card>
                        ))
                    }
                </div>
            </Page>
        );
    }
}