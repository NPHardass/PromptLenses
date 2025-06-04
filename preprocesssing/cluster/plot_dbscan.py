# Plot DBSCAN clustering

from sklearn.preprocessing import StandardScaler
import json
import numpy as np

with open('data_new.json') as f:
    json_data = f.read()

# Parse JSON data
data = json.loads(json_data)

# Extract "x" and "y" values and save them in a list of lists
coordinates = [[item["x"], item["y"]] for item in data]

# Convert the list of lists to a NumPy array
X = np.array(coordinates)

import numpy as np
import matplotlib.pyplot as plt
from sklearn.neighbors import NearestNeighbors
from sklearn import metrics
from sklearn.cluster import DBSCAN

db = DBSCAN(eps=0.125, min_samples=5).fit(X)
labels = db.labels_

# Number of clusters in labels, ignoring noise if present.
n_clusters_ = len(set(labels)) - (1 if -1 in labels else 0)
n_noise_ = list(labels).count(-1)

print("Labels: "+str(labels))

print("Estimated number of clusters: %d" % n_clusters_)
print("Estimated number of noise points: %d" % n_noise_)

unique_labels = set(labels)
core_samples_mask = np.zeros_like(labels, dtype=bool)
core_samples_mask[db.core_sample_indices_] = True

colors = [plt.cm.Spectral(each) for each in np.linspace(0, 1, len(unique_labels))]

# Find the largest cluster
largest_cluster_size = 0
largest_cluster_index = -1
for k in unique_labels:
    if k != -1:
        cluster_size = list(labels).count(k)
        if cluster_size > largest_cluster_size:
            largest_cluster_size = cluster_size
            largest_cluster_index = k

for k, col in zip(unique_labels, colors):
    if k == -1:
        # Black used for noise.
        col = [0, 0, 0, 1]

    class_member_mask = labels == k

    xy = X[class_member_mask & core_samples_mask]
    plt.plot(
        xy[:, 0],
        xy[:, 1],
        "o",
        markerfacecolor=tuple(col),
        markeredgecolor="k",
        markersize=14,
    )

    xy = X[class_member_mask & ~core_samples_mask]
    plt.plot(
        xy[:, 0],
        xy[:, 1],
        "o",
        markerfacecolor=tuple(col),
        markeredgecolor="k",
        markersize=6,
    )
    # Annotate the largest cluster
    if k == largest_cluster_index:
        plt.annotate(
            f'k', 
            xy=(xy[:, 0].mean(), xy[:, 1].mean()), 
            xytext=(1.05, 1.05),  # Position outside the plot area
            textcoords='axes fraction',  # Use axes fraction for positioning
            arrowprops=dict(arrowstyle='-', color='blue', lw=3),
            bbox=dict(boxstyle="round,pad=0.3", edgecolor='blue', facecolor='yellow', alpha=0.4),
            ha='right',  # Horizontal alignment
            va='bottom'  # Vertical alignment
        )

plt.title(f"Number of clusters: {n_clusters_}")
plt.xlabel("x")
plt.ylabel("y")
plt.show()