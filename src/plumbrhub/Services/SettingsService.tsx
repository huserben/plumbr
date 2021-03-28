import { CommonServiceIds, IExtensionDataManager, IExtensionDataService, IProjectInfo, IProjectPageService } from "azure-devops-extension-api";
import * as SDK from "azure-devops-extension-sdk";

export interface ISettingsService {
    getIncludedPipelines(): Promise<number[]>;
    addIncludedPipeline(pipelineId: number): Promise<void>;
    removeIncludedPipeline(pipelineId: number): Promise<void>

    getIgnoredStagesForPipeline(pipelineId: number): Promise<string[]>;
    setIgnoredStagesForPipeline(pipelineId: number, ignoredStages: string[]): Promise<void>;

    getIncludedBranches(pipelineId: number):Promise<string[]>;
    setIncludedBranches(pipelineId: number, includedBranches: string[]): Promise<void>

    getVariableGroupConfig(pipelineId: number): Promise<{ [id: string]: number[] }>;
    setVariableGroupConfig(pipelineId: number, variableGroupConfig: { [id: string]: number[] }): Promise<void>;
}

export class SettingsService implements ISettingsService {

    private static instance: SettingsService;
    private dataManager?: IExtensionDataManager;

    private includedPipelinesId: string = "";
    private pipelineSettingPrefix: string = "";

    private constructor() {

    }

    private async initialize(): Promise<void> {
        await SDK.ready();

        const accessToken = await SDK.getAccessToken();
        const extDataService = await SDK.getService<IExtensionDataService>(CommonServiceIds.ExtensionDataService);

        this.dataManager = await extDataService.getExtensionDataManager(SDK.getExtensionContext().id, accessToken);

        var projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
        var project = await projectService.getProject();

        this.includedPipelinesId = `${project?.id}IncludedPipelilnes`;
        this.pipelineSettingPrefix = `${project?.id}Pipelines`
    }

    public static async getInstance(): Promise<ISettingsService> {
        if (!SettingsService.instance) {
            SettingsService.instance = new SettingsService();

            await SettingsService.instance.initialize();
        }

        return SettingsService.instance;
    }

    public async getIncludedPipelines(): Promise<number[]> {
        var includedPipelines = await this.dataManager?.getValue<number[]>(this.includedPipelinesId);

        if (includedPipelines) {
            return includedPipelines;
        }

        return [];
    }

    public async setIncludedPipelines(includedPipelines: number[]): Promise<void> {
        await this.dataManager?.setValue<number[]>(this.includedPipelinesId, includedPipelines);
    }

    public async getIncludedBranches(pipelineId: number): Promise<string[]> {
        var includedBranches = await this.dataManager?.getValue<string[]>(`${this.pipelineSettingPrefix}${pipelineId}IncludedBranches`);

        if (includedBranches) {
            return includedBranches;
        }

        return [];
    }
    
    public async setIncludedBranches(pipelineId: number, includedBranches: string[]): Promise<void> {
        await this.dataManager?.setValue<string[]>(`${this.pipelineSettingPrefix}${pipelineId}IncludedBranches`, includedBranches);
    }

    public async addIncludedPipeline(pipelineId: number): Promise<void> {
        var includedPipelines = await this.getIncludedPipelines();
        includedPipelines.push(pipelineId);

        await this.setIncludedPipelines(includedPipelines);
    }

    public async removeIncludedPipeline(pipelineId: number): Promise<void> {
        var includedPipelines = await this.getIncludedPipelines();
        const index = includedPipelines.indexOf(pipelineId, 0);
        if (index > -1) {
            includedPipelines.splice(index, 1);
        }

        await this.setIncludedPipelines(includedPipelines);
    }

    public async getIgnoredStagesForPipeline(pipelineId: number): Promise<string[]> {
        var ignoredStages = await this.dataManager?.getValue<string[]>(`${this.pipelineSettingPrefix}${pipelineId}IgnoredStages`);

        if (ignoredStages) {
            return ignoredStages;
        }

        return [];
    }

    public async setIgnoredStagesForPipeline(pipelineId: number, ignoredStages: string[]): Promise<void> {
        await this.dataManager?.setValue<string[]>(`${this.pipelineSettingPrefix}${pipelineId}IgnoredStages`, ignoredStages);
    }

    public async getVariableGroupConfig(pipelineId: number): Promise<{ [id: string]: number[] }> {
        var variableGroupConfig = await this.dataManager?.getValue<string>(`${this.pipelineSettingPrefix}${pipelineId}StageConfigString`) ?? "";

        var variableConfiguration: { [id: string]: number[] } = {};

        var stageConfigs = variableGroupConfig.split('/')
        stageConfigs.forEach(stageConfig => {
            var stageConfigSplit = stageConfig.split(':');
            var stageName = stageConfigSplit[0];
            variableConfiguration[stageName] = [];

            stageConfigSplit[1].split(',').forEach(variableGroupId => {
                variableConfiguration[stageName].push(Number.parseInt(variableGroupId));
            })
        });

        return variableConfiguration;
    }

    public async setVariableGroupConfig(pipelineId: number, variableGroupConfig: { [id: string]: number[] }): Promise<void> {

        var variableConfigString = "";

        for (const [stageId, value] of Object.entries(variableGroupConfig)) {
            if (variableConfigString.length > 0) {
                variableConfigString += "/"
            }

            variableConfigString += `${stageId}:`

            var stageVariableConfigString = "";
            value.forEach(variableConfigId => {
                if (variableConfigId !== null && variableConfigId !== NaN) {
                    if (stageVariableConfigString.length > 0) {
                        stageVariableConfigString += ","
                    }

                    stageVariableConfigString += `${variableConfigId}`
                }
            })

            variableConfigString += `${stageVariableConfigString}`
        }

        await this.dataManager?.setValue<string>(`${this.pipelineSettingPrefix}${pipelineId}StageConfigString`, variableConfigString);
    }
}