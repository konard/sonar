//! Greedy Edge (Nearest Edge) algorithm for TSP

/// Generate a tour using the Greedy Edge heuristic
/// Builds tour by repeatedly adding the shortest edge that doesn't:
/// - Create a cycle (unless it completes the tour)
/// - Give any vertex degree > 2
/// Time complexity: O(n^2 log n)
pub fn generate_tour(n: usize, graph: &[Vec<f64>]) -> Vec<usize> {
    // Create list of all edges
    let mut edges: Vec<(usize, usize, f64)> = Vec::new();
    for i in 0..n {
        for j in i + 1..n {
            edges.push((i, j, graph[i][j]));
        }
    }

    // Sort edges by distance
    edges.sort_by(|a, b| a.2.partial_cmp(&b.2).unwrap());

    // Track degree of each node
    let mut degree = vec![0; n];

    // Union-Find for cycle detection
    let mut parent: Vec<usize> = (0..n).collect();

    fn find(parent: &mut [usize], x: usize) -> usize {
        if parent[x] != x {
            parent[x] = find(parent, parent[x]);
        }
        parent[x]
    }

    fn union(parent: &mut [usize], x: usize, y: usize) {
        let px = find(parent, x);
        let py = find(parent, y);
        parent[px] = py;
    }

    // Track adjacency for tour reconstruction
    let mut adj: Vec<Vec<usize>> = vec![Vec::new(); n];
    let mut edge_count = 0;

    for (from, to, _dist) in edges {
        if edge_count >= n {
            break;
        }

        // Check if adding this edge would violate degree constraint
        if degree[from] >= 2 || degree[to] >= 2 {
            continue;
        }

        // Check if it would create a premature cycle
        if edge_count < n - 1 && find(&mut parent, from) == find(&mut parent, to) {
            continue;
        }

        // Add edge
        adj[from].push(to);
        adj[to].push(from);
        degree[from] += 1;
        degree[to] += 1;
        union(&mut parent, from, to);
        edge_count += 1;
    }

    // Reconstruct tour from adjacency list
    let mut tour = Vec::with_capacity(n);
    let mut visited = vec![false; n];
    let mut current = 0;

    while tour.len() < n {
        tour.push(current);
        visited[current] = true;

        let mut next = None;
        for &neighbor in &adj[current] {
            if !visited[neighbor] {
                next = Some(neighbor);
                break;
            }
        }

        match next {
            Some(n) => current = n,
            None => break,
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
    fn test_greedy_edge_visits_all() {
        let points = vec![
            Point { x: 0.0, y: 0.0, angle: PI, id: 0 },
            Point { x: 1.0, y: 0.0, angle: 0.0, id: 1 },
            Point { x: 1.0, y: 1.0, angle: PI / 4.0, id: 2 },
            Point { x: 0.0, y: 1.0, angle: PI / 2.0, id: 3 },
        ];
        let graph = create_distance_matrix(&points);

        let tour = generate_tour(points.len(), &graph);

        assert_eq!(tour.len(), points.len());

        // Check no duplicates
        let mut seen = std::collections::HashSet::new();
        for &id in &tour {
            assert!(seen.insert(id));
        }
    }
}
