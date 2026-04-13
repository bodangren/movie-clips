import { makeScene2D } from '@revideo/2d';
import { Txt, Rect } from '@revideo/2d';
import { useScene, createRef } from '@revideo/core';
import { VideoMetadata } from '../types';

export default makeScene2D(function* (view) {
  const vars = useScene().variables as unknown as VideoMetadata;
  const textRef = createRef<Txt>();

  view.add(
    <Rect width={'100%'} height={'100%'} fill={'#0f0f0f'}>
      <Txt
        ref={textRef}
        text={vars.outroText || 'Subscribe for more!'}
        fill={'#eab308'}
        fontSize={60}
        opacity={0}
      />
    </Rect>
  );

  yield* textRef().opacity(1, 1).scale(1.2, 1);
  yield* view.get().wait(2);
});
