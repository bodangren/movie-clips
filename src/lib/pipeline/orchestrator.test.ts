import { describe, it, expect, vi } from 'vitest';
import type {
  PipelineStage,
  PipelineContext,
  PipelineConfig,
  PipelineStageResult,
  PipelineError,
} from './types';
import { PipelineOrchestrator, createOrchestrator } from './orchestrator';
import { DEFAULT_PIPELINE_CONFIG } from './types';

function createMockStage(
  name: string,
  shouldSucceed: boolean,
  data?: unknown,
  errorMsg?: string,
  rollbackFn?: (ctx: PipelineContext) => Promise<void>
): PipelineStage {
  return {
    name,
    async execute(): Promise<PipelineStageResult> {
      if (shouldSucceed) {
        return { success: true, data: data ?? { stage: name } };
      }
      const error: PipelineError = {
        stage: name,
        message: errorMsg ?? `Stage ${name} failed`,
        timestamp: Date.now(),
        retryable: true,
      };
      return { success: false, error };
    },
    rollback: rollbackFn,
  };
}

describe('PipelineOrchestrator', () => {
  describe('run', () => {
    it('runs all stages successfully and returns success', async () => {
      const stages: PipelineStage[] = [
        createMockStage('stage1', true),
        createMockStage('stage2', true),
        createMockStage('stage3', true),
      ];

      const orchestrator = new PipelineOrchestrator(stages);
      const result = await orchestrator.run();

      expect(result.success).toBe(true);
      expect(result.completedStages).toEqual(['stage1', 'stage2', 'stage3']);
      expect(result.failedStage).toBeNull();
      expect(result.context.errors).toHaveLength(0);
    });

    it('stops on first stage failure and returns failed stage', async () => {
      const stages: PipelineStage[] = [
        createMockStage('stage1', true),
        createMockStage('stage2', false, undefined, 'Test error'),
        createMockStage('stage3', true),
      ];

      const orchestrator = new PipelineOrchestrator(stages, { maxRetries: 0 });
      const result = await orchestrator.run();

      expect(result.success).toBe(false);
      expect(result.completedStages).toEqual(['stage1']);
      expect(result.failedStage).toBe('stage2');
      expect(result.context.errors).toHaveLength(1);
      expect(result.context.errors[0].message).toBe('Test error');
    });

    it('uses initial context when provided', async () => {
      const stages: PipelineStage[] = [createMockStage('stage1', true)];

      const initialContext: Partial<PipelineContext> = {
        mediaItem: null,
      };

      const orchestrator = new PipelineOrchestrator(stages);
      const result = await orchestrator.run(initialContext);

      expect(result.success).toBe(true);
      expect(result.context.mediaItem).toBeNull();
    });

    it('reports progress via callback', async () => {
      const progressCalls: Array<{ stage: string; progress: number }> = [];
      const stages: PipelineStage[] = [
        createMockStage('stage1', true),
        createMockStage('stage2', true),
      ];

      const orchestrator = new PipelineOrchestrator(stages, {}, (stage, progress) => {
        progressCalls.push({ stage, progress });
      });

      await orchestrator.run();

      expect(progressCalls.length).toBeGreaterThan(0);
      expect(progressCalls[0].stage).toBe('stage1');
    });
  });

  describe('retry logic', () => {
    it('retries failed stages up to maxRetries', async () => {
      let attemptCount = 0;
      const stages: PipelineStage[] = [
        {
          name: 'flaky',
          async execute() {
            attemptCount++;
            if (attemptCount < 3) {
              return {
                success: false,
                error: {
                  stage: 'flaky',
                  message: 'Transient error',
                  timestamp: Date.now(),
                  retryable: true,
                },
              };
            }
            return { success: true };
          },
        },
      ];

      const config: Partial<PipelineConfig> = {
        maxRetries: 3,
        retryDelayMs: 10,
      };

      const orchestrator = new PipelineOrchestrator(stages, config);
      const result = await orchestrator.run();

      expect(result.success).toBe(true);
      expect(attemptCount).toBe(3);
    });

    it('stops retrying when error is non-retryable', async () => {
      let attemptCount = 0;
      const stages: PipelineStage[] = [
        {
          name: 'fatal',
          async execute() {
            attemptCount++;
            return {
              success: false,
              error: {
                stage: 'fatal',
                message: 'Fatal error',
                timestamp: Date.now(),
                retryable: false,
              },
            };
          },
        },
      ];

      const config: Partial<PipelineConfig> = {
        maxRetries: 3,
        retryDelayMs: 10,
      };

      const orchestrator = new PipelineOrchestrator(stages, config);
      const result = await orchestrator.run();

      expect(result.success).toBe(false);
      expect(result.failedStage).toBe('fatal');
      expect(attemptCount).toBe(1);
    });

    it('handles multiple retryable failures before success', async () => {
      let attempts = 0;
      const stages: PipelineStage[] = [
        {
          name: 'eventually-success',
          async execute() {
            attempts++;
            if (attempts < 4) {
              return {
                success: false,
                error: {
                  stage: 'eventually-success',
                  message: `Attempt ${attempts}`,
                  timestamp: Date.now(),
                  retryable: true,
                },
              };
            }
            return { success: true, data: { finalAttempt: attempts } };
          },
        },
      ];

      const orchestrator = new PipelineOrchestrator(stages, { maxRetries: 5, retryDelayMs: 10 });
      const result = await orchestrator.run();

      expect(result.success).toBe(true);
      expect(attempts).toBe(4);
    });

    it('collects errors from all stages', async () => {
      const stages: PipelineStage[] = [
        createMockStage('stage1', true),
        createMockStage('stage2', false, undefined, 'Error 1'),
      ];

      const orchestrator = new PipelineOrchestrator(stages, { maxRetries: 0 });
      const result = await orchestrator.run();

      expect(result.context.errors).toHaveLength(1);
      expect(result.context.errors[0].message).toBe('Error 1');
    });
  });

  describe('timeout', () => {
    it.skip('rejects if stage exceeds timeout (needs proper fake timer setup)', async () => {
      const stages: PipelineStage[] = [
        {
          name: 'slow',
          async execute() {
            await new Promise(resolve => setTimeout(resolve, 200));
            return { success: true };
          },
        },
      ];

      const config: Partial<PipelineConfig> = {
        timeoutMs: 50,
      };

      const orchestrator = new PipelineOrchestrator(stages, config);
      const result = await orchestrator.run();

      expect(result.success).toBe(false);
      expect(result.failedStage).toBe('slow');
      expect(result.context.errors[0].message).toContain('timed out');
    });
  });

  describe('rollback', () => {
    it('rollback is defined as optional on PipelineStage interface', () => {
      const stage: PipelineStage = {
        name: 'test',
        async execute() {
          return { success: true };
        },
      };
      expect(stage.rollback).toBeUndefined();
    });

    it('orchestrator does not call rollback on stage failure (not implemented)', async () => {
      const rollbackCalled = vi.fn();
      const stages: PipelineStage[] = [
        createMockStage('stage1', true),
        createMockStage('stage2', false, undefined, 'Failed', rollbackCalled),
      ];

      const orchestrator = new PipelineOrchestrator(stages, { maxRetries: 0 });
      const result = await orchestrator.run();

      expect(result.success).toBe(false);
      expect(rollbackCalled).not.toHaveBeenCalled();
    });

    it('does not call rollback when all stages succeed', async () => {
      const rollbackCalled = vi.fn();
      const stages: PipelineStage[] = [
        createMockStage('stage1', true, undefined, undefined, rollbackCalled),
      ];

      const orchestrator = new PipelineOrchestrator(stages);
      await orchestrator.run();

      expect(rollbackCalled).not.toHaveBeenCalled();
    });
  });

  describe('config', () => {
    it('merges provided config with defaults', () => {
      const stages: PipelineStage[] = [];
      const customConfig: Partial<PipelineConfig> = {
        maxRetries: 5,
        timeoutMs: 60000,
      };

      const orchestrator = new PipelineOrchestrator(stages, customConfig);
      const config = orchestrator.getConfig();

      expect(config.maxRetries).toBe(5);
      expect(config.timeoutMs).toBe(60000);
      expect(config.retryDelayMs).toBe(DEFAULT_PIPELINE_CONFIG.retryDelayMs);
    });

    it('uses default config when none provided', () => {
      const stages: PipelineStage[] = [];
      const orchestrator = new PipelineOrchestrator(stages);
      const config = orchestrator.getConfig();

      expect(config).toEqual(DEFAULT_PIPELINE_CONFIG);
    });
  });

  describe('context', () => {
    it('sets startTime and endTime on run', async () => {
      const stages: PipelineStage[] = [createMockStage('stage1', true)];

      const orchestrator = new PipelineOrchestrator(stages);
      const result = await orchestrator.run();

      expect(result.context.startTime).not.toBeNull();
      expect(result.context.endTime).not.toBeNull();
      expect(result.totalDurationMs).toBeGreaterThanOrEqual(0);
    });

    it('getContext returns current context', async () => {
      const stages: PipelineStage[] = [createMockStage('stage1', true)];
      const orchestrator = new PipelineOrchestrator(stages);
      await orchestrator.run();

      const ctx = orchestrator.getContext();
      expect(ctx).toBeDefined();
      expect(ctx.errors).toBeDefined();
    });
  });

  describe('createOrchestrator factory', () => {
    it('creates orchestrator with factory function', async () => {
      const stages: PipelineStage[] = [createMockStage('stage1', true)];
      const orchestrator = createOrchestrator(stages);
      const result = await orchestrator.run();

      expect(result.success).toBe(true);
      expect(result.completedStages).toContain('stage1');
    });

    it('accepts config in factory', async () => {
      const stages: PipelineStage[] = [];
      const orchestrator = createOrchestrator(stages, { maxRetries: 10 });
      expect(orchestrator.getConfig().maxRetries).toBe(10);
    });
  });
});
