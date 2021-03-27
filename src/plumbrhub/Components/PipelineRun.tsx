import * as React from "react";
import { Page } from "azure-devops-ui/Page";
import { CustomHeader, HeaderDescription, HeaderIcon, HeaderTitle, HeaderTitleArea, HeaderTitleRow, TitleSize } from "azure-devops-ui/Header";
import { IStatusProps, Statuses, Status, StatusSize } from "azure-devops-ui/Status";
import { StageComponent } from "./StageComponent";
import { Link } from "azure-devops-ui/Link";
import { Build, BuildResult, BuildStatus, TimelineRecord } from "azure-devops-extension-api/Build";
import { BuildService, IBuildService } from "../Services/BuildService";

export interface IPipelineRunProps {
    build: Build,
    ignoredStages: string[]
}

export interface IPipelineRunState {
    stages: TimelineRecord[],
    timelineRecords: TimelineRecord[],
    buildMessage: string
}

export class PipelineRun extends React.Component<IPipelineRunProps, IPipelineRunState> {
    private buildService?: IBuildService;

    constructor(props: IPipelineRunProps) {
        super(props);

        this.state = {
            stages: [],
            timelineRecords: [],
            buildMessage: ""
        }
    }

    public componentDidMount() {
        this.initializeState();
    }

    public async initializeState(): Promise<void> {
        if ("ci.message" in this.props.build.triggerInfo) {
            this.setState({ buildMessage: this.props.build.triggerInfo["ci.message"] })
        }

        this.buildService = await BuildService.getInstance();

        if (this.buildService) {
            var buildTimeline = await this.buildService.getTimelineForBuild(this.props.build.id);

            var stages = buildTimeline?.records.filter((record, index) => record.type === "Stage" && !this.props.ignoredStages.includes(record.identifier)) ?? [];

            var stageSorter = function (record1: TimelineRecord, record2: TimelineRecord): number {
                if (record1.startTime) {
                    if (record2.startTime) {
                        if (record1.startTime > record2.startTime) return 1;
                        if (record1.startTime < record2.startTime) return -1;
                        return 0;
                    }

                    return -1;
                }

                if (record2.startTime) {
                    return 1
                }

                return 0
            }

            var stagesSortedByDate = stages.sort(stageSorter) ?? [];
            this.setState({ stages: stagesSortedByDate, timelineRecords: buildTimeline?.records ?? [] });
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

        const { buildMessage, stages, timelineRecords } = this.state;

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

                            <Link href={this.props.build._links.web.href}>{buildMessage} (Build {this.props.build.id})</Link>
                        </HeaderDescription>
                    </HeaderTitleArea>
                </CustomHeader>

                <div className="page-content page-content-top flex-row rhythm-horizontal-16">
                    {
                        stages.map((stage, index) => (
                            <StageComponent currentStage={stage} timelineRecords={timelineRecords} pipelineId={this.props.build.definition.id} />
                        ))
                    }
                </div>
            </Page>
        );
    }
}