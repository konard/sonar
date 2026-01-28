/**
 * Sonar Visit algorithm - O(1) angle sweep approach
 * Compatible with both browser and Node.js
 * @see https://github.com/konard/sonar
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SonarVisit = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * Generate a tour using the Sonar Visit algorithm
   * 360 degree rotation sweep in fixed angle steps
   * Points on the same angle are connected by distance from center
   * Time complexity: O(1) angle steps (determined by grid size, not point count)
   *
   * @param {Array} points - Array of point objects with x, y, angle, and id properties
   * @param {number} gridSize - Grid size used for angle bucket calculation (default: 40)
   * @returns {Array<number>} Tour as array of point indices
   */
  function generateTour(points, gridSize = 40) {
    // Calculate angle step based on grid size
    const angleSteps = 4 * gridSize;
    const angleStep = (2 * Math.PI) / angleSteps;

    // Group points by their angle bucket
    const angleBuckets = new Map();

    points.forEach(point => {
      let angle = point.angle;
      if (angle < 0) angle += 2 * Math.PI;

      const bucketIndex = Math.floor(angle / angleStep);
      if (!angleBuckets.has(bucketIndex)) {
        angleBuckets.set(bucketIndex, []);
      }
      angleBuckets.get(bucketIndex).push(point);
    });

    // Sort points within each bucket by distance from center
    const center = { x: 0.5, y: 0.5 };
    angleBuckets.forEach((bucketPoints, key) => {
      bucketPoints.sort((a, b) => {
        const distA = Math.hypot(a.x - center.x, a.y - center.y);
        const distB = Math.hypot(b.x - center.x, b.y - center.y);
        return distA - distB;
      });
    });

    // Build tour by sweeping through angle buckets in order
    const tour = [];
    for (let i = 0; i < angleSteps; i++) {
      if (angleBuckets.has(i)) {
        const bucketPoints = angleBuckets.get(i);
        bucketPoints.forEach(p => tour.push(p.id));
      }
    }

    return tour;
  }

  return {
    generateTour
  };
}));
