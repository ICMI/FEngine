function delay(time) {
  const half = Math.round(time / 2);
  return new Promise((resolve) => {
    // 用 2 个 setTimeout 是为了提升 ci 的成功率
    setTimeout(() => {
      setTimeout(resolve, half);
    }, half);
  });
}

const createContext = (title = '', { width = '300px', height = '225px' } = {}) => {
  const container = document.createElement('div');
  const canvasEl = document.createElement('canvas');
  const titleEl = document.createElement('p');

  container.id = 'container';

  titleEl.innerText = title + ':';
  titleEl.style.fontSize = '12px';

  canvasEl.style.display = 'block';
  canvasEl.style.width = width;
  canvasEl.style.height = height;

  container.appendChild(titleEl);
  container.appendChild(canvasEl);
  document.body.appendChild(container);
  const context = canvasEl.getContext('2d');
  return context;
};

const dispatchEvent = (dom: HTMLElement, eventType: string, exData) => {
  let event = new Event(eventType, { bubbles: true, cancelable: true });
  event = Object.assign(event, exData);
  dom.dispatchEvent(event);
};

const gestureSimulator = async (dom, eventType: string, option: { x: number; y: number }) => {
  const { top, left } = dom.getBoundingClientRect();
  const { x, y } = option;
  const clientX = left + x;
  const clientY = top + y;
  const event = {
    x,
    y,
    clientX,
    clientY,
  };

  const touchEvent = {
    ...event,
    targetTouches: [event],
    touches: [event],
    changedTouches: [event],
  };

  if (['touchstart', 'touchmove', 'touchend'].indexOf(eventType) !== -1) {
    dispatchEvent(dom, eventType, touchEvent);
    return;
  }

  if (eventType === 'press') {
    dispatchEvent(dom, 'touchstart', touchEvent);
    await delay(270);
    dispatchEvent(dom, 'touchend', touchEvent);
    return;
  }

  if (eventType === 'tap') {
    dispatchEvent(dom, 'touchstart', touchEvent);
    await delay(50);
    dispatchEvent(dom, 'touchend', touchEvent);
    return;
  }

  if (eventType === 'click') {
    dispatchEvent(dom, 'click', event);
    return;
  }
};

export { createContext, delay, dispatchEvent, gestureSimulator };
