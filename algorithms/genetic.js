/**
 * Genetic Algorithm for TSP
 * Compatible with both browser and Node.js
 * @see https://github.com/konard/sonar
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    const TSPUtils = require('./utils.js');
    module.exports = factory(TSPUtils);
  } else {
    root.GeneticAlgorithm = factory(root.TSPUtils);
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
   * Create a random tour permutation
   * @param {number} n - Number of cities
   * @returns {Array<number>} Random tour
   */
  function randomTour(n) {
    const tour = Array.from({ length: n }, (_, i) => i);
    // Fisher-Yates shuffle
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tour[i], tour[j]] = [tour[j], tour[i]];
    }
    return tour;
  }

  /**
   * Order Crossover (OX) operator
   * @param {Array<number>} parent1 - First parent tour
   * @param {Array<number>} parent2 - Second parent tour
   * @returns {Array<number>} Child tour
   */
  function crossover(parent1, parent2) {
    const n = parent1.length;
    const start = Math.floor(Math.random() * n);
    const end = start + Math.floor(Math.random() * (n - start));

    const child = new Array(n).fill(-1);
    const used = new Set();

    // Copy segment from parent1
    for (let i = start; i <= end; i++) {
      child[i] = parent1[i];
      used.add(parent1[i]);
    }

    // Fill rest from parent2 in order
    let idx = (end + 1) % n;
    for (let i = 0; i < n; i++) {
      const city = parent2[(end + 1 + i) % n];
      if (!used.has(city)) {
        child[idx] = city;
        idx = (idx + 1) % n;
      }
    }

    return child;
  }

  /**
   * Mutation by swapping two random cities
   * @param {Array<number>} tour - Tour to mutate
   * @returns {Array<number>} Mutated tour
   */
  function mutate(tour) {
    const newTour = [...tour];
    const n = tour.length;
    const i = Math.floor(Math.random() * n);
    const j = Math.floor(Math.random() * n);
    [newTour[i], newTour[j]] = [newTour[j], newTour[i]];
    return newTour;
  }

  /**
   * Optimize TSP using a Genetic Algorithm
   * Evolutionary approach using selection, crossover, and mutation
   * Time complexity: O(populationSize * generations * n)
   *
   * @param {Array<Array<number>>} graph - Distance matrix
   * @param {number} n - Number of cities
   * @param {number} populationSize - Size of the population
   * @param {number} generations - Number of generations to evolve
   * @param {number} mutationRate - Probability of mutation (0-1)
   * @returns {Array<number>} Best tour found
   */
  function optimize(graph, n, populationSize = 50, generations = 100, mutationRate = 0.1) {
    // Initialize population
    let population = [];
    for (let i = 0; i < populationSize; i++) {
      population.push(randomTour(n));
    }

    for (let gen = 0; gen < generations; gen++) {
      // Calculate fitness (inverse of tour length)
      const fitnesses = population.map(tour => 1 / calculateTourLength(tour, graph));
      const totalFitness = fitnesses.reduce((a, b) => a + b, 0);

      // Roulette wheel selection
      function select() {
        let r = Math.random() * totalFitness;
        for (let i = 0; i < populationSize; i++) {
          r -= fitnesses[i];
          if (r <= 0) return population[i];
        }
        return population[populationSize - 1];
      }

      // Create new population
      const newPopulation = [];

      // Elitism: keep the best individual
      let bestIdx = 0;
      for (let i = 1; i < populationSize; i++) {
        if (fitnesses[i] > fitnesses[bestIdx]) bestIdx = i;
      }
      newPopulation.push(population[bestIdx]);

      // Generate rest of population through selection and crossover
      while (newPopulation.length < populationSize) {
        const parent1 = select();
        const parent2 = select();
        let child = crossover(parent1, parent2);

        // Apply mutation with given probability
        if (Math.random() < mutationRate) {
          child = mutate(child);
        }

        newPopulation.push(child);
      }

      population = newPopulation;
    }

    // Return the best tour from final population
    let bestTour = population[0];
    let bestLength = calculateTourLength(bestTour, graph);

    for (const tour of population) {
      const length = calculateTourLength(tour, graph);
      if (length < bestLength) {
        bestTour = tour;
        bestLength = length;
      }
    }

    return bestTour;
  }

  return {
    optimize,
    randomTour,
    crossover,
    mutate
  };
}));
