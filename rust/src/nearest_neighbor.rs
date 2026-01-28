//! Nearest Neighbor (Greedy) algorithm for TSP

/// Generate a tour using the Nearest Neighbor heuristic
/// Start from a point and always visit the closest unvisited point
/// Time complexity: O(n^2)
pub fn generate_tour(n: usize, graph: &[Vec<f64>], start_city: usize) -> Vec<usize> {
    let mut visited = vec![false; n];
    let mut tour = Vec::with_capacity(n);

    let mut current = start_city;
    tour.push(current);
    visited[current] = true;

    while tour.len() < n {
        let mut nearest = None;
        let mut nearest_dist = f64::INFINITY;

        for i in 0..n {
            if !visited[i] && graph[current][i] < nearest_dist {
                nearest = Some(i);
                nearest_dist = graph[current][i];
            }
        }

        if let Some(next) = nearest {
            tour.push(next);
            visited[next] = true;
            current = next;
        }
    }

    tour
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::utils::{create_distance_matrix, Point};
    use std::f64::consts::PI;

    #[test]
    fn test_nearest_neighbor_visits_all() {
        let points = vec![
            Point { x: 0.0, y: 0.0, angle: PI, id: 0 },
            Point { x: 1.0, y: 0.0, angle: 0.0, id: 1 },
            Point { x: 1.0, y: 1.0, angle: PI / 4.0, id: 2 },
            Point { x: 0.0, y: 1.0, angle: PI / 2.0, id: 3 },
        ];
        let graph = create_distance_matrix(&points);

        let tour = generate_tour(points.len(), &graph, 0);

        assert_eq!(tour.len(), points.len());
        assert_eq!(tour[0], 0); // Should start from city 0

        // Check no duplicates
        let mut seen = std::collections::HashSet::new();
        for &id in &tour {
            assert!(seen.insert(id));
        }
    }
}
