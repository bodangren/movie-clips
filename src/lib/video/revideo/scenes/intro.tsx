import {makeScene2D} from '@revideo/2d';
import {Txt, Img, Rect} from '@revideo/2d';
import {useScene, createRef} from '@revideo/core';
import {VideoMetadata} from '../types';

export default makeScene2D(function* (view) {
  const vars = useScene().variables as unknown as VideoMetadata;
  const titleRef = createRef<Txt>();
  const posterRef = createRef<Img>();

  view.add(
    <Rect width={'100%'} height={'100%'} fill={'#0f0f0f'}>
      <Img
        ref={posterRef}
        src={vars.posterPath}
        width={400}
        y={-100}
        opacity={0}
      />
      <Txt
        ref={titleRef}
        text={vars.title}
        fill={'white'}
        fontSize={80}
        y={300}
        opacity={0}
      />
      <Txt
        text="5 Things You Didn't Know"
        fill={'#eab308'}
        fontSize={40}
        y={200}
        opacity={0}
        initial={(txt) => txt.opacity(0).y(150)}
      />
    </Rect>
  );

  // Animation sequence
  yield* posterRef().opacity(1, 1);
  yield* titleRef().opacity(1, 0.5).y(280, 0.5);
  yield* view.get().children()[0].children()[2].opacity(1, 0.5).y(200, 0.5);
  
  yield* view.get().wait(2);
});
