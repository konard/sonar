//! Shared utilities for TSP algorithms

use std::f64::consts::PI;

/// A point with x, y coordinates, angle from center, and id
#[derive(Debug, Clone)]
pub struct Point {
    pub x: f64,
    pub y: f64,
    pub angle: f64,
    pub id: usize,
}

/// Calculate Euclidean distance between two points
pub fn distance(start: &Point, end: &Point) -> f64 {
    let dx = end.x - start.x;
    let dy = end.y - start.y;
    (dx * dx + dy * dy).sqrt()
}

/// Calculate distance between two points given coordinates
pub fn distance_coords(x1: f64, y1: f64, x2: f64, y2: f64) -> f64 {
    let dx = x2 - x1;
    let dy = y2 - y1;
    (dx * dx + dy * dy).sqrt()
}

/// Create a distance matrix from an array of points
pub fn create_distance_matrix(points: &[Point]) -> Vec<Vec<f64>> {
    let n = points.len();
    let mut graph = vec![vec![0.0; n]; n];
    for i in 0..n {
        for j in 0..n {
            if i != j {
                graph[i][j] = distance(&points[i], &points[j]);
            }
        }
    }
    graph
}

/// Calculate the total length of a tour
pub fn calculate_tour_length(tour: &[usize], graph: &[Vec<f64>]) -> f64 {
    let n = tour.len();
    let mut total_distance = 0.0;
    for i in 0..n {
        total_distance += graph[tour[i]][tour[(i + 1) % n]];
    }
    total_distance
}

/// Calculate the Minimum Spanning Tree weight using Prim's algorithm
/// Used as a lower bound for TSP
pub fn calculate_mst(graph: &[Vec<f64>]) -> f64 {
    let n = graph.len();
    let mut selected = vec![false; n];
    selected[0] = true;
    let mut edge_count = 0;
    let mut mst_weight = 0.0;

    while edge_count < n - 1 {
        let mut min = f64::INFINITY;
        let mut y = 0;

        for i in 0..n {
            if selected[i] {
                for j in 0..n {
                    if !selected[j] && graph[i][j] > 0.0 && graph[i][j] < min {
                        min = graph[i][j];
                        y = j;
                    }
                }
            }
        }

        mst_weight += min;
        selected[y] = true;
        edge_count += 1;
    }

    mst_weight
}

/// Calculate efficiency as (optimal_length / solution_length) * 100
pub fn calculate_efficiency(solution_length: f64, optimal_length: f64) -> f64 {
    if solution_length <= 0.0 {
        return 0.0;
    }
    (optimal_length / solution_length) * 100.0
}

/// Simple LCG random number generator for reproducibility
pub struct Lcg {
    seed: u64,
}

impl Lcg {
    pub fn new(seed: u64) -> Self {
        Lcg { seed }
    }

    pub fn next(&mut self) -> f64 {
        self.seed = (self.seed.wrapping_mul(1103515245).wrapping_add(12345)) % (1 << 31);
        self.seed as f64 / (1u64 << 31) as f64
    }
}

/// Generate random points on a normalized grid (0-1 range)
pub fn generate_normalized_points(num_points: usize, grid_size: usize, seed: u64) -> Vec<Point> {
    let mut rng = Lcg::new(seed);
    let center = 0.5;
    let max_radius = 0.45;
    let grid_step = 1.0 / grid_size as f64;

    // Generate all valid grid positions within the circular area
    let mut valid_positions: Vec<(f64, f64, f64)> = Vec::new();

    for gx in 0..grid_size {
        for gy in 0..grid_size {
            let x = (gx as f64 + 0.5) * grid_step;
            let y = (gy as f64 + 0.5) * grid_step;
            let dx = x - center;
            let dy = y - center;
            let dist_from_center = (dx * dx + dy * dy).sqrt();

            if dist_from_center <= max_radius {
                let mut angle = dy.atan2(dx);
                if angle < 0.0 {
                    angle += 2.0 * PI;
                }
                valid_positions.push((x, y, angle));
            }
        }
    }

    // Fisher-Yates shuffle
    let n = valid_positions.len();
    for i in (1..n).rev() {
        let j = (rng.next() * (i + 1) as f64) as usize;
        valid_positions.swap(i, j);
    }

    // Select num_points from shuffled positions
    let count = num_points.min(valid_positions.len());
    valid_positions
        .into_iter()
        .take(count)
        .enumerate()
        .map(|(idx, (x, y, angle))| Point { x, y, angle, id: idx })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_distance() {
        let p1 = Point { x: 0.0, y: 0.0, angle: 0.0, id: 0 };
        let p2 = Point { x: 3.0, y: 4.0, angle: 0.0, id: 1 };
        assert!((distance(&p1, &p2) - 5.0).abs() < 0.0001);
    }

    #[test]
    fn test_tour_length() {
        let points = vec![
            Point { x: 0.0, y: 0.0, angle: PI, id: 0 },
            Point { x: 1.0, y: 0.0, angle: 0.0, id: 1 },
            Point { x: 1.0, y: 1.0, angle: PI / 4.0, id: 2 },
            Point { x: 0.0, y: 1.0, angle: PI / 2.0, id: 3 },
        ];
        let graph = create_distance_matrix(&points);
        let tour = vec![0, 1, 2, 3];
        let length = calculate_tour_length(&tour, &graph);
        assert!((length - 4.0).abs() < 0.0001);
    }
}
