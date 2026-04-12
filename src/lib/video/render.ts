import { renderVideo } from "@revideo/renderer";
import path from "path";

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error("Usage: bun src/lib/video/render.ts <metadata_json> <output_path>");
    process.exit(1);
  }

  const metadata = JSON.parse(args[0]);
  const outputPath = args[1];

  console.log(`Starting render for: ${metadata.title}`);
  console.log(`Output path: ${outputPath}`);

  try {
    await renderVideo({
      projectFile: path.resolve("src/lib/video/revideo/project.ts"),
      variables: metadata,
      onProgress: (progress) => {
        // Output progress to stdout for the parent process to capture
        console.log(`PROGRESS:${(progress * 100).toFixed(2)}`);
      },
    });
    console.log("RENDER_COMPLETE");
  } catch (error) {
    console.error("RENDER_ERROR:", error);
    process.exit(1);
  }
}

main();
