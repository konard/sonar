/**
 * Shared utilities for TSP algorithms
 * Compatible with both browser and Node.js
 * @see https://github.com/konard/sonar
 */

// UMD pattern for browser/Node.js compatibility
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // Node.js
    module.exports = factory();
  } else {
    // Browser
    root.TSPUtils = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * Calculate Euclidean distance between two points
   * @param {Object} start - Point with x, y coordinates
   * @param {Object} end - Point with x, y coordinates
   * @returns {number} Distance between points
   */
  function distance(start, end) {
    return Math.hypot(end.y - start.y, end.x - start.x);
  }

  /**
   * Create a distance matrix from an array of points
   * @param {Array} points - Array of points with x, y coordinates
   * @returns {Array<Array<number>>} Distance matrix
   */
  function createDistanceMatrix(points) {
    const n = points.length;
    const graph = Array.from({ length: n }, () => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          graph[i][j] = distance(points[i], points[j]);
        }
      }
    }
    return graph;
  }

  /**
   * Calculate the total length of a tour
   * @param {Array<number>} tour - Array of point indices representing the tour
   * @param {Array<Array<number>>} graph - Distance matrix
   * @returns {number} Total tour length
   */
  function calculateTourLength(tour, graph) {
    let totalDistance = 0;
    const n = tour.length;
    for (let i = 0; i < n; i++) {
      totalDistance += graph[tour[i]][tour[(i + 1) % n]];
    }
    return totalDistance;
  }

  /**
   * Calculate the Minimum Spanning Tree weight using Prim's algorithm
   * Used as a lower bound for TSP
   * @param {Array<Array<number>>} graph - Distance matrix
   * @returns {number} MST weight
   */
  function calculateMST(graph) {
    const n = graph.length;
    const selected = new Array(n).fill(false);
    selected[0] = true;
    let edgeCount = 0;
    let mstWeight = 0;

    while (edgeCount < n - 1) {
      let min = Infinity;
      let x = 0, y = 0;
      for (let i = 0; i < n; i++) {
        if (selected[i]) {
          for (let j = 0; j < n; j++) {
            if (!selected[j] && graph[i][j]) {
              if (min > graph[i][j]) {
                min = graph[i][j];
                x = i;
                y = j;
              }
            }
          }
        }
      }
      mstWeight += graph[x][y];
      selected[y] = true;
      edgeCount++;
    }
    return mstWeight;
  }

  /**
   * Calculate efficiency as (optimal_length / solution_length) * 100
   * This ensures efficiency is always <= 100% when optimal is truly optimal
   * @param {number} solutionLength - Length of the solution to evaluate
   * @param {number} optimalLength - Known optimal tour length
   * @returns {number} Efficiency percentage (0-100)
   */
  function calculateEfficiency(solutionLength, optimalLength) {
    if (solutionLength <= 0) return 0;
    return (optimalLength / solutionLength) * 100;
  }

  /**
   * Generate random points on a normalized grid (0-1 range)
   * @param {number} numPoints - Number of points to generate
   * @param {number} gridSize - Virtual grid size for point placement
   * @param {number} seed - Random seed for reproducibility
   * @returns {Array} Array of point objects with x, y, angle, and id
   */
  function generateNormalizedPoints(numPoints, gridSize = 40, seed = 12345) {
    // Simple LCG for reproducible results
    let currentSeed = seed;
    const rng = () => {
      currentSeed = (currentSeed * 1103515245 + 12345) % (2 ** 31);
      return currentSeed / (2 ** 31);
    };

    const center = 0.5;
    const maxRadius = 0.45;

    // Generate all valid grid positions within the circular area
    const gridStep = 1 / gridSize;
    const validPositions = [];

    for (let gx = 0; gx < gridSize; gx++) {
      for (let gy = 0; gy < gridSize; gy++) {
        const x = (gx + 0.5) * gridStep;
        const y = (gy + 0.5) * gridStep;
        const dx = x - center;
        const dy = y - center;
        const distFromCenter = Math.sqrt(dx * dx + dy * dy);

        if (distFromCenter <= maxRadius) {
          const angle = Math.atan2(dy, dx);
          validPositions.push({ x, y, angle: angle < 0 ? angle + 2 * Math.PI : angle, gx, gy });
        }
      }
    }

    // Shuffle using Fisher-Yates
    for (let i = validPositions.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [validPositions[i], validPositions[j]] = [validPositions[j], validPositions[i]];
    }

    // Select numPoints from shuffled positions
    const points = validPositions.slice(0, Math.min(numPoints, validPositions.length));

    // Assign IDs
    return points.map((p, idx) => ({ ...p, id: idx }));
  }

  /**
   * Scale normalized points to percentage values (0-100%)
   * @param {Array} normalizedPoints - Points in 0-1 range
   * @returns {Array} Points with percentX and percentY properties
   */
  function scalePointsToPercent(normalizedPoints) {
    return normalizedPoints.map(p => ({
      ...p,
      percentX: p.x * 100,
      percentY: p.y * 100
    }));
  }

  return {
    distance,
    createDistanceMatrix,
    calculateTourLength,
    calculateMST,
    calculateEfficiency,
    generateNormalizedPoints,
    scalePointsToPercent
  };
}));
