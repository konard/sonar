/**
 * Angular Sort algorithm - O(n log n) sorting-based approach
 * Compatible with both browser and Node.js
 * @see https://github.com/konard/sonar
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AngularSort = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * Generate a tour by sorting points by their angle from center
   * Points are connected sequentially after sorting
   * Time complexity: O(n log n) dominated by the sort
   *
   * @param {Array} points - Array of point objects with angle and id properties
   * @returns {Array<number>} Tour as array of point indices
   */
  function generateTour(points) {
    const sortedPoints = [...points].sort((a, b) => a.angle - b.angle);
    return sortedPoints.map(p => p.id);
  }

  return {
    generateTour
  };
}));
