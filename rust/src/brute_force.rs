//! Brute Force and Held-Karp exact algorithms for TSP

use crate::utils::calculate_tour_length;
use std::collections::HashMap;

/// Find optimal TSP tour using exhaustive permutation search
/// Time complexity: O(n!)
/// Only practical for n <= 10
pub fn brute_force_exact(graph: &[Vec<f64>], n: usize) -> (Vec<usize>, f64) {
    let mut cities: Vec<usize> = (0..n).collect();
    let mut best_tour = cities.clone();
    let mut best_length = calculate_tour_length(&best_tour, graph);

    // Generate all permutations starting from city 0 (fix first city to reduce search space)
    fn permute(
        arr: &mut Vec<usize>,
        start: usize,
        graph: &[Vec<f64>],
        best_tour: &mut Vec<usize>,
        best_length: &mut f64,
    ) {
        if start == arr.len() - 1 {
            let length = calculate_tour_length(arr, graph);
            if length < *best_length {
                *best_length = length;
                *best_tour = arr.clone();
            }
            return;
        }

        for i in start..arr.len() {
            arr.swap(start, i);
            permute(arr, start + 1, graph, best_tour, best_length);
            arr.swap(start, i);
        }
    }

    // Fix first city to reduce permutations from n! to (n-1)!
    permute(&mut cities, 1, graph, &mut best_tour, &mut best_length);

    (best_tour, best_length)
}

/// Find optimal TSP tour using Held-Karp dynamic programming
/// Time complexity: O(2^n * n^2)
/// Practical for n <= 20
pub fn held_karp(graph: &[Vec<f64>], n: usize) -> (Vec<usize>, f64) {
    // dp[mask][i] = minimum distance to reach city i, having visited cities in mask
    // mask is a bitmask where bit j is set if city j has been visited
    let mut dp: HashMap<(usize, usize), f64> = HashMap::new();
    let mut parent: HashMap<(usize, usize), usize> = HashMap::new();

    // Base case: start from city 0, visit each other city directly
    for i in 1..n {
        let mask = 1 << i;
        dp.insert((mask, i), graph[0][i]);
        parent.insert((mask, i), 0);
    }

    // Fill DP table for increasing subset sizes
    for size in 2..n {
        // Generate all subsets of given size from cities 1 to n-1
        let subsets = generate_subsets(n, size);

        for mask in subsets {
            for last in 1..n {
                // Skip if last city is not in the current subset
                if (mask & (1 << last)) == 0 {
                    continue;
                }

                let prev_mask = mask ^ (1 << last);
                if prev_mask == 0 {
                    continue;
                }

                let mut best_dist = f64::INFINITY;
                let mut best_prev = 0;

                // Try all possible previous cities
                for prev in 1..n {
                    if (prev_mask & (1 << prev)) == 0 {
                        continue;
                    }

                    if let Some(&dist) = dp.get(&(prev_mask, prev)) {
                        let new_dist = dist + graph[prev][last];
                        if new_dist < best_dist {
                            best_dist = new_dist;
                            best_prev = prev;
                        }
                    }
                }

                if best_dist < f64::INFINITY {
                    dp.insert((mask, last), best_dist);
                    parent.insert((mask, last), best_prev);
                }
            }
        }
    }

    // Find the minimum tour by trying all last cities and returning to 0
    let full_mask = ((1 << n) - 1) ^ 1; // All cities except 0 (bits 1 to n-1)
    let mut min_length = f64::INFINITY;
    let mut last_city = 0;

    for i in 1..n {
        if let Some(&dist) = dp.get(&(full_mask, i)) {
            let total_dist = dist + graph[i][0];
            if total_dist < min_length {
                min_length = total_dist;
                last_city = i;
            }
        }
    }

    // Reconstruct the tour
    let mut tour = vec![0];
    let mut current_mask = full_mask;
    let mut current = last_city;

    while current != 0 {
        tour.push(current);
        if let Some(&prev) = parent.get(&(current_mask, current)) {
            current_mask ^= 1 << current;
            current = prev;
        } else {
            break;
        }
    }

    (tour, min_length)
}

/// Generate all subsets of a given size from cities 1 to n-1
fn generate_subsets(n: usize, size: usize) -> Vec<usize> {
    let mut subsets = Vec::new();

    fn gen(start: usize, current: usize, count: usize, size: usize, n: usize, subsets: &mut Vec<usize>) {
        if count == size {
            subsets.push(current);
            return;
        }
        for i in start..n {
            gen(i + 1, current | (1 << i), count + 1, size, n, subsets);
        }
    }

    gen(1, 0, 0, size, n, &mut subsets);
    subsets
}

/// Find optimal TSP solution using the best available method for the given size
/// - n <= 10: Use brute force O(n!)
/// - n <= 20: Use Held-Karp O(2^n * n^2)
/// - n > 20: Returns None (exact solution infeasible)
pub fn find_optimal(graph: &[Vec<f64>], n: usize) -> Option<(Vec<usize>, f64)> {
    if n > 20 {
        return None;
    }

    if n <= 10 {
        Some(brute_force_exact(graph, n))
    } else {
        Some(held_karp(graph, n))
    }
}

/// Get maximum number of cities for which exact solution is feasible
pub fn get_max_feasible_n() -> usize {
    20
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::utils::{create_distance_matrix, Point};
    use std::f64::consts::PI;

    #[test]
    fn test_brute_force_finds_optimal() {
        let points = vec![
            Point { x: 0.0, y: 0.0, angle: PI, id: 0 },
            Point { x: 1.0, y: 0.0, angle: 0.0, id: 1 },
            Point { x: 1.0, y: 1.0, angle: PI / 4.0, id: 2 },
            Point { x: 0.0, y: 1.0, angle: PI / 2.0, id: 3 },
        ];
        let graph = create_distance_matrix(&points);
        let (tour, length) = brute_force_exact(&graph, 4);

        // Square perimeter should be 4
        assert!((length - 4.0).abs() < 0.0001);
        assert_eq!(tour.len(), 4);
    }

    #[test]
    fn test_held_karp_finds_optimal() {
        let points = vec![
            Point { x: 0.0, y: 0.0, angle: PI, id: 0 },
            Point { x: 1.0, y: 0.0, angle: 0.0, id: 1 },
            Point { x: 1.0, y: 1.0, angle: PI / 4.0, id: 2 },
            Point { x: 0.0, y: 1.0, angle: PI / 2.0, id: 3 },
        ];
        let graph = create_distance_matrix(&points);
        let (tour, length) = held_karp(&graph, 4);

        // Square perimeter should be 4
        assert!((length - 4.0).abs() < 0.0001);
        assert_eq!(tour.len(), 4);
    }
}
