//! Zigzag local optimization algorithm

use crate::utils::Point;

/// Calculate distance between two points
fn distance(p1: &Point, p2: &Point) -> f64 {
    let dx = p2.x - p1.x;
    let dy = p2.y - p1.y;
    (dx * dx + dy * dy).sqrt()
}

/// Check if zigzag swap improves the tour at position i
fn should_zigzag(i: usize, pts: &[Point]) -> bool {
    let n = pts.len();
    let p1 = &pts[(i + n - 1) % n];
    let p2 = &pts[i % n];
    let p3 = &pts[(i + 1) % n];
    let p4 = &pts[(i + 2) % n];

    let segment1 = distance(p1, p2);
    let segment3 = distance(p3, p4);
    let zigzag_segment1 = distance(p1, p3);
    let zigzag_segment3 = distance(p2, p4);

    (zigzag_segment1 + zigzag_segment3) < (segment1 + segment3)
}

/// Apply zigzag optimization on a tour
/// Checks if swapping adjacent point pairs reduces path length
/// Time complexity: O(n)
pub fn optimize(tour_indices: &[usize], points: &[Point], _graph: &[Vec<f64>]) -> Vec<usize> {
    // Convert tour indices to points in tour order
    let tour_points: Vec<Point> = tour_indices
        .iter()
        .map(|&idx| {
            let mut p = points[idx].clone();
            p.id = idx; // Store original id
            p
        })
        .collect();

    let mut new_tour: Vec<usize> = Vec::with_capacity(tour_points.len());
    let mut i = 1;

    while i < tour_points.len() {
        if tour_points.len() - i > 2 && should_zigzag(i, &tour_points) {
            new_tour.push(tour_points[i - 1].id);
            new_tour.push(tour_points[(i + 1) % tour_points.len()].id);
            new_tour.push(tour_points[i % tour_points.len()].id);
            new_tour.push(tour_points[(i + 2) % tour_points.len()].id);
            i += 3;
        } else {
            new_tour.push(tour_points[i - 1].id);
            new_tour.push(tour_points[i % tour_points.len()].id);
            i += 1;
        }
    }

    // Remove duplicates while preserving order
    let mut seen = std::collections::HashSet::new();
    new_tour
        .into_iter()
        .filter(|&id| seen.insert(id))
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::utils::{create_distance_matrix, calculate_tour_length};
    use crate::angular_sort;
    use std::f64::consts::PI;

    #[test]
    fn test_zigzag_no_worse() {
        let points = vec![
            Point { x: 0.0, y: 0.0, angle: PI, id: 0 },
            Point { x: 1.0, y: 0.0, angle: 0.0, id: 1 },
            Point { x: 1.0, y: 1.0, angle: PI / 4.0, id: 2 },
            Point { x: 0.0, y: 1.0, angle: PI / 2.0, id: 3 },
        ];
        let graph = create_distance_matrix(&points);
        let angular_tour = angular_sort::generate_tour(&points);
        let zigzag_tour = optimize(&angular_tour, &points, &graph);

        let angular_length = calculate_tour_length(&angular_tour, &graph);
        let zigzag_length = calculate_tour_length(&zigzag_tour, &graph);

        assert!(zigzag_length <= angular_length + 0.0001);
    }
}
