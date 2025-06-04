# Compares the silhouette scores of Spectral Clustering and K-means clustering algorithms
# find the optimal number of clusters for the given dataset.
# It also performs DBSCAN clustering and asks the user to input the epsilon value based on the k-distance graph.

import os
os.environ["LOKY_MAX_CPU_COUNT"] = "4" 

import json
import numpy as np
import matplotlib.pyplot as plt
from sklearn.cluster import SpectralClustering, KMeans, DBSCAN
from sklearn.metrics import silhouette_score
from sklearn.neighbors import NearestNeighbors

def load_data(filename):
    with open(filename) as f:
        data = json.load(f)
    return np.array([[item["x"], item["y"]] for item in data])

def plot_silhouette_scores(range_n_clusters, silhouette_scores, title):
    plt.figure(figsize=(10, 6))
    plt.plot(range_n_clusters, silhouette_scores, marker='o')
    plt.title(title)
    plt.xlabel('Number of clusters')
    plt.ylabel('Silhouette Score')
    plt.show()

def find_optimal_clusters(data, cluster_range, clustering_method):
    silhouette_scores = []
    for n_clusters in cluster_range:
        if clustering_method == "spectral":
            clusterer = SpectralClustering(n_clusters=n_clusters, affinity='nearest_neighbors', assign_labels='kmeans', n_jobs=-1)
        elif clustering_method == "kmeans":
            clusterer = KMeans(n_clusters=n_clusters, n_init=10)
        
        labels = clusterer.fit_predict(data)
        score = silhouette_score(data, labels)
        silhouette_scores.append(score)
    
    optimal_n_clusters = cluster_range[np.argmax(silhouette_scores)]
    return optimal_n_clusters, silhouette_scores

def dbscan_clustering(data):
    # Compute the optimal epsilon using nearest neighbors
    neighbors = NearestNeighbors(n_neighbors=2)
    nbrs = neighbors.fit(data)
    distances, indices = nbrs.kneighbors(data)
    distances = np.sort(distances, axis=0)
    distances = distances[:,1]
    
    # Plot k-distance graph
    plt.figure(figsize=(10, 6))
    plt.plot(distances)
    plt.title('K-distance Graph')
    plt.xlabel('Points sorted by distance')
    plt.ylabel('k-nearest neighbor distance')
    plt.show()
    
    # Ask user for epsilon value
    epsilon = float(input("Based on the k-distance graph, enter the epsilon value for DBSCAN: "))
    
    # Perform DBSCAN clustering
    dbscan = DBSCAN(eps=epsilon, min_samples=5)
    labels = dbscan.fit_predict(data)
    
    n_clusters = len(set(labels)) - (1 if -1 in labels else 0)
    print(f"Number of clusters found by DBSCAN: {n_clusters}")
    
    return labels

def main():
    data = load_data('data.json')
    
    # Try Spectral Clustering
    range_n_clusters = range(2, 50)  # Adjusted range
    optimal_n_spectral, silhouette_scores_spectral = find_optimal_clusters(data, range_n_clusters, "spectral")
    plot_silhouette_scores(range_n_clusters, silhouette_scores_spectral, 'Silhouette Scores for Spectral Clustering')
    print(f"The optimal number of clusters for Spectral Clustering is {optimal_n_spectral}")

    # Try K-means
    optimal_n_kmeans, silhouette_scores_kmeans = find_optimal_clusters(data, range_n_clusters, "kmeans")
    plot_silhouette_scores(range_n_clusters, silhouette_scores_kmeans, 'Silhouette Scores for K-means')
    print(f"The optimal number of clusters for K-means is {optimal_n_kmeans}")

    # Try DBSCAN
    dbscan_labels = dbscan_clustering(data)

if __name__ == "__main__":
    main()