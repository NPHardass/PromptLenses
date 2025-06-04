# Generate the spectral clustering and the silhouette scores for the spectral clustering
# save the data to a new JSON file

import os
os.environ["LOKY_MAX_CPU_COUNT"] = "4"  # Set this to the number of cores you want to use

import json
import numpy as np
import matplotlib.pyplot as plt
from sklearn.cluster import SpectralClustering
from sklearn.metrics import silhouette_score

with open('data_new.json') as f:
    json_data = f.read()

# Parse JSON data
data = json.loads(json_data)

# Extract "x" and "y" values and save them in a list of lists
coordinates_array = [[item["x"], item["y"]] for item in data]

data_np=np.array(coordinates_array)


# Determine the optimal number of clusters using the silhouette score
silhouette_scores = []
range_n_clusters = range(5, 200)  # Adjust the range based on your data

for n_clusters in range_n_clusters:
    spectral = SpectralClustering(n_clusters=n_clusters, affinity='nearest_neighbors', assign_labels='kmeans')
    labels = spectral.fit_predict(data_np)
    score = silhouette_score(data_np, labels)
    silhouette_scores.append(score)

# Find the number of clusters with the highest silhouette score
optimal_n_clusters = range_n_clusters[np.argmax(silhouette_scores)]

# Plot the silhouette scores
plt.plot(range_n_clusters, silhouette_scores, marker='o')
plt.title('Silhouette Scores for Spectral Clustering')
plt.xlabel('Number of clusters')
plt.ylabel('Silhouette Score')
plt.show()

print(f"The optimal number of clusters is {optimal_n_clusters}")

spectral = SpectralClustering(n_clusters=optimal_n_clusters, assign_labels='kmeans')
labels = spectral.fit_predict(data_np)


# Add cluster labels to the original JSON data
for i, item in enumerate(data):
    item["cluster"] = int(labels[i])

# Save the updated data to a new JSON file
with open('data_spectral-clustering.json', 'w') as f:
    json.dump(data, f, indent=4)


# Visualize the clustered data
plt.scatter(data_np[:, 0], data_np[:, 1], c=labels, cmap='viridis')
plt.title(f'Spectral Clustering with {number_of_clusters} Clusters')
plt.xlabel('X')
plt.ylabel('Y')
plt.show()
