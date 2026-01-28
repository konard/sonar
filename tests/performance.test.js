/**
 * Performance tests for TSP algorithms
 * Find maximum number of points each algorithm can handle within time budget.
 *
 * Run with:
 *   node tests/performance.test.js           # 30 second timeout
 *   node tests/performance.test.js --ci      # 60 second timeout for CI/CD
 *
 * @see https://github.com/konard/sonar
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
const isCI = process.argv.includes('--ci');
const timeoutSeconds = isCI ? 60 : 30;
const timeoutMs = timeoutSeconds * 1000;

// Memory limit for distance matrix (limit n to avoid OOM)
// n^2 * 8 bytes (float64) should stay under ~500MB
const MAX_SAFE_N = 5000;

// Test results tracking
let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    testsPassed++;
    console.log(`  ✓ ${message}`);
  } else {
    testsFailed++;
    console.log(`  ✗ ${message}`);
  }
}

function describe(name, fn) {
  console.log(`\n${name}`);
  fn();
}

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
 * Create test data for a given n
 */
function createTestData(n, seed = 12345) {
  const gridSize = Math.max(40, Math.ceil(Math.sqrt(n) * 2));
  const points = TSPUtils.generateNormalizedPoints(n, gridSize, seed);
  const graph = TSPUtils.createDistanceMatrix(points);
  return { points, graph };
}

/**
 * Find maximum n that completes within timeout using iterative testing
 * @param {string} name - Algorithm name
 * @param {Function} runFn - Function that takes (points, graph, n) and runs the algorithm
 * @param {number} startN - Starting n to test
 * @param {number} maxN - Maximum n to test
 * @param {number} timeout - Timeout in milliseconds
 * @param {boolean} verbose - Print detailed progress
 * @returns {Object} - { maxN, timeMs }
 */
function findMaxN(name, runFn, startN, maxN, timeout, verbose = true) {
  if (verbose) console.log(`  Finding max n for ${name}...`);

  let bestN = startN;
  let bestTime = 0;
  let n = startN;

  // Enforce memory safety
  maxN = Math.min(maxN, MAX_SAFE_N);

  while (n <= maxN) {
    try {
      const { points, graph } = createTestData(n);
      const { timeMs } = measureTime(() => runFn(points, graph, n));

      if (verbose) console.log(`    n=${n}: ${timeMs.toFixed(2)}ms`);

      if (timeMs > timeout) {
        break;
      }

      bestN = n;
      bestTime = timeMs;

      // Adaptive step size based on time remaining
      const timeRemaining = timeout - timeMs;
      const ratio = timeout / Math.max(1, timeMs);

      if (ratio > 1000) {
        n = Math.min(n * 2, maxN);
      } else if (ratio > 100) {
        n = Math.min(Math.ceil(n * 1.5), maxN);
      } else if (ratio > 10) {
        n = Math.min(n + Math.max(1, Math.floor(n * 0.3)), maxN);
      } else if (ratio > 2) {
        n = n + Math.max(1, Math.floor(n * 0.1));
      } else {
        n++;
      }

      if (n === bestN) n++;
    } catch (e) {
      if (verbose) console.log(`    n=${n}: ERROR - ${e.message}`);
      break;
    }
  }

  if (verbose) console.log(`    RESULT: max n=${bestN} in ${bestTime.toFixed(2)}ms`);

  return { maxN: bestN, timeMs: bestTime };
}

/**
 * Test brute force algorithm with specific n values and verify tour quality
 */
function testBruteForce(n, timeout) {
  const { points, graph } = createTestData(n);

  const { result, timeMs } = measureTime(() => BruteForce.bruteForceExact(graph, n));

  // Verify the result is valid
  const tourValid = result.tour.length === n && new Set(result.tour).size === n;
  const tourLength = TSPUtils.calculateTourLength(result.tour, graph);

  return {
    n,
    timeMs,
    tourValid,
    tourLength: result.length,
    calculatedLength: tourLength,
    lengthMatch: Math.abs(result.length - tourLength) < 0.0001
  };
}

// Define algorithm configurations with expected minimums
// These are minimum expected n values - actual max depends on hardware
const algorithmConfigs = {
  bruteForceExact: {
    run: (points, graph, n) => BruteForce.bruteForceExact(graph, n),
    startN: 6,
    maxN: 13,  // O(n!) - realistically maxes out around 12-13
    minExpected30s: 10,
    minExpected60s: 11
  },
  heldKarp: {
    run: (points, graph, n) => BruteForce.heldKarp(graph, n),
    startN: 6,
    maxN: 18,  // O(2^n * n^2) with O(2^n * n) space - limited by memory
    minExpected30s: 15,
    minExpected60s: 16
  },
  angularSort: {
    run: (points, graph, n) => AngularSort.generateTour(points),
    startN: 100,
    maxN: MAX_SAFE_N,
    minExpected30s: 2000,
    minExpected60s: 2000
  },
  sonarVisit: {
    run: (points, graph, n) => SonarVisit.generateTour(points),
    startN: 100,
    maxN: MAX_SAFE_N,
    minExpected30s: 2000,
    minExpected60s: 2000
  },
  nearestNeighbor: {
    run: (points, graph, n) => NearestNeighbor.generateTour(points, graph),
    startN: 100,
    maxN: MAX_SAFE_N,
    minExpected30s: 500,
    minExpected60s: 500
  },
  greedyEdge: {
    run: (points, graph, n) => GreedyEdge.generateTour(points, graph),
    startN: 100,
    maxN: 3000,
    minExpected30s: 300,
    minExpected60s: 300
  },
  twoOpt: {
    run: (points, graph, n) => {
      const initial = NearestNeighbor.generateTour(points, graph);
      return TwoOpt.improve(initial, graph);
    },
    startN: 50,
    maxN: 1500,
    minExpected30s: 100,
    minExpected60s: 100
  },
  zigzag: {
    run: (points, graph, n) => {
      const initial = AngularSort.generateTour(points);
      return Zigzag.optimize(initial, points, graph);
    },
    startN: 100,
    maxN: MAX_SAFE_N,
    minExpected30s: 500,
    minExpected60s: 500
  },
  simulatedAnnealing: {
    run: (points, graph, n) => {
      const initial = NearestNeighbor.generateTour(points, graph);
      return SimulatedAnnealing.optimize(graph, initial, 5000);
    },
    startN: 50,
    maxN: 2000,
    minExpected30s: 200,
    minExpected60s: 200
  },
  geneticAlgorithm: {
    run: (points, graph, n) => GeneticAlgorithm.optimize(graph, n, 50, 100),
    startN: 20,
    maxN: 500,
    minExpected30s: 50,
    minExpected60s: 50
  }
};

console.log('='.repeat(80));
console.log(`TSP Algorithm Performance Test`);
console.log(`Timeout: ${timeoutSeconds} seconds${isCI ? ' (CI mode)' : ''}`);
console.log('='.repeat(80));

// Main test execution
describe('Brute Force Exact Algorithm - Maximum Points Test', () => {
  // Test specific n values for brute force
  const testCases = [
    { n: 8, maxTimeMs: 100 },
    { n: 9, maxTimeMs: 500 },
    { n: 10, maxTimeMs: 3000 },
    { n: 11, maxTimeMs: 20000 },
    { n: 12, maxTimeMs: timeoutMs }
  ];

  for (const tc of testCases) {
    if (tc.maxTimeMs > timeoutMs) continue;

    const result = testBruteForce(tc.n, tc.maxTimeMs);
    assert(
      result.tourValid && result.lengthMatch && result.timeMs < tc.maxTimeMs,
      `bruteForceExact(n=${tc.n}) completed in ${result.timeMs.toFixed(2)}ms, tour length: ${result.tourLength.toFixed(4)}`
    );
  }

  // Find actual maximum n within timeout
  const { maxN, timeMs } = findMaxN(
    'bruteForceExact',
    algorithmConfigs.bruteForceExact.run,
    algorithmConfigs.bruteForceExact.startN,
    algorithmConfigs.bruteForceExact.maxN,
    timeoutMs
  );

  const minExpected = isCI
    ? algorithmConfigs.bruteForceExact.minExpected60s
    : algorithmConfigs.bruteForceExact.minExpected30s;

  assert(
    maxN >= minExpected,
    `bruteForceExact max n=${maxN} should be >= ${minExpected} within ${timeoutSeconds}s (achieved in ${timeMs.toFixed(2)}ms)`
  );
});

describe('Held-Karp Algorithm - Maximum Points Test', () => {
  // Test to ensure Held-Karp can handle up to n=15 or so
  const safeN = 15; // Safe value that won't run out of memory
  const { points, graph } = createTestData(safeN);

  const { result, timeMs } = measureTime(() => BruteForce.heldKarp(graph, safeN));

  const tourValid = result.tour.length === safeN && new Set(result.tour).size === safeN;
  assert(
    tourValid && timeMs < timeoutMs,
    `heldKarp(n=${safeN}) completed in ${timeMs.toFixed(2)}ms, tour length: ${result.length.toFixed(4)}`
  );

  // Compare with brute force for small n to verify correctness
  const smallN = 8;
  const { points: smallPoints, graph: smallGraph } = createTestData(smallN);

  const bruteResult = BruteForce.bruteForceExact(smallGraph, smallN);
  const hkResult = BruteForce.heldKarp(smallGraph, smallN);

  assert(
    Math.abs(bruteResult.length - hkResult.length) < 0.0001,
    `heldKarp and bruteForceExact produce same optimal length for n=${smallN} (${hkResult.length.toFixed(4)})`
  );
});

describe('Heuristic Algorithms - Maximum Points Test', () => {
  // Test heuristic algorithms with their expected performance
  const heuristicAlgos = [
    'angularSort', 'sonarVisit', 'nearestNeighbor', 'greedyEdge',
    'twoOpt', 'zigzag', 'simulatedAnnealing', 'geneticAlgorithm'
  ];

  const results = {};

  for (const algoName of heuristicAlgos) {
    const config = algorithmConfigs[algoName];
    const { maxN, timeMs } = findMaxN(
      algoName,
      config.run,
      config.startN,
      config.maxN,
      timeoutMs,
      true
    );

    results[algoName] = { maxN, timeMs };

    const minExpected = isCI ? config.minExpected60s : config.minExpected30s;
    assert(
      maxN >= minExpected,
      `${algoName} max n=${maxN} should be >= ${minExpected} within ${timeoutSeconds}s (achieved in ${timeMs.toFixed(2)}ms)`
    );
  }

  // Print summary table
  console.log('\n  Summary Table:');
  console.log('  ' + '-'.repeat(60));
  console.log('  Algorithm                    | Max N     | Time (ms)');
  console.log('  ' + '-'.repeat(60));
  for (const [name, data] of Object.entries(results)) {
    console.log(`  ${name.padEnd(30)} | ${String(data.maxN).padStart(9)} | ${data.timeMs.toFixed(2).padStart(10)}`);
  }
  console.log('  ' + '-'.repeat(60));
});

describe('Algorithm Correctness at Maximum N', () => {
  // Verify that tours are valid at the maximum n values
  const testN = isCI ? 100 : 50;
  const { points, graph } = createTestData(testN);

  const algorithms = [
    { name: 'AngularSort', fn: () => AngularSort.generateTour(points) },
    { name: 'SonarVisit', fn: () => SonarVisit.generateTour(points) },
    { name: 'NearestNeighbor', fn: () => NearestNeighbor.generateTour(points, graph) },
    { name: 'GreedyEdge', fn: () => GreedyEdge.generateTour(points, graph) },
    { name: 'TwoOpt', fn: () => TwoOpt.improve(NearestNeighbor.generateTour(points, graph), graph) },
    { name: 'Zigzag', fn: () => Zigzag.optimize(AngularSort.generateTour(points), points, graph) },
    { name: 'SimulatedAnnealing', fn: () => SimulatedAnnealing.optimize(graph, NearestNeighbor.generateTour(points, graph)) },
    { name: 'GeneticAlgorithm', fn: () => GeneticAlgorithm.optimize(graph, testN) }
  ];

  for (const algo of algorithms) {
    const tour = algo.fn();
    const tourValid = tour.length === testN && new Set(tour).size === testN;
    const tourLength = TSPUtils.calculateTourLength(tour, graph);

    assert(
      tourValid,
      `${algo.name} produces valid tour at n=${testN} (length: ${tourLength.toFixed(4)})`
    );
  }
});

// Summary
console.log('\n' + '='.repeat(80));
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);
console.log('='.repeat(80));

if (testsFailed > 0) {
  process.exit(1);
}
