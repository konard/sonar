/**
 * Experiment script to find maximum number of points each algorithm can handle
 * within a given time budget.
 *
 * Run with: node experiments/find-max-points.js [timeout_seconds]
 * Default timeout: 30 seconds
 */

const TSPUtils = require('../algorithms/utils.js');
const TwoOpt = require('../algorithms/two-opt.js');
const Zigzag = require('../algorithms/zigzag.js');
const SonarVisit = require('../algorithms/sonar-visit.js');
const AngularSort = require('../algorithms/angular-sort.js');
const NearestNeighbor = require('../algorithms/nearest-neighbor.js');
const GreedyEdge = require('../algorithms/greedy-edge.js');
const SimulatedAnnealing = require('../algorithms/simulated-annealing.js');
const GeneticAlgorithm = require('../algorithms/genetic.js');
const BruteForce = require('../algorithms/brute-force.js');

// Parse command line arguments
const timeoutSeconds = parseInt(process.argv[2]) || 30;
const timeoutMs = timeoutSeconds * 1000;

console.log(`Finding maximum points for each algorithm within ${timeoutSeconds} seconds timeout\n`);
console.log('='.repeat(80));

/**
 * Measure execution time of an algorithm
 * @param {Function} fn - Function to execute
 * @returns {Object} - { result, timeMs }
 */
function measureTime(fn) {
  const start = process.hrtime.bigint();
  const result = fn();
  const end = process.hrtime.bigint();
  const timeMs = Number(end - start) / 1e6;
  return { result, timeMs };
}

/**
 * Binary search to find maximum n that completes within timeout
 * @param {string} name - Algorithm name
 * @param {Function} runFn - Function that takes (points, graph, n) and runs the algorithm
 * @param {number} minN - Minimum n to test
 * @param {number} maxN - Maximum n to test
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Object} - { maxN, timeMs }
 */
function findMaxN(name, runFn, minN, maxN, timeout) {
  console.log(`\nTesting ${name}...`);

  let bestN = minN;
  let bestTime = 0;

  // First, find a rough upper bound by doubling
  let n = minN;
  while (n <= maxN) {
    const points = TSPUtils.generateNormalizedPoints(n, Math.max(40, Math.ceil(Math.sqrt(n) * 2)), 12345);
    const graph = TSPUtils.createDistanceMatrix(points);

    const { timeMs } = measureTime(() => runFn(points, graph, n));

    console.log(`  n=${n}: ${timeMs.toFixed(2)}ms`);

    if (timeMs > timeout) {
      break;
    }

    bestN = n;
    bestTime = timeMs;

    // For fast algorithms, jump by larger increments
    if (timeMs < timeout / 100) {
      n = Math.min(n * 2, maxN);
    } else if (timeMs < timeout / 10) {
      n = Math.min(Math.ceil(n * 1.5), maxN);
    } else {
      n++;
    }

    if (n === bestN) n++;
  }

  // Binary search for the exact boundary
  let low = bestN;
  let high = Math.min(n, maxN);

  while (low < high - 1) {
    const mid = Math.floor((low + high) / 2);
    const points = TSPUtils.generateNormalizedPoints(mid, Math.max(40, Math.ceil(Math.sqrt(mid) * 2)), 12345);
    const graph = TSPUtils.createDistanceMatrix(points);

    const { timeMs } = measureTime(() => runFn(points, graph, mid));
    console.log(`  n=${mid}: ${timeMs.toFixed(2)}ms`);

    if (timeMs <= timeout) {
      low = mid;
      bestTime = timeMs;
    } else {
      high = mid;
    }
  }

  bestN = low;

  // Final verification
  const finalPoints = TSPUtils.generateNormalizedPoints(bestN, Math.max(40, Math.ceil(Math.sqrt(bestN) * 2)), 12345);
  const finalGraph = TSPUtils.createDistanceMatrix(finalPoints);
  const { timeMs: finalTime } = measureTime(() => runFn(finalPoints, finalGraph, bestN));

  console.log(`  RESULT: max n=${bestN} in ${finalTime.toFixed(2)}ms`);

  return { maxN: bestN, timeMs: finalTime };
}

// Define algorithms to test
const algorithms = [
  {
    name: 'BruteForce (bruteForceExact)',
    run: (points, graph, n) => BruteForce.bruteForceExact(graph, n),
    minN: 4,
    maxN: 13  // O(n!) becomes impractical very quickly
  },
  {
    name: 'BruteForce (heldKarp)',
    run: (points, graph, n) => BruteForce.heldKarp(graph, n),
    minN: 4,
    maxN: 25  // O(2^n * n^2)
  },
  {
    name: 'AngularSort',
    run: (points, graph, n) => AngularSort.generateTour(points),
    minN: 10,
    maxN: 100000
  },
  {
    name: 'SonarVisit',
    run: (points, graph, n) => SonarVisit.generateTour(points),
    minN: 10,
    maxN: 100000
  },
  {
    name: 'NearestNeighbor',
    run: (points, graph, n) => NearestNeighbor.generateTour(points, graph),
    minN: 10,
    maxN: 10000
  },
  {
    name: 'GreedyEdge',
    run: (points, graph, n) => GreedyEdge.generateTour(points, graph),
    minN: 10,
    maxN: 5000
  },
  {
    name: 'TwoOpt (with NearestNeighbor)',
    run: (points, graph, n) => {
      const initial = NearestNeighbor.generateTour(points, graph);
      return TwoOpt.improve(initial, graph);
    },
    minN: 10,
    maxN: 3000
  },
  {
    name: 'Zigzag (with AngularSort)',
    run: (points, graph, n) => {
      const initial = AngularSort.generateTour(points);
      return Zigzag.optimize(initial, points, graph);
    },
    minN: 10,
    maxN: 5000
  },
  {
    name: 'SimulatedAnnealing (with NearestNeighbor, 5000 iterations)',
    run: (points, graph, n) => {
      const initial = NearestNeighbor.generateTour(points, graph);
      return SimulatedAnnealing.optimize(graph, initial, 5000);
    },
    minN: 10,
    maxN: 5000
  },
  {
    name: 'GeneticAlgorithm (pop=50, gen=100)',
    run: (points, graph, n) => GeneticAlgorithm.optimize(graph, n, 50, 100),
    minN: 10,
    maxN: 1000
  }
];

// Run tests
const results = [];

for (const algo of algorithms) {
  try {
    const { maxN, timeMs } = findMaxN(algo.name, algo.run, algo.minN, algo.maxN, timeoutMs);
    results.push({ name: algo.name, maxN, timeMs });
  } catch (e) {
    console.log(`  ERROR: ${e.message}`);
    results.push({ name: algo.name, maxN: 0, timeMs: 0, error: e.message });
  }
}

// Summary
console.log('\n' + '='.repeat(80));
console.log(`\nSUMMARY (timeout: ${timeoutSeconds}s)`);
console.log('='.repeat(80));
console.log('\nAlgorithm                                            | Max N | Time (ms)');
console.log('-'.repeat(80));

results.sort((a, b) => b.maxN - a.maxN);

for (const r of results) {
  const name = r.name.padEnd(52);
  const maxN = String(r.maxN).padStart(5);
  const time = r.timeMs.toFixed(2).padStart(10);
  console.log(`${name} | ${maxN} | ${time}`);
}

console.log('\n' + '='.repeat(80));

// Output JSON for programmatic use
console.log('\nJSON Results:');
console.log(JSON.stringify(results, null, 2));
