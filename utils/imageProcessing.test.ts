import { describe, it, expect } from 'vitest';
import { generateHistogram } from './imageProcessing';

describe('generateHistogram', () => {
  it('should correctly generate a histogram for a simple image', () => {
    // Create a mock ImageData object (2x1 image)
    // Pixel 1: Red (255, 0, 0, 255)
    // Pixel 2: Blue (0, 0, 255, 255)
    const mockImageData = {
      data: new Uint8ClampedArray([255, 0, 0, 255, 0, 0, 255, 255]),
      width: 2,
      height: 1,
    } as ImageData;

    const histogram = generateHistogram(mockImageData);

    // Expect one count for red at index 255 and one at index 0
    expect(histogram.r[255]).toBe(1);
    expect(histogram.r[0]).toBe(1);
    // Expect two counts for green at index 0
    expect(histogram.g[0]).toBe(2);
    // Expect one count for blue at index 255 and one at index 0
    expect(histogram.b[255]).toBe(1);
    expect(histogram.b[0]).toBe(1);

    // Verify other bins are zero
    let rSum = 0;
    histogram.r.forEach(val => rSum += val);
    expect(rSum).toBe(2);
  });
});

import { applyLUT, createCurveLUT } from './imageProcessing';

describe('applyLUT', () => {
  it('should correctly apply a LUT to an image', () => {
    // Create a mock ImageData object (2x1 image)
    const mockImageData = {
      data: new Uint8ClampedArray([10, 20, 30, 255, 100, 110, 120, 255]),
      width: 2,
      height: 1,
    } as ImageData;

    // Create a simple inverting LUT
    const lut = new Array(256).fill(0).map((_, i) => 255 - i);

    const resultImageData = applyLUT(mockImageData, lut);

    // Expect the colors to be inverted
    expect(resultImageData.data[0]).toBe(255 - 10);
    expect(resultImageData.data[1]).toBe(255 - 20);
    expect(resultImageData.data[2]).toBe(255 - 30);
    expect(resultImageData.data[4]).toBe(255 - 100);
    expect(resultImageData.data[5]).toBe(255 - 110);
    expect(resultImageData.data[6]).toBe(255 - 120);
  });
});

describe('createCurveLUT', () => {
  it('should create a linear LUT for a straight curve', () => {
    // Control points for a straight diagonal line
    const controlPoints = [{ x: 0, y: 1 }, { x: 1, y: 0 }];
    const lut = createCurveLUT(controlPoints);

    // For a straight line, the LUT should be linear (i.e., lut[i] === i)
    // but since the coordinate system is inverted in the function, it's 255-i
    // and the test points are also inverted, so it becomes linear again.
    // Let's re-verify the logic in the function.
    // p0={x:0, y:1}, p3={x:1, y:0}. controlPoints are p1, p2.
    // The function expects normalized control points.
    // The y is inverted twice, so it should be a direct mapping.
    // A straight line from bottom-left to top-right (in graphics coords)
    // is from (0,1) to (1,0) in the function's internal representation.
    // So if we provide control points that are on that line, we should get a LUT where lut[i] ~= i
    const straightCurvePoints = [{ x: 0.25, y: 0.75 }, { x: 0.75, y: 0.25 }];
    const linearLut = createCurveLUT(straightCurvePoints);
    expect(linearLut[0]).toBe(0);
    // A small tolerance is needed due to floating point inaccuracies
    expect(linearLut[128]).toBeCloseTo(128, 0);
    expect(linearLut[255]).toBe(255);
  });

  it('should create a non-inverting LUT for a curved line', () => {
    // These control points create an "S" curve
    const sCurvePoints = [{ x: 0, y: 0 }, { x: 1, y: 1 }];
    const sCurveLut = createCurveLUT(sCurvePoints);

    // The curve starts at y=1 and ends at y=0, so lut starts at 0 and ends at 255.
    // This is non-inverting.
    expect(sCurveLut[0]).toBe(0);
    // The exact middle value is not trivial to calculate, but it should be between 0 and 255.
    expect(sCurveLut[128]).toBeGreaterThan(0);
    expect(sCurveLut[128]).toBeLessThan(255);
    expect(sCurveLut[255]).toBe(255);
  });
});
