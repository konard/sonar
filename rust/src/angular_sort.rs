//! Angular Sort algorithm - O(n log n) sorting-based approach

use crate::utils::Point;

/// Generate a tour by sorting points by their angle from center
/// Points are connected sequentially after sorting
/// Time complexity: O(n log n) dominated by the sort
pub fn generate_tour(points: &[Point]) -> Vec<usize> {
    let mut sorted_points: Vec<&Point> = points.iter().collect();
    sorted_points.sort_by(|a, b| a.angle.partial_cmp(&b.angle).unwrap());
    sorted_points.iter().map(|p| p.id).collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::f64::consts::PI;

    #[test]
    fn test_angular_sort_visits_all() {
        let points = vec![
            Point { x: 0.0, y: 0.0, angle: PI, id: 0 },
            Point { x: 1.0, y: 0.0, angle: 0.0, id: 1 },
            Point { x: 1.0, y: 1.0, angle: PI / 4.0, id: 2 },
            Point { x: 0.0, y: 1.0, angle: PI / 2.0, id: 3 },
        ];

        let tour = generate_tour(&points);

        assert_eq!(tour.len(), points.len());

        // Check no duplicates
        let mut seen = std::collections::HashSet::new();
        for &id in &tour {
            assert!(seen.insert(id));
        }
    }
}
