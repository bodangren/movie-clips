export interface PipelineHistoryEntry {
  id: string;
  mediaItemId: string | null;
  mediaTitle: string;
  status: "success" | "failed" | "cancelled";
  completedStages: string[];
  startedAt: number;
  completedAt: number;
  durationMs: number;
  outputPath: string | null;
  errorCount: number;
}

export class PipelineHistory {
  private storageKey: string;
  private maxEntries: number;

  constructor(storageKey: string = "pipeline_history", maxEntries: number = 50) {
    this.storageKey = storageKey;
    this.maxEntries = maxEntries;
  }

  async addEntry(entry: Omit<PipelineHistoryEntry, "id">): Promise<PipelineHistoryEntry> {
    const fullEntry: PipelineHistoryEntry = {
      ...entry,
      id: `run_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    };

    const history = await this.getHistory();
    history.unshift(fullEntry);

    if (history.length > this.maxEntries) {
      history.splice(this.maxEntries);
    }

    await this.saveHistory(history);
    return fullEntry;
  }

  async getHistory(): Promise<PipelineHistoryEntry[]> {
    try {
      const localStorage = globalThis.localStorage;
      if (localStorage) {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : [];
      }
    } catch (error) {
      console.error("Failed to get pipeline history:", error);
    }
    return [];
  }

  async getEntry(id: string): Promise<PipelineHistoryEntry | null> {
    const history = await this.getHistory();
    return history.find((entry) => entry.id === id) ?? null;
  }

  async clearHistory(): Promise<void> {
    await this.saveHistory([]);
  }

  private async saveHistory(history: PipelineHistoryEntry[]): Promise<void> {
    try {
      const localStorage = globalThis.localStorage;
      if (localStorage) {
        localStorage.setItem(this.storageKey, JSON.stringify(history));
      }
    } catch (error) {
      console.error("Failed to save pipeline history:", error);
    }
  }
}

export const defaultPipelineHistory = new PipelineHistory();