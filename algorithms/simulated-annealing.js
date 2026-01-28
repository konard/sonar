/**
 * Simulated Annealing algorithm for TSP
 * Compatible with both browser and Node.js
 * @see https://github.com/konard/sonar
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    const TSPUtils = require('./utils.js');
    module.exports = factory(TSPUtils);
  } else {
    root.SimulatedAnnealing = factory(root.TSPUtils);
  }
}(typeof self !== 'undefined' ? self : this, function (TSPUtils) {
  'use strict';

  const calculateTourLength = TSPUtils ? TSPUtils.calculateTourLength : function(tour, graph) {
    let totalDistance = 0;
    const n = tour.length;
    for (let i = 0; i < n; i++) {
      totalDistance += graph[tour[i]][tour[(i + 1) % n]];
    }
    return totalDistance;
  };

  /**
   * Optimize a tour using Simulated Annealing
   * Metaheuristic that accepts worse solutions with decreasing probability
   * to escape local minima
   * Time complexity: O(n * iterations)
   *
   * @param {Array<Array<number>>} graph - Distance matrix
   * @param {Array<number>} initialTour - Starting tour
   * @param {number} maxIterations - Maximum number of iterations
   * @param {number} initialTemperature - Starting temperature
   * @param {number} coolingRate - Temperature decay rate per iteration
   * @returns {Array<number>} Optimized tour
   */
  function optimize(graph, initialTour, maxIterations = 5000, initialTemperature = 1.0, coolingRate = 0.9995) {
    let currentTour = [...initialTour];
    let currentLength = calculateTourLength(currentTour, graph);
    let bestTour = [...currentTour];
    let bestLength = currentLength;

    let temperature = initialTemperature;
    const n = currentTour.length;

    for (let iter = 0; iter < maxIterations; iter++) {
      // Generate neighbor by 2-opt swap
      const i = Math.floor(Math.random() * (n - 1));
      let j = Math.floor(Math.random() * (n - 1));
      if (j >= i) j++;

      const [minIdx, maxIdx] = i < j ? [i, j] : [j, i];

      // Calculate delta
      const prev = (minIdx - 1 + n) % n;
      const nextMax = (maxIdx + 1) % n;

      const oldDist = graph[currentTour[prev]][currentTour[minIdx]] +
                      graph[currentTour[maxIdx]][currentTour[nextMax]];
      const newDist = graph[currentTour[prev]][currentTour[maxIdx]] +
                      graph[currentTour[minIdx]][currentTour[nextMax]];

      const delta = newDist - oldDist;

      // Accept or reject based on Metropolis criterion
      if (delta < 0 || Math.random() < Math.exp(-delta / temperature)) {
        // Reverse the segment
        const newTour = [...currentTour];
        let left = minIdx;
        let right = maxIdx;
        while (left < right) {
          [newTour[left], newTour[right]] = [newTour[right], newTour[left]];
          left++;
          right--;
        }
        currentTour = newTour;
        currentLength = calculateTourLength(currentTour, graph);

        if (currentLength < bestLength) {
          bestTour = [...currentTour];
          bestLength = currentLength;
        }
      }

      temperature *= coolingRate;
    }

    return bestTour;
  }

  return {
    optimize
  };
}));
