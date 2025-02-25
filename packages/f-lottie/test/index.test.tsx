import { jsx, Canvas } from '@antv/f-engine';
import Lottie from '../src/index';
import data from './data/data.json';
import { createContext, delay } from './util';

describe('Lottie', () => {
  it('加载 lottie 文件', async () => {
    const data1 = await (
      await fetch(
        'https://gw.alipayobjects.com/os/OasisHub/3ccdf4d8-78e6-48c9-b06e-9e518057d144/data.json',
      )
    ).json();

    const context = createContext('', {
      width: '600px',
      height: '300px',
    });

    const { props } = (
      <Canvas context={context}>
        <rect
          style={{
            x: 20,
            y: 20,
            width: 100,
            height: 100,
            fill: 'blue',
          }}
        />
        <Lottie data={data} options={{ loop: true, autoplay: true }} />
        <Lottie data={data1} options={{ loop: true, autoplay: true }} />
      </Canvas>
    );

    const canvas = new Canvas(props);
    await canvas.render();
  });
  it('lottie 数据update', async () => {
    const data1 = await (
      await fetch(
        'https://gw.alipayobjects.com/os/OasisHub/3ccdf4d8-78e6-48c9-b06e-9e518057d144/data.json',
      )
    ).json();

    const context = createContext('', {
      width: '600px',
      height: '300px',
    });

    const { props } = (
      <Canvas context={context}>
        <Lottie data={null} options={{ loop: true, autoplay: true }} />
      </Canvas>
    );

    const canvas = new Canvas(props);
    await canvas.render();

    const { props: nextProps } = (
      <Canvas context={context}>
        <Lottie
          data={data1}
          options={{ loop: true, autoplay: true }}
          style={{ width: 100, height: 100 }}
        />
      </Canvas>
    );

    await canvas.update(nextProps);
  });

  it('播控 lottie', async () => {
    const data1 = await (
      await fetch(
        'https://gw.alipayobjects.com/os/OasisHub/9c49e111-b7dd-4a53-9c8e-a1ada16c6969/data.json',
      )
    ).json();

    const context = createContext('', {
      width: '600px',
      height: '300px',
    });

    const { props } = (
      <Canvas context={context}>
        <Lottie
          data={data1}
          options={{ loop: true, autoplay: true }}
          play={{ start: 0, speed: 1, end: 10 }}
        />
      </Canvas>
    );

    const canvas = new Canvas(props);
    await canvas.render();

    await delay(3000);

    const { props: nextProps } = (
      <Canvas context={context}>
        <Lottie
          data={data1}
          options={{ loop: true, autoplay: true }}
          play={{ start: 10, speed: 1, end: 24 }}
        />
      </Canvas>
    );

    await canvas.update(nextProps);
  });
});
