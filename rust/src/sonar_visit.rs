//! Sonar Visit algorithm - O(1) angle sweep approach

use std::collections::BTreeMap;
use crate::utils::Point;
use std::f64::consts::PI;

/// Generate a tour using the Sonar Visit algorithm
/// 360 degree rotation sweep in fixed angle steps
/// Points on the same angle are connected by distance from center
/// Time complexity: O(1) angle steps (determined by grid size, not point count)
pub fn generate_tour(points: &[Point], grid_size: usize) -> Vec<usize> {
    // Calculate angle step based on grid size
    let angle_steps = 4 * grid_size;
    let angle_step = (2.0 * PI) / angle_steps as f64;

    // Group points by their angle bucket
    let mut angle_buckets: BTreeMap<usize, Vec<&Point>> = BTreeMap::new();

    for point in points {
        let mut angle = point.angle;
        if angle < 0.0 {
            angle += 2.0 * PI;
        }

        let bucket_index = (angle / angle_step) as usize;
        angle_buckets.entry(bucket_index).or_default().push(point);
    }

    // Sort points within each bucket by distance from center
    let center_x = 0.5;
    let center_y = 0.5;

    for bucket_points in angle_buckets.values_mut() {
        bucket_points.sort_by(|a, b| {
            let dist_a = ((a.x - center_x).powi(2) + (a.y - center_y).powi(2)).sqrt();
            let dist_b = ((b.x - center_x).powi(2) + (b.y - center_y).powi(2)).sqrt();
            dist_a.partial_cmp(&dist_b).unwrap()
        });
    }

    // Build tour by sweeping through angle buckets in order
    let mut tour = Vec::with_capacity(points.len());
    for i in 0..angle_steps {
        if let Some(bucket_points) = angle_buckets.get(&i) {
            for p in bucket_points {
                tour.push(p.id);
            }
        }
    }

    tour
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::utils::generate_normalized_points;

    #[test]
    fn test_sonar_visit_visits_all() {
        let points = generate_normalized_points(10, 20, 42);
        let tour = generate_tour(&points, 20);

        assert_eq!(tour.len(), points.len());

        // Check no duplicates
        let mut seen = std::collections::HashSet::new();
        for &id in &tour {
            assert!(seen.insert(id));
        }
    }
}
