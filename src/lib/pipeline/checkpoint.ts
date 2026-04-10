import type { PipelineContext } from "./types";

const CHECKPOINT_VERSION = 1;

export interface PipelineCheckpoint {
  version: number;
  timestamp: number;
  context: PipelineContext;
  completedStages: string[];
  currentStage: string | null;
}

export class CheckpointManager {
  private storageKey: string;

  constructor(storageKey: string = "pipeline_checkpoint") {
    this.storageKey = storageKey;
  }

  async save(
    context: PipelineContext,
    completedStages: string[],
    currentStage: string | null,
  ): Promise<void> {
    const checkpoint: PipelineCheckpoint = {
      version: CHECKPOINT_VERSION,
      timestamp: Date.now(),
      context,
      completedStages,
      currentStage,
    };

    try {
      const localStorage = globalThis.localStorage;
      if (localStorage) {
        localStorage.setItem(this.storageKey, JSON.stringify(checkpoint));
      }
    } catch (error) {
      console.error("Failed to save checkpoint:", error);
    }
  }

  async load(): Promise<PipelineCheckpoint | null> {
    try {
      const localStorage = globalThis.localStorage;
      if (localStorage) {
        const data = localStorage.getItem(this.storageKey);
        if (data) {
          const checkpoint = JSON.parse(data) as PipelineCheckpoint;
          if (checkpoint.version === CHECKPOINT_VERSION) {
            return checkpoint;
          }
        }
      }
    } catch (error) {
      console.error("Failed to load checkpoint:", error);
    }
    return null;
  }

  async clear(): Promise<void> {
    try {
      const localStorage = globalThis.localStorage;
      if (localStorage) {
        localStorage.removeItem(this.storageKey);
      }
    } catch (error) {
      console.error("Failed to clear checkpoint:", error);
    }
  }

  async hasCheckpoint(): Promise<boolean> {
    const checkpoint = await this.load();
    return checkpoint !== null;
  }
}

export const defaultCheckpointManager = new CheckpointManager();