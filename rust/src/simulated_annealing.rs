//! Simulated Annealing algorithm for TSP

use crate::utils::calculate_tour_length;
use rand::Rng;

/// Optimize a tour using Simulated Annealing
/// Metaheuristic that accepts worse solutions with decreasing probability
/// to escape local minima
/// Time complexity: O(n * iterations)
pub fn optimize(
    graph: &[Vec<f64>],
    initial_tour: &[usize],
    max_iterations: usize,
    initial_temperature: f64,
    cooling_rate: f64,
) -> Vec<usize> {
    let mut rng = rand::thread_rng();
    let n = initial_tour.len();

    let mut current_tour = initial_tour.to_vec();
    let mut current_length = calculate_tour_length(&current_tour, graph);
    let mut best_tour = current_tour.clone();
    let mut best_length = current_length;

    let mut temperature = initial_temperature;

    for _ in 0..max_iterations {
        // Generate neighbor by 2-opt swap
        let i = rng.gen_range(0..n - 1);
        let mut j = rng.gen_range(0..n - 1);
        if j >= i {
            j += 1;
        }

        let (min_idx, max_idx) = if i < j { (i, j) } else { (j, i) };

        // Calculate delta
        let prev = (min_idx + n - 1) % n;
        let next_max = (max_idx + 1) % n;

        let old_dist = graph[current_tour[prev]][current_tour[min_idx]]
            + graph[current_tour[max_idx]][current_tour[next_max]];
        let new_dist = graph[current_tour[prev]][current_tour[max_idx]]
            + graph[current_tour[min_idx]][current_tour[next_max]];

        let delta = new_dist - old_dist;

        // Accept or reject based on Metropolis criterion
        if delta < 0.0 || rng.gen::<f64>() < (-delta / temperature).exp() {
            // Reverse the segment
            current_tour[min_idx..=max_idx].reverse();
            current_length = calculate_tour_length(&current_tour, graph);

            if current_length < best_length {
                best_tour = current_tour.clone();
                best_length = current_length;
            }
        }

        temperature *= cooling_rate;
    }

    best_tour
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::utils::{create_distance_matrix, Point};
    use crate::nearest_neighbor;
    use std::f64::consts::PI;

    #[test]
    fn test_simulated_annealing_visits_all() {
        let points = vec![
            Point { x: 0.0, y: 0.0, angle: PI, id: 0 },
            Point { x: 1.0, y: 0.0, angle: 0.0, id: 1 },
            Point { x: 1.0, y: 1.0, angle: PI / 4.0, id: 2 },
            Point { x: 0.0, y: 1.0, angle: PI / 2.0, id: 3 },
        ];
        let graph = create_distance_matrix(&points);
        let initial = nearest_neighbor::generate_tour(points.len(), &graph, 0);
        let tour = optimize(&graph, &initial, 5000, 1.0, 0.9995);

        assert_eq!(tour.len(), points.len());

        // Check no duplicates
        let mut seen = std::collections::HashSet::new();
        for &id in &tour {
            assert!(seen.insert(id));
        }
    }
}
