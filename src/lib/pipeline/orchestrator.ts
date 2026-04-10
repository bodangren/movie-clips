import type {
  PipelineContext,
  PipelineConfig,
  PipelineStage,
  PipelineRunResult,
  PipelineStageResult,
  PipelineError,
} from "./types";
import { DEFAULT_PIPELINE_CONFIG } from "./types";

export class PipelineOrchestrator {
  private stages: PipelineStage[];
  private config: PipelineConfig;
  private context: PipelineContext;
  private onProgress?: (stage: string, progress: number) => void;

  constructor(
    stages: PipelineStage[],
    config: Partial<PipelineConfig> = {},
    onProgress?: (stage: string, progress: number) => void,
  ) {
    this.stages = stages;
    this.config = { ...DEFAULT_PIPELINE_CONFIG, ...config };
    this.onProgress = onProgress;
    this.context = this.createInitialContext();
  }

  private createInitialContext(): PipelineContext {
    return {
      mediaItem: null,
      analysis: null,
      assets: null,
      videoSegments: null,
      finalOutput: null,
      errors: [],
      startTime: null,
      endTime: null,
    };
  }

  async run(initialContext: Partial<PipelineContext> = {}): Promise<PipelineRunResult> {
    this.context = { ...this.createInitialContext(), ...initialContext };
    this.context.startTime = Date.now();

    const completedStages: string[] = [];
    let failedStage: string | null = null;

    for (let i = 0; i < this.stages.length; i++) {
      const stage = this.stages[i];
      const stageProgress = (i / this.stages.length) * 100;

      this.reportProgress(stage.name, stageProgress);

      const result = await this.executeStageWithRetry(stage);

      if (result.success) {
        completedStages.push(stage.name);
        this.reportProgress(stage.name, ((i + 1) / this.stages.length) * 100);
      } else {
        failedStage = stage.name;
        if (result.error) {
          this.context.errors.push(result.error);
        }
        break;
      }
    }

    this.context.endTime = Date.now();

    return {
      success: failedStage === null,
      context: this.context,
      completedStages,
      failedStage,
      totalDurationMs: this.context.endTime - (this.context.startTime ?? 0),
    };
  }

  private async executeStageWithRetry(stage: PipelineStage): Promise<PipelineStageResult> {
    let lastError: PipelineError | undefined;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const result = await this.executeWithTimeout(stage);
        if (result.success) {
          return result;
        }
        lastError = result.error;
        if (lastError && !lastError.retryable) {
          break;
        }
      } catch (error) {
        lastError = {
          stage: stage.name,
          message: error instanceof Error ? error.message : String(error),
          timestamp: Date.now(),
          retryable: true,
          originalError: error,
        };
      }

      if (attempt < this.config.maxRetries) {
        await this.delay(this.config.retryDelayMs * Math.pow(2, attempt));
      }
    }

    return { success: false, error: lastError };
  }

  private async executeWithTimeout(stage: PipelineStage): Promise<PipelineStageResult> {
    return Promise.race([
      stage.execute(this.context, this.config),
      new Promise<PipelineStageResult>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Stage ${stage.name} timed out after ${this.config.timeoutMs}ms`)),
          this.config.timeoutMs,
        ),
      ),
    ]);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private reportProgress(stage: string, progress: number): void {
    if (this.onProgress) {
      this.onProgress(stage, progress);
    }
  }

  getContext(): PipelineContext {
    return this.context;
  }

  getConfig(): PipelineConfig {
    return this.config;
  }
}

export function createOrchestrator(
  stages: PipelineStage[],
  config?: Partial<PipelineConfig>,
  onProgress?: (stage: string, progress: number) => void,
): PipelineOrchestrator {
  return new PipelineOrchestrator(stages, config, onProgress);
}