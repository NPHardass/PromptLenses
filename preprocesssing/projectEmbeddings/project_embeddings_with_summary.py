# The script reads the embeddings from the data.json file and projects them to a 2D space using UMAP.
# The projected data is then written to a new file projected_new.json.
# additionally add summaries

import json
import matplotlib.pyplot as plt
import umap
from sklearn.preprocessing import StandardScaler
import numpy as np

from openai import OpenAI
client = OpenAI()

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

def summary(data):
    summaries=[]
    for item in data:
    
        prompt_string = "This is a scientific article abstract. Summarize it in one short sentence:\n"
        content_string=prompt_string+item["abstract"]

        response = client.chat.completions.create(
            model="gpt-4o",
            temperature=0.0,
            messages=[
            {"role": "assistant", "content": "As a research assistant."},
            {"role": "user", "content": content_string},
            ],
            seed=31
        )

        response_content = response.choices[0].message.content
        print("Summary: "+str(response_content))
        # Extract the response content and add it as a new attribute
        summaries.append(response_content)
    return summaries
    

def write(data, projected,summaries):
    dataset = [
        {
            "id": i,
            "x": float(projected[i,0]),
            "y": float(projected[i,1]),
            "text": data[i]['abstract'],
            # "summary": summaries[i],
            "link": data[i]['link'],
            "doi": data[i]['doi']
        }
        for i in range(len(data))
    ]

    with open('data_new.json', 'w') as f:
        json.dump(dataset, f, indent=2)

if __name__ == '__main__':
    data = load()
    projected = project(data)
    # summaries=summary(data)
    summaries=[]
    write(data, projected,summaries)