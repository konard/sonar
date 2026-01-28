/**
 * Nearest Neighbor (Greedy) algorithm for TSP
 * Compatible with both browser and Node.js
 * @see https://github.com/konard/sonar
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NearestNeighbor = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * Generate a tour using the Nearest Neighbor heuristic
   * Start from a point and always visit the closest unvisited point
   * Time complexity: O(n^2)
   *
   * @param {Array} points - Array of points (only length is used)
   * @param {Array<Array<number>>} graph - Distance matrix
   * @param {number} startCity - Starting city index (default: 0)
   * @returns {Array<number>} Tour as array of point indices
   */
  function generateTour(points, graph, startCity = 0) {
    const n = points.length;
    const visited = new Array(n).fill(false);
    const tour = [];

    let current = startCity;
    tour.push(current);
    visited[current] = true;

    while (tour.length < n) {
      let nearest = -1;
      let nearestDist = Infinity;

      for (let i = 0; i < n; i++) {
        if (!visited[i] && graph[current][i] < nearestDist) {
          nearest = i;
          nearestDist = graph[current][i];
        }
      }

      if (nearest !== -1) {
        tour.push(nearest);
        visited[nearest] = true;
        current = nearest;
      }
    }

    return tour;
  }

  return {
    generateTour
  };
}));
