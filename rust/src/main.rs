//! TSP Algorithms Benchmark
//!
//! This program benchmarks various TSP (Traveling Salesman Problem) algorithms
//! to find the maximum number of points each can handle within a given time limit.
//!
//! Run with: cargo run --release -- [timeout_seconds]
//! Default timeout: 30 seconds

mod utils;
mod two_opt;
mod zigzag;
mod sonar_visit;
mod angular_sort;
mod nearest_neighbor;
mod greedy_edge;
mod simulated_annealing;
mod genetic;
mod brute_force;

use std::env;
use std::time::{Duration, Instant};
use utils::{Point, create_distance_matrix, generate_normalized_points};

/// Measures the execution time of a function
fn measure_time<T, F: FnOnce() -> T>(f: F) -> (T, Duration) {
    let start = Instant::now();
    let result = f();
    (result, start.elapsed())
}

/// Result of finding maximum N for an algorithm
#[derive(Debug)]
#[allow(dead_code)]
struct BenchmarkResult {
    name: String,
    max_n: usize,
    time_ms: f64,
    error: Option<String>,
}

/// Binary search to find maximum n that completes within timeout
fn find_max_n<F>(
    name: &str,
    run_fn: F,
    min_n: usize,
    max_n: usize,
    timeout: Duration,
    needs_graph: bool,
) -> BenchmarkResult
where
    F: Fn(&[Point], &[Vec<f64>], usize) -> Vec<usize>,
{
    println!("\nTesting {}...", name);

    let mut best_n = min_n;
    let mut _best_time = Duration::ZERO;
    let mut n = min_n;

    // Find rough upper bound by doubling
    while n <= max_n {
        let grid_size = 40.max((n as f64).sqrt() as usize * 2);
        let points = generate_normalized_points(n, grid_size, 12345);
        let graph = if needs_graph {
            create_distance_matrix(&points)
        } else {
            vec![]
        };

        let (_, time) = measure_time(|| run_fn(&points, &graph, n));

        println!("  n={}: {:.2}ms", n, time.as_secs_f64() * 1000.0);

        if time > timeout {
            break;
        }

        best_n = n;
        _best_time = time;

        // Adjust increment based on time
        if time < timeout / 100 {
            n = n.saturating_mul(2).min(max_n);
        } else if time < timeout / 10 {
            n = ((n as f64 * 1.5).ceil() as usize).min(max_n);
        } else {
            n += 1;
        }

        if n == best_n {
            n += 1;
        }
    }

    // Binary search for exact boundary
    let mut low = best_n;
    let mut high = n.min(max_n);

    while low < high.saturating_sub(1) {
        let mid = (low + high) / 2;
        let grid_size = 40.max((mid as f64).sqrt() as usize * 2);
        let points = generate_normalized_points(mid, grid_size, 12345);
        let graph = if needs_graph {
            create_distance_matrix(&points)
        } else {
            vec![]
        };

        let (_, time) = measure_time(|| run_fn(&points, &graph, mid));
        println!("  n={}: {:.2}ms", mid, time.as_secs_f64() * 1000.0);

        if time <= timeout {
            low = mid;
            _best_time = time;
        } else {
            high = mid;
        }
    }

    best_n = low;

    // Final verification
    let grid_size = 40.max((best_n as f64).sqrt() as usize * 2);
    let points = generate_normalized_points(best_n, grid_size, 12345);
    let graph = if needs_graph {
        create_distance_matrix(&points)
    } else {
        vec![]
    };
    let (_, final_time) = measure_time(|| run_fn(&points, &graph, best_n));

    println!("  RESULT: max n={} in {:.2}ms", best_n, final_time.as_secs_f64() * 1000.0);

    BenchmarkResult {
        name: name.to_string(),
        max_n: best_n,
        time_ms: final_time.as_secs_f64() * 1000.0,
        error: None,
    }
}

fn main() {
    let args: Vec<String> = env::args().collect();
    let timeout_seconds: u64 = args.get(1)
        .and_then(|s| s.parse().ok())
        .unwrap_or(30);

    let timeout = Duration::from_secs(timeout_seconds);

    println!("TSP Algorithms Benchmark (Rust)");
    println!("Finding maximum points for each algorithm within {} seconds timeout\n", timeout_seconds);
    println!("{}", "=".repeat(80));

    let mut results: Vec<BenchmarkResult> = Vec::new();

    // BruteForce (exact) - limit to 12 since it's O(n!) which grows extremely fast
    results.push(find_max_n(
        "BruteForce (bruteForceExact)",
        |_points, graph, n| {
            brute_force::brute_force_exact(graph, n).0
        },
        4,
        12,
        timeout,
        true,
    ));

    // HeldKarp - limit to 20 since it grows exponentially O(2^n * n^2)
    // n=21 takes ~15s, n=22 takes ~45s which is too long for most timeouts
    results.push(find_max_n(
        "BruteForce (heldKarp)",
        |_points, graph, n| {
            brute_force::held_karp(graph, n).0
        },
        4,
        20,
        timeout,
        true,
    ));

    // AngularSort - O(n log n), very fast, doesn't need distance matrix
    results.push(find_max_n(
        "AngularSort",
        |points, _graph, _n| {
            angular_sort::generate_tour(points)
        },
        50_000,
        500_000,
        timeout,
        false,
    ));

    // SonarVisit - O(n), very fast, doesn't need distance matrix
    results.push(find_max_n(
        "SonarVisit",
        |points, _graph, _n| {
            sonar_visit::generate_tour(points, 40)
        },
        50_000,
        500_000,
        timeout,
        false,
    ));

    // NearestNeighbor
    results.push(find_max_n(
        "NearestNeighbor",
        |points, graph, _n| {
            nearest_neighbor::generate_tour(points.len(), graph, 0)
        },
        10,
        10_000,
        timeout,
        true,
    ));

    // GreedyEdge
    results.push(find_max_n(
        "GreedyEdge",
        |points, graph, _n| {
            greedy_edge::generate_tour(points.len(), graph)
        },
        10,
        5_000,
        timeout,
        true,
    ));

    // TwoOpt (with NearestNeighbor)
    results.push(find_max_n(
        "TwoOpt (with NearestNeighbor)",
        |points, graph, _n| {
            let initial = nearest_neighbor::generate_tour(points.len(), graph, 0);
            two_opt::improve(&initial, graph, 100)
        },
        10,
        3_000,
        timeout,
        true,
    ));

    // Zigzag (with AngularSort)
    results.push(find_max_n(
        "Zigzag (with AngularSort)",
        |points, graph, _n| {
            let initial = angular_sort::generate_tour(points);
            zigzag::optimize(&initial, points, graph)
        },
        10,
        5_000,
        timeout,
        true,
    ));

    // SimulatedAnnealing
    results.push(find_max_n(
        "SimulatedAnnealing (with NearestNeighbor, 5000 iterations)",
        |points, graph, _n| {
            let initial = nearest_neighbor::generate_tour(points.len(), graph, 0);
            simulated_annealing::optimize(graph, &initial, 5000, 1.0, 0.9995)
        },
        10,
        5_000,
        timeout,
        true,
    ));

    // GeneticAlgorithm
    results.push(find_max_n(
        "GeneticAlgorithm (pop=50, gen=100)",
        |_points, graph, n| {
            genetic::optimize(graph, n, 50, 100, 0.1)
        },
        10,
        1_000,
        timeout,
        true,
    ));

    // Summary
    println!("\n{}", "=".repeat(80));
    println!("\nSUMMARY (timeout: {}s)", timeout_seconds);
    println!("{}", "=".repeat(80));
    println!("\n{:<52} | {:>5} | {:>10}", "Algorithm", "Max N", "Time (ms)");
    println!("{}", "-".repeat(80));

    results.sort_by(|a, b| b.max_n.cmp(&a.max_n));

    for r in &results {
        println!("{:<52} | {:>5} | {:>10.2}", r.name, r.max_n, r.time_ms);
    }

    println!("\n{}", "=".repeat(80));

    // Output JSON for programmatic use
    println!("\nJSON Results:");
    println!("[");
    for (i, r) in results.iter().enumerate() {
        let comma = if i < results.len() - 1 { "," } else { "" };
        println!(
            "  {{ \"name\": \"{}\", \"maxN\": {}, \"timeMs\": {:.2} }}{}",
            r.name, r.max_n, r.time_ms, comma
        );
    }
    println!("]");
}
