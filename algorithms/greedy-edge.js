/**
 * Greedy Edge (Nearest Edge) algorithm for TSP
 * Compatible with both browser and Node.js
 * @see https://github.com/konard/sonar
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.GreedyEdge = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * Generate a tour using the Greedy Edge heuristic
   * Builds tour by repeatedly adding the shortest edge that doesn't:
   * - Create a cycle (unless it completes the tour)
   * - Give any vertex degree > 2
   * Time complexity: O(n^2 log n)
   *
   * @param {Array} points - Array of points (only length is used)
   * @param {Array<Array<number>>} graph - Distance matrix
   * @returns {Array<number>} Tour as array of point indices
   */
  function generateTour(points, graph) {
    const n = points.length;

    // Create list of all edges
    const edges = [];
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        edges.push({ from: i, to: j, dist: graph[i][j] });
      }
    }

    // Sort edges by distance
    edges.sort((a, b) => a.dist - b.dist);

    // Track degree of each node
    const degree = new Array(n).fill(0);

    // Union-Find for cycle detection
    const parent = Array.from({ length: n }, (_, i) => i);

    function find(x) {
      if (parent[x] !== x) parent[x] = find(parent[x]);
      return parent[x];
    }

    function union(x, y) {
      parent[find(x)] = find(y);
    }

    // Track adjacency for tour reconstruction
    const adj = Array.from({ length: n }, () => []);
    let edgeCount = 0;

    for (const edge of edges) {
      if (edgeCount >= n) break;

      const { from, to } = edge;

      // Check if adding this edge would violate degree constraint
      if (degree[from] >= 2 || degree[to] >= 2) continue;

      // Check if it would create a premature cycle
      if (edgeCount < n - 1 && find(from) === find(to)) continue;

      // Add edge
      adj[from].push(to);
      adj[to].push(from);
      degree[from]++;
      degree[to]++;
      union(from, to);
      edgeCount++;
    }

    // Reconstruct tour from adjacency list
    const tour = [];
    const visited = new Array(n).fill(false);
    let current = 0;

    while (tour.length < n) {
      tour.push(current);
      visited[current] = true;

      let next = -1;
      for (const neighbor of adj[current]) {
        if (!visited[neighbor]) {
          next = neighbor;
          break;
        }
      }

      if (next === -1) break;
      current = next;
    }

    return tour;
  }

  return {
    generateTour
  };
}));
