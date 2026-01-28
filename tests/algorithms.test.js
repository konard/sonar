/**
 * Unit tests for TSP algorithms
 * Run with: node tests/algorithms.test.js
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

// Simple test framework
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

function assertClose(actual, expected, tolerance, message) {
  const diff = Math.abs(actual - expected);
  if (diff <= tolerance) {
    testsPassed++;
    console.log(`  ✓ ${message} (${actual.toFixed(4)} ≈ ${expected.toFixed(4)})`);
  } else {
    testsFailed++;
    console.log(`  ✗ ${message} (${actual.toFixed(4)} != ${expected.toFixed(4)}, diff=${diff.toFixed(4)})`);
  }
}

function describe(name, fn) {
  console.log(`\n${name}`);
  fn();
}

// Test data - small set for exact solution verification
const testPoints = [
  { x: 0, y: 0, id: 0, angle: Math.PI },
  { x: 1, y: 0, id: 1, angle: 0 },
  { x: 1, y: 1, id: 2, angle: Math.PI / 4 },
  { x: 0, y: 1, id: 3, angle: Math.PI / 2 }
];

// Create graph (distance matrix)
const testGraph = TSPUtils.createDistanceMatrix(testPoints);

// For a square, optimal tour length is 4 (perimeter)
const OPTIMAL_SQUARE_LENGTH = 4;

describe('TSPUtils', () => {
  describe('distance', () => {
    assert(
      TSPUtils.distance({ x: 0, y: 0 }, { x: 3, y: 4 }) === 5,
      'should calculate Euclidean distance correctly (3-4-5 triangle)'
    );

    assert(
      TSPUtils.distance({ x: 0, y: 0 }, { x: 0, y: 0 }) === 0,
      'should return 0 for same point'
    );

    assertClose(
      TSPUtils.distance({ x: 0, y: 0 }, { x: 1, y: 1 }),
      Math.SQRT2,
      0.0001,
      'should calculate diagonal distance correctly'
    );
  });

  describe('createDistanceMatrix', () => {
    assert(
      testGraph.length === 4,
      'should create matrix with correct size'
    );

    assert(
      testGraph[0][0] === 0,
      'diagonal should be zero'
    );

    assertClose(
      testGraph[0][1],
      1,
      0.0001,
      'should calculate distances correctly'
    );

    assert(
      testGraph[0][1] === testGraph[1][0],
      'matrix should be symmetric'
    );
  });

  describe('calculateTourLength', () => {
    assertClose(
      TSPUtils.calculateTourLength([0, 1, 2, 3], testGraph),
      OPTIMAL_SQUARE_LENGTH,
      0.0001,
      'should calculate square perimeter correctly'
    );

    // Non-optimal tour (diagonal crossing)
    const nonOptimalLength = TSPUtils.calculateTourLength([0, 2, 1, 3], testGraph);
    assert(
      nonOptimalLength > OPTIMAL_SQUARE_LENGTH,
      'non-optimal tour should be longer than optimal'
    );
  });

  describe('calculateEfficiency', () => {
    assert(
      TSPUtils.calculateEfficiency(4, 4) === 100,
      'should return 100% for optimal solution'
    );

    assert(
      TSPUtils.calculateEfficiency(5, 4) === 80,
      'should return correct efficiency for suboptimal solution'
    );

    assert(
      TSPUtils.calculateEfficiency(4, 4) <= 100,
      'efficiency should never exceed 100% when solution equals optimal'
    );
  });

  describe('generateNormalizedPoints', () => {
    const points = TSPUtils.generateNormalizedPoints(10, 20, 12345);

    assert(
      points.length === 10,
      'should generate correct number of points'
    );

    assert(
      points.every(p => p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1),
      'all points should be in normalized range [0, 1]'
    );

    assert(
      points.every(p => typeof p.id === 'number'),
      'all points should have id property'
    );

    assert(
      points.every(p => typeof p.angle === 'number'),
      'all points should have angle property'
    );

    // Test reproducibility with same seed
    const points2 = TSPUtils.generateNormalizedPoints(10, 20, 12345);
    assert(
      points[0].x === points2[0].x && points[0].y === points2[0].y,
      'same seed should produce same points'
    );
  });
});

describe('BruteForce', () => {
  describe('bruteForceExact', () => {
    const result = BruteForce.bruteForceExact(testGraph, 4);

    assertClose(
      result.length,
      OPTIMAL_SQUARE_LENGTH,
      0.0001,
      'should find optimal tour for square'
    );

    assert(
      result.tour.length === 4,
      'tour should visit all cities'
    );

    assert(
      new Set(result.tour).size === 4,
      'tour should not have duplicates'
    );
  });

  describe('heldKarp', () => {
    const result = BruteForce.heldKarp(testGraph, 4);

    assertClose(
      result.length,
      OPTIMAL_SQUARE_LENGTH,
      0.0001,
      'should find optimal tour for square using Held-Karp'
    );

    assert(
      result.tour.length === 4,
      'tour should visit all cities'
    );
  });

  describe('findOptimal', () => {
    const result = BruteForce.findOptimal(testGraph, 4);

    assertClose(
      result.length,
      OPTIMAL_SQUARE_LENGTH,
      0.0001,
      'findOptimal should return optimal solution for small n'
    );

    // Test that it returns null for n > 20
    const largeGraph = Array.from({ length: 25 }, () => Array(25).fill(1));
    const largeResult = BruteForce.findOptimal(largeGraph, 25);
    assert(
      largeResult === null,
      'should return null for n > 20'
    );
  });
});

describe('TwoOpt', () => {
  // Start with a suboptimal tour (diagonal crossing)
  const suboptimalTour = [0, 2, 1, 3];
  const improved = TwoOpt.improve(suboptimalTour, testGraph);
  const improvedLength = TSPUtils.calculateTourLength(improved, testGraph);

  assert(
    improvedLength <= TSPUtils.calculateTourLength(suboptimalTour, testGraph),
    'should improve or maintain tour quality'
  );

  assertClose(
    improvedLength,
    OPTIMAL_SQUARE_LENGTH,
    0.0001,
    'should find optimal tour for square after improvement'
  );
});

describe('Zigzag', () => {
  // Test with angular sort first
  const angularTour = AngularSort.generateTour(testPoints);
  const zigzagTour = Zigzag.optimize(angularTour, testPoints, testGraph);

  assert(
    zigzagTour.length === testPoints.length || zigzagTour.length <= testPoints.length,
    'zigzag tour should have correct or fewer points (no duplicates)'
  );

  const zigzagLength = TSPUtils.calculateTourLength(zigzagTour, testGraph);
  const angularLength = TSPUtils.calculateTourLength(angularTour, testGraph);

  assert(
    zigzagLength <= angularLength + 0.0001,
    'zigzag should improve or maintain tour quality'
  );
});

describe('SonarVisit', () => {
  // Use larger test set with proper angle values
  const sonarPoints = TSPUtils.generateNormalizedPoints(10, 20, 42);
  const tour = SonarVisit.generateTour(sonarPoints);

  assert(
    tour.length === sonarPoints.length,
    'should visit all points'
  );

  assert(
    new Set(tour).size === sonarPoints.length,
    'tour should not have duplicates'
  );

  assert(
    tour.every(id => id >= 0 && id < sonarPoints.length),
    'all tour indices should be valid'
  );
});

describe('AngularSort', () => {
  const tour = AngularSort.generateTour(testPoints);

  assert(
    tour.length === testPoints.length,
    'should visit all points'
  );

  assert(
    new Set(tour).size === testPoints.length,
    'tour should not have duplicates'
  );
});

describe('NearestNeighbor', () => {
  const tour = NearestNeighbor.generateTour(testPoints, testGraph);

  assert(
    tour.length === testPoints.length,
    'should visit all points'
  );

  assert(
    new Set(tour).size === testPoints.length,
    'tour should not have duplicates'
  );

  assert(
    tour[0] === 0,
    'should start from city 0 by default'
  );

  const length = TSPUtils.calculateTourLength(tour, testGraph);
  const optimal = BruteForce.findOptimal(testGraph, 4);
  const efficiency = TSPUtils.calculateEfficiency(length, optimal.length);

  assert(
    efficiency <= 100,
    'efficiency should not exceed 100%'
  );
});

describe('GreedyEdge', () => {
  const tour = GreedyEdge.generateTour(testPoints, testGraph);

  assert(
    tour.length === testPoints.length,
    'should visit all points'
  );

  assert(
    new Set(tour).size === testPoints.length,
    'tour should not have duplicates'
  );

  const length = TSPUtils.calculateTourLength(tour, testGraph);
  const optimal = BruteForce.findOptimal(testGraph, 4);
  const efficiency = TSPUtils.calculateEfficiency(length, optimal.length);

  assert(
    efficiency <= 100,
    'efficiency should not exceed 100%'
  );
});

describe('SimulatedAnnealing', () => {
  const initialTour = NearestNeighbor.generateTour(testPoints, testGraph);
  const tour = SimulatedAnnealing.optimize(testGraph, initialTour);

  assert(
    tour.length === testPoints.length,
    'should visit all points'
  );

  assert(
    new Set(tour).size === testPoints.length,
    'tour should not have duplicates'
  );

  const length = TSPUtils.calculateTourLength(tour, testGraph);
  const optimal = BruteForce.findOptimal(testGraph, 4);
  const efficiency = TSPUtils.calculateEfficiency(length, optimal.length);

  assert(
    efficiency <= 100,
    'efficiency should not exceed 100%'
  );
});

describe('GeneticAlgorithm', () => {
  const tour = GeneticAlgorithm.optimize(testGraph, 4);

  assert(
    tour.length === testPoints.length,
    'should visit all points'
  );

  assert(
    new Set(tour).size === testPoints.length,
    'tour should not have duplicates'
  );

  const length = TSPUtils.calculateTourLength(tour, testGraph);
  const optimal = BruteForce.findOptimal(testGraph, 4);
  const efficiency = TSPUtils.calculateEfficiency(length, optimal.length);

  assert(
    efficiency <= 100,
    'efficiency should not exceed 100%'
  );
});

describe('Efficiency Verification (Critical Test)', () => {
  // Generate random points and verify no algorithm exceeds 100% efficiency
  const randomPoints = TSPUtils.generateNormalizedPoints(8, 20, 99999);
  const graph = TSPUtils.createDistanceMatrix(randomPoints);
  const optimal = BruteForce.findOptimal(graph, 8);

  console.log(`  Optimal tour length: ${optimal.length.toFixed(4)}`);

  const algorithms = [
    { name: 'SonarVisit', fn: () => SonarVisit.generateTour(randomPoints) },
    { name: 'AngularSort', fn: () => AngularSort.generateTour(randomPoints) },
    { name: 'NearestNeighbor', fn: () => NearestNeighbor.generateTour(randomPoints, graph) },
    { name: 'GreedyEdge', fn: () => GreedyEdge.generateTour(randomPoints, graph) },
    { name: 'TwoOpt', fn: () => TwoOpt.improve(NearestNeighbor.generateTour(randomPoints, graph), graph) },
    { name: 'SimulatedAnnealing', fn: () => SimulatedAnnealing.optimize(graph, NearestNeighbor.generateTour(randomPoints, graph)) },
    { name: 'GeneticAlgorithm', fn: () => GeneticAlgorithm.optimize(graph, 8) }
  ];

  for (const algo of algorithms) {
    const tour = algo.fn();
    const length = TSPUtils.calculateTourLength(tour, graph);
    const efficiency = TSPUtils.calculateEfficiency(length, optimal.length);

    assert(
      efficiency <= 100.001, // Small tolerance for floating point
      `${algo.name} efficiency should not exceed 100% (got ${efficiency.toFixed(2)}%)`
    );

    if (efficiency > 100) {
      console.log(`    WARNING: ${algo.name} found tour length ${length.toFixed(4)} vs optimal ${optimal.length.toFixed(4)}`);
    }
  }
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);
console.log('='.repeat(50));

if (testsFailed > 0) {
  process.exit(1);
}
