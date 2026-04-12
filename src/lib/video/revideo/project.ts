import {makeProject} from '@revideo/core';
import {VideoMetadata} from './types';
import intro from './scenes/intro?scene';
import fact from './scenes/fact?scene';
import outro from './scenes/outro?scene';

// Default metadata for development and previews
export const defaultMetadata: VideoMetadata = {
  title: "Example Movie",
  posterPath: "public/tauri.svg",
  sourceVideoPath: "",
  facts: [
    {
      text: "Fact 1 about the movie.",
      ttsAudioPath: "",
      startTime: 0,
      endTime: 5,
    },
    {
      text: "Fact 2 about the movie.",
      ttsAudioPath: "",
      startTime: 10,
      endTime: 15,
    }
  ],
  outroText: "Subscribe for more!"
};

export default makeProject({
  scenes: [intro, fact, outro],
  variables: defaultMetadata,
});
