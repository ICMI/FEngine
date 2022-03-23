import Element from './element';
import { ICanvas } from './interfaces';
import { CanvasCfg, Renderer, Point } from './types';
import { Canvas } from '@antv/g';
import { Renderer as CanvasRenderer } from '@antv/g-webgl';
import { ADAPTER_ELE_PROPER_NAME } from './utils';
import { AdapterHammer } from './event';

class CanvasAdapter extends Element {
  canvasEle = null;
  constructor(cfg: CanvasCfg) {
    super(cfg);
    const canvasRenderer = new CanvasRenderer();
    this.set('renderer', cfg.renderer);
    this.canvasEle = new Canvas({
      container: cfg.container,
      canvas: cfg.canvas,
      width: cfg.width,
      height: cfg.height,
      devicePixelRatio: cfg.pixcelRatio,
      renderer: canvasRenderer,
    });
    this.adapteredEle = this.canvasEle.getRoot();
    // 均代理到canvas节点，事件拿到对应的对象直接找到canvas实例
    this.canvasEle.document[ADAPTER_ELE_PROPER_NAME] = this;
    this.adapteredEle[ADAPTER_ELE_PROPER_NAME] = this;
    this.canvasEle[ADAPTER_ELE_PROPER_NAME] = this;
    this.adapterHammer = new AdapterHammer(this.canvasEle);
  }

  registerEventCallback(e): void {}

  getDefaultCfg() {
    const cfg = super.getDefaultCfg();
    return cfg;
  }

  changeSize(width: number, height: number) {
    this.adapteredEle.changeSize(width, height);
  }

  /**
   * 获取当前的渲染引擎
   * @return {Renderer} 返回当前的渲染引擎
   */
  getRenderer(): Renderer {
    return this.get('renderer');
  }

  /**
   * 获取画布的 cursor 样式
   * @return {Cursor}
   */
  getCursor() {
    return this.get('cursor');
  }

  /**
   * 设置画布的 cursor 样式
   * @param {Cursor} cursor  cursor 样式
   */
  setCursor(cursor) {
    this.set('cursor', cursor);
    this.adapteredEle.setCursor(cursor);
  }

  getPointByClient(clientX: number, clientY: number): Point {
    return this.canvasEle.getPointByClient(clientX, clientY);
  }

  getClientByPoint(x: number, y: number): Point {
    return this.canvasEle.getClientByPoint(x, y);
  }

  isCanvas() {
    return true;
  }

  getParent() {
    return null;
  }

  draw() {}
}

export default CanvasAdapter;
