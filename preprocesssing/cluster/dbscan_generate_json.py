# Generate the dbscan and save the data to a new JSON file

import json
import numpy as np

with open('data.json') as f:
    json_data = f.read()

# Parse JSON data
data = json.loads(json_data)

# Extract "x" and "y" values and save them in a list of lists
coordinates = [[item["x"], item["y"]] for item in data]

# Convert the list of lists to a NumPy array
X = np.array(coordinates)

from sklearn.cluster import DBSCAN

# Idee: über große entstandene cluster nochmal drüber laufen und die cluster in kleinere cluster aufteilen
db = DBSCAN(eps=0.25, min_samples=7).fit(X)
labels = db.labels_

# Number of clusters in labels, ignoring noise if present.
n_clusters_ = len(set(labels)) - (1 if -1 in labels else 0)
n_noise_ = list(labels).count(-1)

print("Labels: "+str(labels))

print("Estimated number of clusters: %d" % n_clusters_)
print("Estimated number of noise points: %d" % n_noise_)

# Update data with cluster labels
for item, label in zip(data, labels):
    item["cluster"] = int(label)

# Again for the most common cluster
from collections import Counter

# Count the number of points in each cluster
cluster_counts = Counter(labels)

# Ignore noise points
del cluster_counts[-1]

# Find the cluster with the most points
most_common_cluster = cluster_counts.most_common(1)[0][0]
print("Most common cluster: "+str(most_common_cluster))


# Get the points in the most common cluster
most_common_cluster_points = X[labels == most_common_cluster]

print("Most common cluster points: "+str(most_common_cluster_points))

### Uncomment this to run again over the big cluster again with dbscan

# db = DBSCAN(eps=0.2, min_samples=5).fit(most_common_cluster_points)
# sublabels = db.labels_

# # Number of clusters in labels, ignoring noise if present.
# n_clusters_ = len(set(sublabels)) - (1 if -1 in sublabels else 0)
# n_noise_ = list(sublabels).count(-1)

# print("Labels: "+str(sublabels))

# print("Estimated number of clusters: %d" % n_clusters_)
# print("Estimated number of noise points: %d" % n_noise_)

# # Get the indices of the points in the most common cluster
# most_common_cluster_indices = np.where(labels == most_common_cluster)[0]

# # Add 'subcluster' attribute to data points in the most common cluster
# for i, sublabel in zip(most_common_cluster_indices, sublabels):
#     data[i]['subcluster'] = int(sublabel)

# Save the updated data back to the JSON file
with open('visus_papers_dbscan.json', 'w') as f:
    json.dump(data, f)