/**
 * TSP Algorithm Library - Main Entry Point
 * Compatible with both browser and Node.js
 * @see https://github.com/konard/sonar
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // Node.js - require all modules
    const TSPUtils = require('./utils.js');
    const TwoOpt = require('./two-opt.js');
    const Zigzag = require('./zigzag.js');
    const SonarVisit = require('./sonar-visit.js');
    const AngularSort = require('./angular-sort.js');
    const NearestNeighbor = require('./nearest-neighbor.js');
    const GreedyEdge = require('./greedy-edge.js');
    const SimulatedAnnealing = require('./simulated-annealing.js');
    const GeneticAlgorithm = require('./genetic.js');
    const BruteForce = require('./brute-force.js');

    module.exports = factory(
      TSPUtils, TwoOpt, Zigzag, SonarVisit, AngularSort,
      NearestNeighbor, GreedyEdge, SimulatedAnnealing, GeneticAlgorithm, BruteForce
    );
  } else {
    // Browser - modules are already on root from script tags
    root.TSPAlgorithms = factory(
      root.TSPUtils, root.TwoOpt, root.Zigzag, root.SonarVisit, root.AngularSort,
      root.NearestNeighbor, root.GreedyEdge, root.SimulatedAnnealing, root.GeneticAlgorithm, root.BruteForce
    );
  }
}(typeof self !== 'undefined' ? self : this, function (
  TSPUtils, TwoOpt, Zigzag, SonarVisit, AngularSort,
  NearestNeighbor, GreedyEdge, SimulatedAnnealing, GeneticAlgorithm, BruteForce
) {
  'use strict';

  return {
    // Utilities
    utils: TSPUtils,

    // Optimization algorithms
    twoOpt: TwoOpt,
    zigzag: Zigzag,

    // Tour construction algorithms
    sonarVisit: SonarVisit,
    angularSort: AngularSort,
    nearestNeighbor: NearestNeighbor,
    greedyEdge: GreedyEdge,

    // Metaheuristics
    simulatedAnnealing: SimulatedAnnealing,
    geneticAlgorithm: GeneticAlgorithm,

    // Exact algorithms
    bruteForce: BruteForce,

    // Version info
    version: '1.0.0',
    repository: 'https://github.com/konard/sonar'
  };
}));
