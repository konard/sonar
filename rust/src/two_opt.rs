//! 2-Opt local search improvement algorithm

/// Apply 2-opt improvement to a tour
/// Iteratively swaps edge pairs to reduce tour length
/// Time complexity: O(n^2) per iteration
pub fn improve(tour: &[usize], graph: &[Vec<f64>], max_iterations: usize) -> Vec<usize> {
    let n = tour.len();
    let mut improved = true;
    let mut iterations = 0;
    let mut current_tour = tour.to_vec();

    while improved && iterations < max_iterations {
        improved = false;
        iterations += 1;

        for i in 0..n - 1 {
            for j in i + 2..n {
                // Don't swap if it would break the cycle
                if j == n - 1 && i == 0 {
                    continue;
                }

                let current_distance = graph[current_tour[i]][current_tour[i + 1]]
                    + graph[current_tour[j]][current_tour[(j + 1) % n]];
                let new_distance = graph[current_tour[i]][current_tour[j]]
                    + graph[current_tour[i + 1]][current_tour[(j + 1) % n]];

                if new_distance < current_distance {
                    // Reverse the segment between i+1 and j
                    current_tour[i + 1..=j].reverse();
                    improved = true;
                }
            }
        }
    }

    current_tour
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::utils::{create_distance_matrix, calculate_tour_length, Point};
    use std::f64::consts::PI;

    #[test]
    fn test_two_opt_improves_tour() {
        let points = vec![
            Point { x: 0.0, y: 0.0, angle: PI, id: 0 },
            Point { x: 1.0, y: 0.0, angle: 0.0, id: 1 },
            Point { x: 1.0, y: 1.0, angle: PI / 4.0, id: 2 },
            Point { x: 0.0, y: 1.0, angle: PI / 2.0, id: 3 },
        ];
        let graph = create_distance_matrix(&points);

        // Suboptimal tour with crossing edges
        let suboptimal = vec![0, 2, 1, 3];
        let improved = improve(&suboptimal, &graph, 100);

        let original_length = calculate_tour_length(&suboptimal, &graph);
        let improved_length = calculate_tour_length(&improved, &graph);

        assert!(improved_length <= original_length);
    }
}
