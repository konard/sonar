/**
 * Brute Force and Held-Karp exact algorithms for TSP
 * Compatible with both browser and Node.js
 * @see https://github.com/konard/sonar
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    const TSPUtils = require('./utils.js');
    module.exports = factory(TSPUtils);
  } else {
    root.BruteForce = factory(root.TSPUtils);
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
   * Find optimal TSP tour using exhaustive permutation search
   * Time complexity: O(n!)
   * Only practical for n <= 10
   *
   * @param {Array<Array<number>>} graph - Distance matrix
   * @param {number} n - Number of cities
   * @returns {Object} Object containing tour and length
   */
  function bruteForceExact(graph, n) {
    const cities = Array.from({ length: n }, (_, i) => i);
    let bestTour = [...cities];
    let bestLength = calculateTourLength(bestTour, graph);

    // Generate all permutations starting from city 0 (fix first city to reduce search space)
    function permute(arr, start) {
      if (start === arr.length - 1) {
        const length = calculateTourLength(arr, graph);
        if (length < bestLength) {
          bestLength = length;
          bestTour = [...arr];
        }
        return;
      }

      for (let i = start; i < arr.length; i++) {
        [arr[start], arr[i]] = [arr[i], arr[start]];
        permute(arr, start + 1);
        [arr[start], arr[i]] = [arr[i], arr[start]];
      }
    }

    // Fix first city to reduce permutations from n! to (n-1)!
    permute(cities, 1);

    return { tour: bestTour, length: bestLength };
  }

  /**
   * Find optimal TSP tour using Held-Karp dynamic programming
   * Time complexity: O(2^n * n^2)
   * Practical for n <= 20
   *
   * @param {Array<Array<number>>} graph - Distance matrix
   * @param {number} n - Number of cities
   * @returns {Object} Object containing tour and length
   */
  function heldKarp(graph, n) {
    // dp[mask][i] = minimum distance to reach city i, having visited cities in mask
    // mask is a bitmask where bit j is set if city j has been visited
    const dp = new Map();
    const parent = new Map();

    // Base case: start from city 0, visit each other city directly
    for (let i = 1; i < n; i++) {
      const mask = 1 << i;
      dp.set(`${mask},${i}`, graph[0][i]);
      parent.set(`${mask},${i}`, 0);
    }

    // Fill DP table for increasing subset sizes
    for (let size = 2; size < n; size++) {
      // Generate all subsets of given size from cities 1 to n-1
      const subsets = [];

      function generateSubsets(start, current, count) {
        if (count === size) {
          subsets.push(current);
          return;
        }
        for (let i = start; i < n; i++) {
          generateSubsets(i + 1, current | (1 << i), count + 1);
        }
      }
      generateSubsets(1, 0, 0);

      for (const mask of subsets) {
        for (let last = 1; last < n; last++) {
          // Skip if last city is not in the current subset
          if (!(mask & (1 << last))) continue;

          const prevMask = mask ^ (1 << last);
          if (prevMask === 0) continue;

          let bestDist = Infinity;
          let bestPrev = -1;

          // Try all possible previous cities
          for (let prev = 1; prev < n; prev++) {
            if (!(prevMask & (1 << prev))) continue;

            const key = `${prevMask},${prev}`;
            if (!dp.has(key)) continue;

            const dist = dp.get(key) + graph[prev][last];
            if (dist < bestDist) {
              bestDist = dist;
              bestPrev = prev;
            }
          }

          if (bestDist < Infinity) {
            dp.set(`${mask},${last}`, bestDist);
            parent.set(`${mask},${last}`, bestPrev);
          }
        }
      }
    }

    // Find the minimum tour by trying all last cities and returning to 0
    const fullMask = ((1 << n) - 1) ^ 1; // All cities except 0 (bits 1 to n-1)
    let minLength = Infinity;
    let lastCity = -1;

    for (let i = 1; i < n; i++) {
      const key = `${fullMask},${i}`;
      if (dp.has(key)) {
        const dist = dp.get(key) + graph[i][0];
        if (dist < minLength) {
          minLength = dist;
          lastCity = i;
        }
      }
    }

    // Reconstruct the tour
    const tour = [0];
    let currentMask = fullMask;
    let current = lastCity;

    while (current !== 0 && current !== undefined) {
      tour.push(current);
      const key = `${currentMask},${current}`;
      const prev = parent.get(key);
      currentMask ^= (1 << current);
      current = prev;
    }

    return { tour, length: minLength };
  }

  /**
   * Find optimal TSP solution using the best available method for the given size
   * - n <= 10: Use brute force O(n!)
   * - n <= 20: Use Held-Karp O(2^n * n^2)
   * - n > 20: Returns null (exact solution infeasible)
   *
   * @param {Array<Array<number>>} graph - Distance matrix
   * @param {number} n - Number of cities
   * @returns {Object|null} Object containing tour and length, or null if n > 20
   */
  function findOptimal(graph, n) {
    if (n > 20) {
      // For n > 20, exact solution is infeasible
      // Caller should use heuristics instead
      return null;
    }

    if (n <= 10) {
      return bruteForceExact(graph, n);
    }

    return heldKarp(graph, n);
  }

  /**
   * Get maximum number of cities for which exact solution is feasible
   * @returns {number} Maximum feasible n for exact solution
   */
  function getMaxFeasibleN() {
    return 20;
  }

  return {
    bruteForceExact,
    heldKarp,
    findOptimal,
    getMaxFeasibleN
  };
}));
