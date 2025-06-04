# The script reads the embeddings from the data.json file and projects them to a 2D space using UMAP.
# The projected data is then written to a new file projected_new.json.

import json
import matplotlib.pyplot as plt
import umap
from sklearn.preprocessing import StandardScaler
import numpy as np

def load():
    with open('data.json') as f:
        return json.load(f)

def project(data):
    input_data = np.array([d['embedding'] for d in data])
    
    scaled_data = StandardScaler().fit_transform(input_data)
    reducer = umap.UMAP()
    projected_data = reducer.fit_transform(scaled_data)

    print(
        projected_data[:,0].min(),
        projected_data[:,0].max(),
        projected_data[:,1].min(),
        projected_data[:,1].max(),
    )

    return projected_data

def write(data, projected):
    dataset = [
        {
            "x": float(projected[i,0]),
            "y": float(projected[i,1]),
            "text": data[i]['abstract'],
            "link": data[i]['link'],
            "doi": data[i]['doi']
        }
        for i in range(len(data))
    ]

    with open('projected_data.json', 'w') as f:
        json.dump(dataset, f, indent=2)

if __name__ == '__main__':
    data = load()
    projected = project(data)
    write(data, projected)