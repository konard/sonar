/**
 * 2-Opt local search improvement algorithm
 * Compatible with both browser and Node.js
 * @see https://github.com/konard/sonar
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.TwoOpt = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * Apply 2-opt improvement to a tour
   * Iteratively swaps edge pairs to reduce tour length
   * Time complexity: O(n^2) per iteration
   * @param {Array<number>} tour - Array of point indices
   * @param {Array<Array<number>>} graph - Distance matrix
   * @param {number} maxIterations - Maximum number of improvement iterations
   * @returns {Array<number>} Improved tour
   */
  function improve(tour, graph, maxIterations = 100) {
    const n = tour.length;
    let improved = true;
    let iterations = 0;
    let currentTour = [...tour];

    while (improved && iterations < maxIterations) {
      improved = false;
      iterations++;

      for (let i = 0; i < n - 1; i++) {
        for (let j = i + 2; j < n; j++) {
          // Don't swap if it would break the cycle
          if (j === n - 1 && i === 0) continue;

          const currentDistance = graph[currentTour[i]][currentTour[i + 1]] +
                                  graph[currentTour[j]][currentTour[(j + 1) % n]];
          const newDistance = graph[currentTour[i]][currentTour[j]] +
                              graph[currentTour[i + 1]][currentTour[(j + 1) % n]];

          if (newDistance < currentDistance) {
            // Reverse the segment between i+1 and j
            const newTour = [...currentTour];
            for (let k = 0; k <= j - i - 1; k++) {
              newTour[i + 1 + k] = currentTour[j - k];
            }
            currentTour = newTour;
            improved = true;
          }
        }
      }
    }

    return currentTour;
  }

  return {
    improve
  };
}));
