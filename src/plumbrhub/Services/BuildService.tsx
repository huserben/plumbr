import { CommonServiceIds, IProjectInfo, IProjectPageService, getClient, ILocationService } from "azure-devops-extension-api";
import * as adoBuild from "azure-devops-extension-api/Build";
import * as adoTask from "azure-devops-extension-api/TaskAgent"
import { Build, BuildDefinitionReference, BuildQueryOrder, BuildRestClient, Timeline, TimelineRecord } from "azure-devops-extension-api/Build";
import { CoreRestClient } from "azure-devops-extension-api/Core";
import * as SDK from "azure-devops-extension-sdk";
import { TaskAgentRestClient, VariableGroup, VariableGroupParameters } from "azure-devops-extension-api/TaskAgent";

export interface IBuildService {
    getBuildDefinitions(): Promise<BuildDefinitionReference[]>;
    getBuildsForPipeline(pipelineId: number, branch?: string | undefined, top?: number | undefined): Promise<Build[]>;
    getTimelineForBuild(buildId: number): Promise<Timeline | undefined>;
    getApprovalForStage(timelineRecords: TimelineRecord[], stage: TimelineRecord): TimelineRecord | undefined;
    approveStage(stage: TimelineRecord, approvalComment: string): Promise<void>;
    getVariableGroups(): Promise<VariableGroup[]>;
    getVariableGroupsById(variableGroupIds: number[]): Promise<VariableGroup[]>;
    updateVariableGroup(variableGroup: VariableGroup): Promise<void>;
}

export class BuildService implements IBuildService {
    private static instance: BuildService;

    private project?: IProjectInfo;
    private buildService?: BuildRestClient;
    private taskService?: TaskAgentRestClient;

    private constructor() {
    }

    private async initialize(): Promise<void> {
        await SDK.ready();

        const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
        this.project = await projectService.getProject();

        this.buildService = await getClient(adoBuild.BuildRestClient)

        this.taskService = await getClient(adoTask.TaskAgentRestClient);
    }

    private getProjectName(): string {
        return this.project?.name ?? "";
    }

    public static async getInstance(): Promise<IBuildService> {
        if (!BuildService.instance) {
            BuildService.instance = new BuildService();

            await BuildService.instance.initialize();
        }

        return BuildService.instance;
    }

    public async getBuildDefinitions(): Promise<BuildDefinitionReference[]> {
        return await this.buildService?.getDefinitions(this.getProjectName()) ?? [];
    }

    public async getBuildsForPipeline(pipelineId: number, branch: string | undefined = undefined, top: number | undefined = undefined): Promise<Build[]> {
        return await this.buildService?.getBuilds(
            this.getProjectName(), [pipelineId], undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, top, undefined, undefined, undefined, BuildQueryOrder.StartTimeDescending, branch) ?? [];
    }

    public async getTimelineForBuild(buildId: number): Promise<Timeline | undefined> {
        return await this.buildService?.getBuildTimeline(this.getProjectName(), buildId);
    }

    public getApprovalForStage(timelineRecords: adoBuild.TimelineRecord[], stage: adoBuild.TimelineRecord): TimelineRecord | undefined {
        var checkPoints = timelineRecords.filter((record, index) => (
            record.parentId === stage.id && record.type === "Checkpoint")
        );

        if (checkPoints.length === 1) {
            var checkPoint = checkPoints[0];

            var approvals = timelineRecords.filter((record, index) => record.parentId === checkPoint.id && record.type === "Checkpoint.Approval")

            if (approvals.length === 1) {
                return approvals[0];
            }
        }
    }

    public async approveStage(stage: TimelineRecord, approvalComment: string): Promise<void> {
        const accessToken = await SDK.getAccessToken();
        const service: ILocationService = await SDK.getService(CommonServiceIds.LocationService);
        const hostBaseUrl = await service.getResourceAreaLocation(CoreRestClient.RESOURCE_AREA_ID);
        var projectId = this.project?.id ?? "";

        var url = `${hostBaseUrl}${projectId}/_apis/pipelines/approvals/?api-version=6.0-preview`;

        var body = [
            {
                approvalId: stage.id,
                status: 4,
                comment: approvalComment
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
    }

    public async getVariableGroups(): Promise<VariableGroup[]> {
        return await this.taskService?.getVariableGroups(this.getProjectName()) ?? [];
    }

    public async getVariableGroupsById(variableGroupIds: number[]): Promise<VariableGroup[]> {
        return await this.taskService?.getVariableGroupsById(this.getProjectName(), variableGroupIds) ?? [];
    }

    public async updateVariableGroup(variableGroup: VariableGroup): Promise<void> {
        const accessToken = await SDK.getAccessToken();
        const service: ILocationService = await SDK.getService(CommonServiceIds.LocationService);
        const hostBaseUrl = await service.getResourceAreaLocation(CoreRestClient.RESOURCE_AREA_ID);
        var projectId = this.project?.id ?? "";

        var url = `${hostBaseUrl}${projectId}/_apis/distributedtask/variablegroups/${variableGroup.id}?api-version=5.0-preview.1`;

        var body =
        {
            id: 2,
            type: "Vsts",
            name: variableGroup.name,
            variables: variableGroup.variables
        }

        await fetch(url, {
            method: 'PUT',
            headers: new Headers({
                'Authorization': `Basic ${btoa(`:${accessToken}`)}`,
                'Content-Type': 'application/json'
            }),
            body: JSON.stringify(body)
        })
    }
}