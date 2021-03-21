import { CommonServiceIds, IExtensionDataManager, IExtensionDataService, IProjectInfo, IProjectPageService } from "azure-devops-extension-api";
import * as SDK from "azure-devops-extension-sdk";

export interface ISettingsService {
    getCurrentPipeline(): Promise<number>;
    setCurrentPipeline(pipelineId: number): Promise<void>;

    getCurrentBranch(): Promise<string>;
    setCurrentBranch(branch: string): Promise<void>;

    getIgnoredStagesForPipeline(pipelineId: number): Promise<string[]>;
    setIgnoredStagesForPipeline(pipelineId: number, ignoredStages: string[]): Promise<void>;

    getVariableGroupConfig(pipelineId: number): Promise<{ [id: string]: number[] }>;
    setVariableGroupConfig(pipelineId: number, variableGroupConfig: { [id: string]: number[] }): Promise<void>;
}

export class SettingsService implements ISettingsService {

    private static instance: SettingsService;

    private dataManager?: IExtensionDataManager;

    private currentPipelineId: string = "";
    private currentBranchId: string = "";

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

        this.currentPipelineId = `${project?.id}CurrentPipeline`;
        this.currentBranchId = `${project?.id}CurrentBranch`;
        this.pipelineSettingPrefix = `${project?.id}Pipelines`
    }

    public static async getInstance(): Promise<ISettingsService> {
        if (!SettingsService.instance) {
            SettingsService.instance = new SettingsService();

            await SettingsService.instance.initialize();
        }

        return SettingsService.instance;
    }

    public async getCurrentPipeline(): Promise<number> {
        var currentPipeline = await this.dataManager?.getValue<number>(this.currentPipelineId);

        if (currentPipeline) {
            return currentPipeline;
        }

        return -1;
    }

    public async setCurrentPipeline(pipelineId: number): Promise<void> {
        await this.dataManager?.setValue<number>(this.currentPipelineId, pipelineId);
    }

    public async getCurrentBranch(): Promise<string> {
        var currentBranch = await this.dataManager?.getValue<string>(this.currentBranchId);

        if (currentBranch) {
            return currentBranch;
        }

        return "";
    }


    public async setCurrentBranch(branch: string): Promise<void> {
        await this.dataManager?.setValue<string>(this.currentBranchId, branch);
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

        console.log(`Read following stage config string: ${variableGroupConfig}`);

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

        console.log(`Get stage configs for Pipeline ${pipelineId}: ${JSON.stringify(variableConfiguration)}`);

        return variableConfiguration;
    }

    public async setVariableGroupConfig(pipelineId: number, variableGroupConfig: { [id: string]: number[] }): Promise<void> {
        console.log(`Set stage configs for Pipeline ${pipelineId}: ${JSON.stringify(variableGroupConfig)}`);

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

        console.log(`Setting variable config string: ${variableConfigString}`);

        await this.dataManager?.setValue<string>(`${this.pipelineSettingPrefix}${pipelineId}StageConfigString`, variableConfigString);
    }
}