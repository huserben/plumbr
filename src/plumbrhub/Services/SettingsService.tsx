import { CommonServiceIds, IExtensionDataManager, IExtensionDataService, IProjectInfo, IProjectPageService } from "azure-devops-extension-api";
import * as SDK from "azure-devops-extension-sdk";

export interface ISettingsService {
    getCurrentPipeline(): Promise<number>;
    setCurrentPipeline(pipelineId: number): Promise<void>;

    getCurrentBranch(): Promise<string>;
    setCurrentBranch(branch: string): Promise<void>;
}

export class SettingsService implements ISettingsService {

    private static instance: SettingsService;

    private dataManager?: IExtensionDataManager;

    private currentPipelineId: string = "";
    private currentBranchId: string = "";

    private constructor() {

    }

    private async initialize(): Promise<void> {
        await SDK.ready();

        const accessToken = await SDK.getAccessToken();
        const extDataService = await SDK.getService<IExtensionDataService>(CommonServiceIds.ExtensionDataService);

        this.dataManager = await extDataService.getExtensionDataManager(SDK.getExtensionContext().id, accessToken);

        var projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
        var project = await projectService.getProject();

        this.currentPipelineId = `${project?.id}_CurrentPipeline`;
        this.currentBranchId = `${project?.id}_CurrentBranch`;
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
}