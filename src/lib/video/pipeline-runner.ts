import { createOrchestrator } from '../pipeline/orchestrator';
import { createAnalyzeStage } from '../pipeline/stages/analyze';
import { createGenerateAssetsStage } from '../pipeline/stages/generate-assets';
import { createProcessVideoStage } from '../pipeline/stages/process-video';
import { createRenderVideoStage } from '../pipeline/stages/render-video';
import type { MediaItem } from '../library/types';

const [sourcePath, title, posterPath, outputDir] = process.argv.slice(2);

if (!sourcePath || !title) {
  console.error('PIPELINE_ERROR:Usage: pipeline-runner.ts <sourcePath> <title> [posterPath] [outputDir]');
  process.exit(1);
}

async function main() {
  const mediaItem: MediaItem = {
    path: sourcePath,
    type: 'movie',
    name: title,
    extension: sourcePath.substring(sourcePath.lastIndexOf('.')),
    size: 0,
    modifiedAt: new Date(),
    metadata: { title },
    subtitlePaths: [],
    posterPath: posterPath || '',
  };

  const stages = [
    createAnalyzeStage(),
    createGenerateAssetsStage(),
    createProcessVideoStage(),
    createRenderVideoStage({ outputDir: outputDir || './output' }),
  ];

  const STAGE_LABELS: Record<string, string> = {
    analyze: 'Analyzing with AI...',
    generate_assets: 'Generating assets...',
    process_video: 'Processing video...',
    render_video: 'Rendering final video...',
  };

  const orchestrator = createOrchestrator(stages, {}, (stage, progress) => {
    console.log(`STAGE:${STAGE_LABELS[stage] || stage}`);
    console.log(`PROGRESS:${progress}`);
  });

  const result = await orchestrator.run({ mediaItem });

  if (result.success) {
    console.log('PIPELINE_COMPLETE');
  } else {
    const errMsg = result.context.errors.map(e => e.message).join(', ');
    console.log(`PIPELINE_ERROR:${errMsg}`);
    process.exit(1);
  }
}

main().catch(err => {
  console.log(`PIPELINE_ERROR:${err}`);
  process.exit(1);
});
