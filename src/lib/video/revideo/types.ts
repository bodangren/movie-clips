export interface Fact {
  text: string;
  ttsAudioPath: string;
  startTime: number;
  endTime: number;
}

export interface VideoMetadata {
  title: string;
  posterPath: string;
  sourceVideoPath: string;
  facts: Fact[];
  outroText?: string;
}
