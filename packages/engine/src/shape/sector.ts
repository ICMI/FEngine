import { Path, deg2rad, PathCommand } from '@antv/g';
import { polarToCartesian } from './util/util';
import { isNumberEqual } from '@antv/util';

const PI = Math.PI;
const PI2 = PI * 2;
const mathSin = Math.sin;
const mathCos = Math.cos;
const mathACos = Math.acos;
const mathATan2 = Math.atan2;
// const mathAbs = Math.abs;
const mathSqrt = Math.sqrt;
const mathMax = Math.max;
const mathMin = Math.min;
const e = 1e-4;

function intersect(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number
): [number, number] {
  const dx10 = x1 - x0;
  const dy10 = y1 - y0;
  const dx32 = x3 - x2;
  const dy32 = y3 - y2;
  let t = dy32 * dx10 - dx32 * dy10;
  if (t * t < e) {
    return;
  }
  t = (dx32 * (y0 - y2) - dy32 * (x0 - x2)) / t;
  return [x0 + t * dx10, y0 + t * dy10];
}

// Compute perpendicular offset line of length rc.
function computeCornerTangents(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  radius: number,
  cr: number,
  clockwise: boolean
) {
  const x01 = x0 - x1;
  const y01 = y0 - y1;
  const lo = (clockwise ? cr : -cr) / mathSqrt(x01 * x01 + y01 * y01);
  const ox = lo * y01;
  const oy = -lo * x01;
  const x11 = x0 + ox;
  const y11 = y0 + oy;
  const x10 = x1 + ox;
  const y10 = y1 + oy;
  const x00 = (x11 + x10) / 2;
  const y00 = (y11 + y10) / 2;
  const dx = x10 - x11;
  const dy = y10 - y11;
  const d2 = dx * dx + dy * dy;
  const r = radius - cr;
  const s = x11 * y10 - x10 * y11;
  const d = (dy < 0 ? -1 : 1) * mathSqrt(mathMax(0, r * r * d2 - s * s));
  let cx0 = (s * dy - dx * d) / d2;
  let cy0 = (-s * dx - dy * d) / d2;
  const cx1 = (s * dy + dx * d) / d2;
  const cy1 = (-s * dx + dy * d) / d2;
  const dx0 = cx0 - x00;
  const dy0 = cy0 - y00;
  const dx1 = cx1 - x00;
  const dy1 = cy1 - y00;

  // Pick the closer of the two intersection points
  // TODO: Is there a faster way to determine which intersection to use?
  if (dx0 * dx0 + dy0 * dy0 > dx1 * dx1 + dy1 * dy1) {
    cx0 = cx1;
    cy0 = cy1;
  }

  return {
    cx: cx0,
    cy: cy0,
    x0: -ox,
    y0: -oy,
    x1: cx0 * (radius / r - 1),
    y1: cy0 * (radius / r - 1),
  };
}

function computeArcSweep(startAngle: number, endAngle: number) {
  endAngle = endAngle < 0 && startAngle >= 0 ? endAngle + PI2 : endAngle;
  return endAngle - startAngle <= PI ? 0 : 1;
}

export class Sector extends Path {
  parsedStyle: any;
  constructor(config) {
    super(config);
    this.updatePath();
  }
  setAttribute(name, value, force?: boolean) {
    super.setAttribute(name, value, force);
    if (['startAngle', 'endAngle', 'r', 'r0', 'radius'].indexOf(name) > -1) {
      this.updatePath();
    }
  }

  private updatePath() {
    const { x, y, startAngle, endAngle, r, r0, radius } = this.parsedStyle;

    const path = this.createPath(
      x.value,
      y.value,
      startAngle ? deg2rad(startAngle.value) : 0,
      endAngle ? deg2rad(endAngle.value) : 360,
      r ? r.value : 0,
      r0 ? r0.value : 0,
      radius ? radius.map((r) => r.value) : [0, 0, 0, 0]
    );
    super.setAttribute('path', path);
  }

  private createPath(
    x: number,
    y: number,
    startAngle: number,
    endAngle: number,
    r: number,
    r0: number,
    borderRadius: number[]
  ): PathCommand[] {
    const start = polarToCartesian(x, y, r, startAngle);
    const end = polarToCartesian(x, y, r, endAngle);

    const innerStart = polarToCartesian(x, y, r0, startAngle);
    const innerEnd = polarToCartesian(x, y, r0, endAngle);

    // 整圆
    if (isNumberEqual(endAngle - startAngle, Math.PI * 2)) {
      // 整个圆是分割成两个圆
      const middlePoint = polarToCartesian(x, y, r, startAngle + Math.PI);
      const innerMiddlePoint = polarToCartesian(x, y, r0, startAngle + Math.PI);
      const circlePathCommands = [
        ['M', start.x, start.y],
        ['A', r, r, 0, 1, 1, middlePoint.x, middlePoint.y],
        ['A', r, r, 0, 1, 1, end.x, end.y],
        ['M', innerStart.x, innerStart.y],
      ];
      if (r0) {
        circlePathCommands.push(['A', r0, r0, 0, 1, 0, innerMiddlePoint.x, innerMiddlePoint.y]);
        circlePathCommands.push(['A', r0, r0, 0, 1, 0, innerEnd.x, innerEnd.y]);
      }

      circlePathCommands.push(['M', start.x, start.y]);
      circlePathCommands.push(['Z']);

      return circlePathCommands as PathCommand[];
    }

    const angle = endAngle - startAngle;
    const xrs = r * mathCos(startAngle);
    const yrs = r * mathSin(startAngle);
    const xire = r0 * mathCos(endAngle);
    const yire = r0 * mathSin(endAngle);

    const xre = r * mathCos(endAngle);
    const yre = r * mathSin(endAngle);
    const xirs = r0 * mathCos(startAngle);
    const yirs = r0 * mathSin(startAngle);

    // 顺时针反向，同 radius
    const [outStartRadius, outEndRadius, innerEndRadius, innerStartRadius] = borderRadius;

    const halfRadius = (r - r0) / 2;
    const outStartBorderRadius = mathMin(halfRadius, outStartRadius);
    const outEndBorderRadius = mathMin(halfRadius, outEndRadius);
    const innerEndBorderRadius = mathMin(halfRadius, innerEndRadius);
    const innerStartBorderRadius = mathMin(halfRadius, innerStartRadius);

    const outBorderRadiusMax = mathMax(outStartBorderRadius, outEndBorderRadius);
    const innerBorderRadiusMax = mathMax(innerEndBorderRadius, innerStartBorderRadius);

    let limitedOutBorderRadiusMax = outBorderRadiusMax;
    let limitedInnerBorderRadiusMax = innerBorderRadiusMax;

    // draw corner radius
    if (outBorderRadiusMax > e || innerBorderRadiusMax > e) {
      // restrict the max value of corner radius
      if (angle < PI) {
        const it = intersect(xrs, yrs, xirs, yirs, xre, yre, xire, yire);
        if (it) {
          const x0 = xrs - it[0];
          const y0 = yrs - it[1];
          const x1 = xre - it[0];
          const y1 = yre - it[1];
          const a =
            1 /
            mathSin(
              mathACos(
                (x0 * x1 + y0 * y1) / (mathSqrt(x0 * x0 + y0 * y0) * mathSqrt(x1 * x1 + y1 * y1))
              ) / 2
            );
          const b = mathSqrt(it[0] * it[0] + it[1] * it[1]);
          limitedOutBorderRadiusMax = mathMin(outBorderRadiusMax, (r - b) / (a + 1));
          limitedInnerBorderRadiusMax = mathMin(innerBorderRadiusMax, (r0 - b) / (a - 1));
        }
      }
    }
    const arcSweep = computeArcSweep(startAngle, endAngle);
    const clockwise = true;
    const sectorPathCommands = [];

    if (limitedOutBorderRadiusMax > e) {
      const crStart = mathMin(outStartRadius, limitedOutBorderRadiusMax);
      const crEnd = mathMin(outEndRadius, limitedOutBorderRadiusMax);
      const ct0 = computeCornerTangents(xirs, yirs, xrs, yrs, r, crStart, clockwise);
      const ct1 = computeCornerTangents(xre, yre, xire, yire, r, crEnd, clockwise);

      sectorPathCommands.push(['M', x + ct0.cx + ct0.x0, y + ct0.cy + ct0.y0]);

      // Have the corners merged?
      if (limitedOutBorderRadiusMax < outBorderRadiusMax && crStart === crEnd) {
        const outStartBorderRadiusStartAngle = mathATan2(ct0.y0, ct0.x0);
        const outStartBorderRadiusEndAngle = mathATan2(ct1.y0, ct1.x0);
        const outStartBorderRadiusEndPoint = polarToCartesian(
          x,
          y,
          r,
          outStartBorderRadiusEndAngle
        );
        sectorPathCommands.push([
          'A',
          limitedOutBorderRadiusMax,
          limitedOutBorderRadiusMax,
          0,
          computeArcSweep(outStartBorderRadiusStartAngle, outStartBorderRadiusEndAngle),
          1,
          outStartBorderRadiusEndPoint.x,
          outStartBorderRadiusEndPoint.y,
        ]);
      } else {
        // draw the two corners and the ring
        if (crStart > 0) {
          const outStartBorderRadiusStartAngle = mathATan2(ct0.y0, ct0.x0);
          const outStartBorderRadiusEndAngle = mathATan2(ct0.y1, ct0.x1);
          const outStartBorderRadiusEndPoint = polarToCartesian(
            x,
            y,
            r,
            outStartBorderRadiusEndAngle
          );
          sectorPathCommands.push([
            'A',
            crStart,
            crStart,
            0,
            computeArcSweep(outStartBorderRadiusStartAngle, outStartBorderRadiusEndAngle),
            1,
            outStartBorderRadiusEndPoint.x,
            outStartBorderRadiusEndPoint.y,
          ]);
        }

        const outRadiusStartAngle = mathATan2(ct0.cy + ct0.y1, ct0.cx + ct0.x1);
        const outRadiusEndAngle = mathATan2(ct1.cy + ct1.y1, ct1.cx + ct1.x1);
        const outRadiusEndPoint = polarToCartesian(x, y, r, outRadiusEndAngle);
        sectorPathCommands.push([
          'A',
          r,
          r,
          0,
          computeArcSweep(outRadiusStartAngle, outRadiusEndAngle),
          1,
          outRadiusEndPoint.x,
          outRadiusEndPoint.y,
        ]);
        if (crEnd > 0) {
          const outEndBorderRadiusStartAngle = mathATan2(ct1.y1, ct1.x1);
          const outEndBorderRadiusEndAngle = mathATan2(ct1.y0, ct1.x0);
          sectorPathCommands.push([
            'A',
            crEnd,
            crEnd,
            0,
            computeArcSweep(outEndBorderRadiusStartAngle, outEndBorderRadiusEndAngle),
            1,
            x + ct1.cx + ct1.x0,
            y + ct1.cy + ct1.y0,
          ]);
        }
      }
    } else {
      sectorPathCommands.push(['M', start.x, start.y]);
      sectorPathCommands.push(['A', r, r, 0, arcSweep, 1, end.x, end.y]);
    }

    // no inner ring, is a circular sector
    if (r0 < e) {
      sectorPathCommands.push(['L', innerEnd.x, innerEnd.y]);
    }
    // the inner ring has corners
    else if (limitedInnerBorderRadiusMax > e) {
      const crStart = mathMin(innerStartRadius, limitedInnerBorderRadiusMax);
      const crEnd = mathMin(innerEndRadius, limitedInnerBorderRadiusMax);
      const ct0 = computeCornerTangents(xire, yire, xre, yre, r0, -crEnd, clockwise);
      const ct1 = computeCornerTangents(xrs, yrs, xirs, yirs, r0, -crStart, clockwise);

      sectorPathCommands.push(['L', x + ct0.cx + ct0.x0, y + ct0.cy + ct0.y0]);
      // ctx.lineTo(cx + ct0.cx + ct0.x0, cy + ct0.cy + ct0.y0);

      // Have the corners merged?
      if (limitedInnerBorderRadiusMax < innerBorderRadiusMax && crStart === crEnd) {
        const innerStartBorderRadiusStartAngle = mathATan2(ct0.y0, ct0.x0);
        const innerStartBorderRadiusEndAngle = mathATan2(ct1.y0, ct1.x0);
        const innerStartBorderRadiusEndPoint = polarToCartesian(
          x,
          y,
          r0,
          innerStartBorderRadiusEndAngle
        );
        sectorPathCommands.push([
          'A',
          limitedOutBorderRadiusMax,
          limitedOutBorderRadiusMax,
          0,
          computeArcSweep(innerStartBorderRadiusStartAngle, innerStartBorderRadiusEndAngle),
          1,
          innerStartBorderRadiusEndPoint.x,
          innerStartBorderRadiusEndPoint.y,
        ]);
      }
      // draw the two corners and the ring
      // else {
      //   if (crEnd > 0) {
      //     const innerStartBorderRadiusStartAngle = mathATan2(ct0.y0, ct0.x0);
      //     const innerStartBorderRadiusEndAngle = mathATan2(ct0.y1, ct0.x1);
      //     const innerStartBorderRadiusEndPoint = polarToCartesian(
      //       x,
      //       y,
      //       r0,
      //       innerStartBorderRadiusEndAngle
      //     );
      //     sectorPathCommands.push([
      //       'A',
      //       crEnd,
      //       crEnd,
      //       0,
      //       computeArcSweep(innerStartBorderRadiusStartAngle, innerStartBorderRadiusEndAngle),
      //       0,
      //       innerStartBorderRadiusEndPoint.x,
      //       innerStartBorderRadiusEndPoint.y,
      //     ]);
      //   }
      //   const innerRadiusStartAngle = mathATan2(ct0.cy + ct0.y1, ct0.cx + ct0.x1);
      //   const innerRadiusEndAngle = mathATan2(ct1.cy + ct1.y1, ct1.cx + ct1.x1);
      //   const innerRadiusEndPoint = polarToCartesian(x, y, r0, innerRadiusEndAngle);
      //   // sectorPathCommands.push([
      //   //   'A',
      //   //   r0,
      //   //   r0,
      //   //   0,
      //   //   computeArcSweep(innerRadiusStartAngle, innerRadiusEndAngle),
      //   //   1,
      //   //   innerRadiusEndPoint.x,
      //   //   innerRadiusEndPoint.y,
      //   // ]);
      //   sectorPathCommands.push(['L', innerRadiusEndPoint.x, innerRadiusEndPoint.y]);
      //   // ctx.arc(
      //   //   cx,
      //   //   cy,
      //   //   innerRadius,
      //   //   mathATan2(ct0.cy + ct0.y1, ct0.cx + ct0.x1),
      //   //   mathATan2(ct1.cy + ct1.y1, ct1.cx + ct1.x1),
      //   //   clockwise
      //   // );
      //   // if (crStart > 0) {
      //   //   const innerEndBorderRadiusStartAngle = mathATan2(ct1.y1, ct1.x1);
      //   //   const innerEndBorderRadiusEndAngle = mathATan2(ct1.y0, ct1.x0);
      //   //   sectorPathCommands.push([
      //   //     'A',
      //   //     crStart,
      //   //     crStart,
      //   //     0,
      //   //     computeArcSweep(innerEndBorderRadiusStartAngle, innerEndBorderRadiusEndAngle),
      //   //     1,
      //   //     x + ct1.cx + ct1.x0,
      //   //     y + ct1.cy + ct1.y0,
      //   //   ]);
      //   // }
      //   // // eslint-disable-next-line max-len
      //   // crStart > 0 &&
      //   //   ctx.arc(
      //   //     cx + ct1.cx,
      //   //     cy + ct1.cy,
      //   //     crStart,
      //   //     mathATan2(ct1.y1, ct1.x1),
      //   //     mathATan2(ct1.y0, ct1.x0),
      //   //     !clockwise
      //   //   );
      // }
    }
    // the inner ring is just a circular arc
    else {
      // TODO 内圆角
      sectorPathCommands.push(['L', innerEnd.x, innerEnd.y]);
      sectorPathCommands.push(['A', r0, r0, 0, arcSweep, 0, innerStart.x, innerStart.y]);
    }

    sectorPathCommands.push(['Z']);

    return sectorPathCommands as PathCommand[];
  }
}
