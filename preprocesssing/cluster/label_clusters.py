# Label each cluster. 
# Do not use the term 'visualization' for a cluster label.

import json

with open('data_spectral-clustering.json') as f:
    json_data = f.read()
    

# Parse JSON data
data = json.loads(json_data)

# Extract the "text" and the "cluster" and create a new array for each cluster containing the text
cluster = {}
for item in data:
    if item["cluster"] not in cluster:
        cluster[item["cluster"]] = []
    cluster[item["cluster"]].append(item["text"])  

# Concatenate abstracts with the required formatting
formatted_abstracts = {}
for cluster_id, abstracts in cluster.items():
    formatted_texts = []
    for i, abstract in enumerate(abstracts, start=0):
        formatted_texts.append(f"Abstract: {i}\n{abstract}")
    formatted_abstracts[cluster_id] = "\n---\n".join(formatted_texts)


from openai import OpenAI

client = OpenAI()
labeling = {}  # Initialize labeling as an empty dictionary

for cluster_id, abstracts in formatted_abstracts.items():
    response = client.chat.completions.create(
    model="gpt-4o",
    temperature=0.0,
    messages=[
        {"role": "system", "content": "You can only return a few words"},
        {"role": "user", "content": "### Task Description:\n Return a keyword that describes the content of these abstracts (not 'visualization') \n ### Abstracts: \n"+abstracts},
    ],
    )

    response_content = response.choices[0].message.content
    word_count = len(response_content.split())
    # Remove all the special characters from the response except "-" and spaces
    response_content = ''.join(e for e in response_content if e.isalnum() or e == "-" or e == " ")
    # capitalize the first letter of each word
    response_content = ' '.join([word.capitalize() for word in response_content.split()])
    labeling[cluster_id]=response_content
    print(str(cluster_id)+": "+response_content)


# Add the labels to the data
for item in data:
    item["label"] = labeling[item["cluster"]]

# Save the updated data to a new JSON file
with open('whole-data_spectral-clustering_labels.json', 'w') as f:
    json.dump(data, f, indent=4)