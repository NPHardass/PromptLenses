# Translation of x and y values for graph view purposes

import json
with open("full-data_spectral-clustering.json", "r") as f:
    data=json.load(f)
    
for item in data:
    item["x"]=float(item["x"])+2
    item["y"]=float(item["y"])-6

with open("full-data_spectral-clustering_translated.json", "w") as f:
    json.dump(data, f, indent=4)