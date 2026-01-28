/**
 * Zigzag local optimization algorithm
 * Compatible with both browser and Node.js
 * @see https://github.com/konard/sonar
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    const TSPUtils = require('./utils.js');
    module.exports = factory(TSPUtils);
  } else {
    root.Zigzag = factory(root.TSPUtils);
  }
}(typeof self !== 'undefined' ? self : this, function (TSPUtils) {
  'use strict';

  const distance = TSPUtils ? TSPUtils.distance : function(start, end) {
    return Math.hypot(end.y - start.y, end.x - start.x);
  };

  /**
   * Check if zigzag swap improves the tour at position i
   * @param {number} i - Position in tour
   * @param {Array} pts - Array of points in tour order
   * @returns {boolean} True if zigzag swap would improve tour
   */
  function shouldZigzag(i, pts) {
    const p1 = pts[(i - 1 + pts.length) % pts.length];
    const p2 = pts[i % pts.length];
    const p3 = pts[(i + 1) % pts.length];
    const p4 = pts[(i + 2) % pts.length];
    const segment1 = distance(p1, p2);
    const segment3 = distance(p3, p4);
    const zigZagSegment1 = distance(p1, p3);
    const zigZagSegment3 = distance(p2, p4);
    return (zigZagSegment1 + zigZagSegment3) < (segment1 + segment3);
  }

  /**
   * Apply zigzag optimization on a tour
   * Checks if swapping adjacent point pairs reduces path length
   * Time complexity: O(n)
   * @param {Array<number>} tourIndices - Array of point indices representing the tour
   * @param {Array} points - Array of point objects
   * @param {Array<Array<number>>} graph - Distance matrix (unused but kept for API consistency)
   * @returns {Array<number>} Optimized tour indices
   */
  function optimize(tourIndices, points, graph) {
    // Convert tour indices to points in tour order
    const tourPoints = tourIndices.map(idx => ({ ...points[idx], originalId: idx }));

    const newTour = [];
    let i = 1;
    while (i < tourPoints.length) {
      if (tourPoints.length - i > 2 && shouldZigzag(i, tourPoints)) {
        newTour.push(tourPoints[i - 1].originalId);
        newTour.push(tourPoints[(i + 1) % tourPoints.length].originalId);
        newTour.push(tourPoints[i % tourPoints.length].originalId);
        newTour.push(tourPoints[(i + 2) % tourPoints.length].originalId);
        i += 3;
      } else {
        newTour.push(tourPoints[i - 1].originalId);
        newTour.push(tourPoints[i % tourPoints.length].originalId);
        i++;
      }
    }

    // Remove duplicates while preserving order
    return [...new Set(newTour)];
  }

  return {
    optimize,
    shouldZigzag
  };
}));
