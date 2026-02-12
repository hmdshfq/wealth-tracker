/**
 * Data sampling utilities for large datasets
 * Helps improve performance by reducing the number of data points
 * while preserving the overall shape and key characteristics
 */

import { ProjectionDataPoint, ExtendedProjectionDataPoint } from './types';

type SampledDataPoint = ProjectionDataPoint | ExtendedProjectionDataPoint;
type IndexRange = { startIndex: number; endIndex: number };

/**
 * Sample data points to reduce dataset size while preserving key characteristics
 * Uses the Largest-Triangle-Three-Buckets (LTTB) algorithm for efficient downsampling
 */
interface SampleOptions {
  targetPoints?: number; // Target number of points to sample to
  minPoints?: number; // Minimum number of points to keep
  preserveExtremes?: boolean; // Preserve local maxima/minima
  preserveStartEnd?: boolean; // Always preserve first and last points
}

export function sampleProjectionData(
  data: ProjectionDataPoint[] | ExtendedProjectionDataPoint[],
  options: SampleOptions = {}
): ProjectionDataPoint[] | ExtendedProjectionDataPoint[] {
  if (!data || data.length <= 1) {
    return [...data];
  }

  const {
    targetPoints = 300,
    minPoints = 50,
    preserveExtremes = true,
    preserveStartEnd = true,
  } = options;

  // If data is already small enough, return as-is
  if (data.length <= targetPoints) {
    return [...data];
  }

  // Ensure we don't sample below minimum points
  const sampleSize = Math.max(minPoints, Math.min(targetPoints, data.length));

  // Use LTTB algorithm for efficient downsampling
  return largestTriangleThreeBuckets(data, sampleSize, preserveExtremes, preserveStartEnd);
}

/**
 * Largest-Triangle-Three-Buckets algorithm for downsampling
 * Preserves the visual shape of the data while reducing points
 */
function largestTriangleThreeBuckets(
  data: SampledDataPoint[],
  threshold: number,
  preserveExtremes: boolean,
  preserveStartEnd: boolean
): SampledDataPoint[] {
  const sampled: SampledDataPoint[] = [];
  const dataLength = data.length;

  if (preserveStartEnd && dataLength > 0) {
    sampled.push(data[0]);
  }

  // Bucket size - number of data points in each bucket
  const bucketSize = Math.floor((dataLength - (preserveStartEnd ? 2 : 0)) / (threshold - (preserveStartEnd ? 2 : 0)));

  let sampledIndex = preserveStartEnd ? 1 : 0;

  // Always pick the first point from the bucket
  for (let i = 0; i < threshold - (preserveStartEnd ? 2 : 0); i++) {
    const startIndex = (preserveStartEnd ? 1 : 0) + i * bucketSize;
    const endIndex = Math.min((preserveStartEnd ? 1 : 0) + (i + 1) * bucketSize, dataLength - (preserveStartEnd ? 1 : 0));

    if (startIndex >= endIndex) {
      break;
    }

    let maxArea = -1;
    let selectedIndex = startIndex;

    // Calculate area of triangle for each point in the bucket
    for (let j = startIndex; j < endIndex; j++) {
      const area = calculateTriangleArea(
        data[startIndex],
        data[endIndex],
        data[j]
      );

      if (area > maxArea) {
        maxArea = area;
        selectedIndex = j;
      }
    }

    // Add the point with the largest area
    sampled.push(data[selectedIndex]);
    sampledIndex++;
  }

  // Add remaining points if we haven't reached the target
  while (sampledIndex < threshold && sampledIndex < dataLength) {
    sampled.push(data[sampledIndex]);
    sampledIndex++;
  }

  if (preserveStartEnd && dataLength > 1) {
    sampled.push(data[dataLength - 1]);
  }

  return sampled;
}

/**
 * Calculate area of triangle formed by three points
 * Used by LTTB algorithm to determine which points to keep
 */
function calculateTriangleArea(a: SampledDataPoint, b: SampledDataPoint, c: SampledDataPoint): number {
  // Use date as x-axis and value as y-axis
  const x1 = new Date(a.date).getTime();
  const y1 = a.value;
  const x2 = new Date(b.date).getTime();
  const y2 = b.value;
  const x3 = new Date(c.date).getTime();
  const y3 = c.value;

  // Area of triangle using shoelace formula
  return Math.abs((x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2)) / 2);
}

/**
 * Smart sampling that preserves key characteristics:
 * - Local maxima and minima
 * - Start and end points
 * - Points where trend changes significantly
 */
export function smartSampleData(
  data: ProjectionDataPoint[] | ExtendedProjectionDataPoint[],
  maxPoints: number = 300
): ProjectionDataPoint[] | ExtendedProjectionDataPoint[] {
  if (!data || data.length <= maxPoints) {
    return [...data];
  }

  // Always keep first and last points
  const sampled: SampledDataPoint[] = [data[0]];
  const dataLength = data.length;

  // Find and preserve local extrema
  const extremaIndices = findLocalExtrema(data);

  // Add extrema points
  extremaIndices.forEach(index => {
    if (index > 0 && index < dataLength - 1) {
      sampled.push(data[index]);
    }
  });

  // If we already have enough points, return
  if (sampled.length >= maxPoints) {
    sampled.push(data[dataLength - 1]);
    return sampled.slice(0, maxPoints);
  }

  // Calculate how many more points we need
  const remainingPoints = maxPoints - sampled.length - 1; // -1 for the last point
  const spacing = Math.max(1, Math.floor((dataLength - 2) / remainingPoints));

  // Add evenly spaced points, skipping those already in sampled
  for (let i = 1; i < dataLength - 1; i += spacing) {
    if (sampled.length >= maxPoints - 1) {
      break;
    }

    // Check if this point is already in sampled (extrema)
    const alreadyIncluded = sampled.some(point => point.date === data[i].date);
    if (!alreadyIncluded) {
      sampled.push(data[i]);
    }
  }

  // Add last point
  sampled.push(data[dataLength - 1]);

  return sampled.slice(0, maxPoints);
}

/**
 * Find indices of local maxima and minima
 */
function findLocalExtrema(data: SampledDataPoint[]): number[] {
  const extrema: number[] = [];
  const dataLength = data.length;

  for (let i = 1; i < dataLength - 1; i++) {
    const prev = data[i - 1].value;
    const curr = data[i].value;
    const next = data[i + 1].value;

    // Local maximum
    if (curr > prev && curr > next) {
      extrema.push(i);
      i += 2; // Skip next point to avoid duplicates
    }
    // Local minimum
    else if (curr < prev && curr < next) {
      extrema.push(i);
      i += 2; // Skip next point to avoid duplicates
    }
  }

  return extrema;
}

/**
 * Adaptive sampling based on data density and volatility
 * Samples more densely in volatile regions, less densely in stable regions
 */
export function adaptiveSampleData(
  data: ProjectionDataPoint[] | ExtendedProjectionDataPoint[],
  maxPoints: number = 300
): ProjectionDataPoint[] | ExtendedProjectionDataPoint[] {
  if (!data || data.length <= maxPoints) {
    return [...data];
  }

  const sampled: SampledDataPoint[] = [data[0]];
  const dataLength = data.length;

  // Calculate volatility for each segment
  const volatilityScores: number[] = [];
  
  for (let i = 1; i < dataLength; i++) {
    const volatility = calculateSegmentVolatility(data, Math.max(0, i - 5), Math.min(i + 5, dataLength - 1));
    volatilityScores.push(volatility);
  }

  // Normalize volatility scores
  const maxVolatility = Math.max(...volatilityScores, 0.1);
  const normalizedVolatility = volatilityScores.map(v => v / maxVolatility);

  // Calculate sampling probability based on volatility
  const samplingProbabilities = normalizedVolatility.map(v => Math.pow(v, 0.5));

  // Sample points based on volatility
  const pointsToSample = maxPoints - 2; // -2 for first and last
  const totalProbability = samplingProbabilities.reduce((sum, prob) => sum + prob, 0);

  for (let p = 0; p < pointsToSample; p++) {
    const targetProbability = (p + 1) / pointsToSample * totalProbability;
    let cumulativeProbability = 0;
    
    for (let i = 0; i < samplingProbabilities.length; i++) {
      cumulativeProbability += samplingProbabilities[i];
      
      if (cumulativeProbability >= targetProbability) {
        const index = Math.min(i + 1, dataLength - 2); // +1 because volatility starts from index 1
        
        // Check if already sampled
        const alreadySampled = sampled.some(point => point.date === data[index].date);
        if (!alreadySampled) {
          sampled.push(data[index]);
        }
        break;
      }
    }
  }

  // Add last point
  sampled.push(data[dataLength - 1]);

  return sampled;
}

/**
 * Calculate volatility for a segment of data
 */
function calculateSegmentVolatility(data: SampledDataPoint[], start: number, end: number): number {
  if (end - start <= 1) {
    return 0;
  }

  const values: number[] = [];
  for (let i = start; i <= end; i++) {
    values.push(data[i].value);
  }

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;

  return Math.sqrt(variance);
}

/**
 * Sample data based on zoom level and visible range
 * More aggressive sampling when zoomed out, less when zoomed in
 */
export function zoomLevelBasedSampling(
  data: ProjectionDataPoint[] | ExtendedProjectionDataPoint[],
  visibleRange: IndexRange,
  maxPoints: number = 300
): ProjectionDataPoint[] | ExtendedProjectionDataPoint[] {
  if (!data || data.length <= maxPoints) {
    return [...data];
  }

  // Calculate zoom level (0 = fully zoomed out, 1 = fully zoomed in)
  const totalDataPoints = data.length;
  const visibleDataPoints = visibleRange.endIndex - visibleRange.startIndex + 1;
  const zoomLevel = 1 - (visibleDataPoints / totalDataPoints);

  // Adjust target points based on zoom level
  const adjustedMaxPoints = Math.max(50, Math.min(maxPoints, Math.floor(maxPoints * (0.5 + zoomLevel * 0.5))));

  // Use smart sampling for the visible range
  const visibleData = data.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  const sampledVisible = smartSampleData(visibleData, adjustedMaxPoints);

  return sampledVisible;
}

/**
 * Check if data sampling is needed based on dataset size
 */
export function shouldSampleData(data: SampledDataPoint[], threshold: number = 500): boolean {
  return data && data.length > threshold;
}

/**
 * Get recommended sampling strategy based on data characteristics
 */
export function getRecommendedSamplingStrategy(
  data: ProjectionDataPoint[] | ExtendedProjectionDataPoint[],
  visibleRange?: IndexRange
): {
  method: 'none' | 'lttb' | 'smart' | 'adaptive' | 'zoom-based';
  targetPoints: number;
} {
  if (!data || data.length <= 300) {
    return { method: 'none', targetPoints: data.length };
  }

  if (visibleRange) {
    return { method: 'zoom-based', targetPoints: 300 };
  }

  // Check volatility
  const volatility = calculateOverallVolatility(data);
  
  if (volatility > 0.1) { // High volatility
    return { method: 'adaptive', targetPoints: 400 };
  } else if (data.length > 1000) {
    return { method: 'lttb', targetPoints: 300 };
  } else {
    return { method: 'smart', targetPoints: 300 };
  }
}

/**
 * Calculate overall volatility of the dataset
 */
function calculateOverallVolatility(data: SampledDataPoint[]): number {
  if (data.length <= 1) {
    return 0;
  }

  const returns: number[] = [];
  for (let i = 1; i < data.length; i++) {
    const returnVal = (data[i].value - data[i - 1].value) / data[i - 1].value;
    returns.push(Math.abs(returnVal));
  }

  const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  return meanReturn;
}
