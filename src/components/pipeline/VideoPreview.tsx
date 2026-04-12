import React from "react";
import { Player } from "@revideo/player-react";
import { usePipelineStore } from "@/stores/pipeline.store";
import project from "@/lib/video/revideo/project";
import { Card } from "@/components/ui/Card";

export const VideoPreview: React.FC = () => {
  const { title, posterPath, sourceVideoPath, facts, outroText } = usePipelineStore();

  const videoMetadata = {
    title,
    posterPath,
    sourceVideoPath,
    facts,
    outroText,
  };

  return (
    <Card className="w-full overflow-hidden bg-black aspect-video flex items-center justify-center">
      {title ? (
        <Player
          project={project}
          variables={videoMetadata}
          controls={true}
          style={{ width: "100%", height: "100%" }}
        />
      ) : (
        <div className="text-gray-500 text-center p-8">
          <p className="text-lg font-semibold">No Video Preview Available</p>
          <p className="text-sm">Select a movie and generate facts to see a preview.</p>
        </div>
      )}
    </Card>
  );
};
