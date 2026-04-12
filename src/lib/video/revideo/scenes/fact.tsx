import {makeScene2D} from '@revideo/2d';
import {Txt, Rect, Video, Audio} from '@revideo/2d';
import {useScene, createRef} from '@revideo/core';
import {VideoMetadata} from '../types';

export default makeScene2D(function* (view) {
  const vars = useScene().variables as unknown as VideoMetadata;
  
  const videoRef = createRef<Video>();
  const textRef = createRef<Txt>();
  const audioRef = createRef<Audio>();

  view.add(
    <Rect width={'100%'} height={'100%'} fill={'#0f0f0f'}>
      <Video
        ref={videoRef}
        src={vars.sourceVideoPath}
        play={false}
        width={'100%'}
        height={'100%'}
        opacity={0}
      />
      <Audio
        ref={audioRef}
        src={""} // Will update dynamically
        play={false}
      />
      <Rect
        width={'80%'}
        height={200}
        fill={'rgba(0,0,0,0.6)'}
        radius={20}
        y={300}
        opacity={0}
        id="text-box"
      >
        <Txt
          ref={textRef}
          text={""} // Will update dynamically
          fill={'white'}
          fontSize={32}
          width={'90%'}
          textWrap={true}
          textAlign={'center'}
        />
      </Rect>
    </Rect>
  );

  const textBox = view.get().findFirst<Rect>('#text-box');

  // Loop through all facts
  for (const fact of vars.facts) {
    // Update content
    textRef().text(fact.text);
    audioRef().src(fact.ttsAudioPath);
    videoRef().time(fact.startTime);
    
    // Animate in
    yield* videoRef().opacity(1, 0.5);
    yield* textBox.opacity(1, 0.5);
    
    // Start playback
    videoRef().play(true);
    audioRef().play(true);
    
    // Wait for fact duration
    const duration = fact.endTime - fact.startTime;
    yield* view.get().wait(duration);
    
    // Pause playback for transition
    videoRef().play(false);
    audioRef().play(false);
    
    // Animate out (optional, or just cross-fade)
    // yield* videoRef().opacity(0, 0.5);
    // yield* textBox.opacity(0, 0.5);
  }
});
