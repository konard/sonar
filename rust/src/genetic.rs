//! Genetic Algorithm for TSP

use crate::utils::calculate_tour_length;
use rand::Rng;
use std::collections::HashSet;

/// Create a random tour permutation using Fisher-Yates shuffle
fn random_tour(n: usize, rng: &mut impl Rng) -> Vec<usize> {
    let mut tour: Vec<usize> = (0..n).collect();
    for i in (1..n).rev() {
        let j = rng.gen_range(0..=i);
        tour.swap(i, j);
    }
    tour
}

/// Order Crossover (OX) operator
fn crossover(parent1: &[usize], parent2: &[usize], rng: &mut impl Rng) -> Vec<usize> {
    let n = parent1.len();
    let start = rng.gen_range(0..n);
    let end = start + rng.gen_range(0..n - start);

    let mut child = vec![usize::MAX; n];
    let mut used: HashSet<usize> = HashSet::new();

    // Copy segment from parent1
    for i in start..=end {
        child[i] = parent1[i];
        used.insert(parent1[i]);
    }

    // Fill rest from parent2 in order
    let mut idx = (end + 1) % n;
    for i in 0..n {
        let city = parent2[(end + 1 + i) % n];
        if !used.contains(&city) {
            child[idx] = city;
            idx = (idx + 1) % n;
        }
    }

    child
}

/// Mutation by swapping two random cities
fn mutate(tour: &[usize], rng: &mut impl Rng) -> Vec<usize> {
    let mut new_tour = tour.to_vec();
    let n = tour.len();
    let i = rng.gen_range(0..n);
    let j = rng.gen_range(0..n);
    new_tour.swap(i, j);
    new_tour
}

/// Optimize TSP using a Genetic Algorithm
/// Evolutionary approach using selection, crossover, and mutation
/// Time complexity: O(populationSize * generations * n)
pub fn optimize(
    graph: &[Vec<f64>],
    n: usize,
    population_size: usize,
    generations: usize,
    mutation_rate: f64,
) -> Vec<usize> {
    let mut rng = rand::thread_rng();

    // Initialize population
    let mut population: Vec<Vec<usize>> = (0..population_size)
        .map(|_| random_tour(n, &mut rng))
        .collect();

    for _ in 0..generations {
        // Calculate fitness (inverse of tour length)
        let fitnesses: Vec<f64> = population
            .iter()
            .map(|tour| 1.0 / calculate_tour_length(tour, graph))
            .collect();
        let total_fitness: f64 = fitnesses.iter().sum();

        // Roulette wheel selection
        let select = |rng: &mut rand::rngs::ThreadRng| -> &Vec<usize> {
            let mut r = rng.gen::<f64>() * total_fitness;
            for (i, &fitness) in fitnesses.iter().enumerate() {
                r -= fitness;
                if r <= 0.0 {
                    return &population[i];
                }
            }
            &population[population_size - 1]
        };

        // Create new population
        let mut new_population: Vec<Vec<usize>> = Vec::with_capacity(population_size);

        // Elitism: keep the best individual
        let best_idx = fitnesses
            .iter()
            .enumerate()
            .max_by(|(_, a), (_, b)| a.partial_cmp(b).unwrap())
            .map(|(i, _)| i)
            .unwrap_or(0);
        new_population.push(population[best_idx].clone());

        // Generate rest of population through selection and crossover
        while new_population.len() < population_size {
            let parent1 = select(&mut rng);
            let parent2 = select(&mut rng);
            let mut child = crossover(parent1, parent2, &mut rng);

            // Apply mutation with given probability
            if rng.gen::<f64>() < mutation_rate {
                child = mutate(&child, &mut rng);
            }

            new_population.push(child);
        }

        population = new_population;
    }

    // Return the best tour from final population
    let mut best_tour = population[0].clone();
    let mut best_length = calculate_tour_length(&best_tour, graph);

    for tour in &population {
        let length = calculate_tour_length(tour, graph);
        if length < best_length {
            best_tour = tour.clone();
            best_length = length;
        }
    }

    best_tour
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::utils::{create_distance_matrix, Point};
    use std::f64::consts::PI;

    #[test]
    fn test_genetic_algorithm_visits_all() {
        let points = vec![
            Point { x: 0.0, y: 0.0, angle: PI, id: 0 },
            Point { x: 1.0, y: 0.0, angle: 0.0, id: 1 },
            Point { x: 1.0, y: 1.0, angle: PI / 4.0, id: 2 },
            Point { x: 0.0, y: 1.0, angle: PI / 2.0, id: 3 },
        ];
        let graph = create_distance_matrix(&points);
        let tour = optimize(&graph, 4, 50, 100, 0.1);

        assert_eq!(tour.len(), points.len());

        // Check no duplicates
        let mut seen = std::collections::HashSet::new();
        for &id in &tour {
            assert!(seen.insert(id));
        }
    }
}
