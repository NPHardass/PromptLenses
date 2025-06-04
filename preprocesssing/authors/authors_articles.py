# Enhance the dataset with which authors have contributed to which articles
# and who the co-authors of each author are.

import json
from collections import defaultdict

def process_articles(input_file, output_file):
    # Read the input JSON file
    with open(input_file, 'r') as f:
        articles = json.load(f)

    # Create a dictionary to store author information
    author_data = defaultdict(lambda: {"name": "", "contributions": [], "co_authors": set()})

    # Process each article
    for article in articles:
        article_id = article['id']
        abstract = article['text']
        authors = article['authors']
        
        # Add contribution and co-authors for each author
        for author in authors:
            author_data[author]['name'] = author
            author_data[author]['contributions'].append({
                "article_id": article_id,
                "abstract": abstract
            })
            # Add co-authors (excluding the author themselves)
            author_data[author]['co_authors'].update(set(authors) - {author})

    # Convert the defaultdict to a list of author dictionaries
    # and convert set of co-authors to a list
    author_list = []
    for author, data in author_data.items():
        data['co_authors'] = list(data['co_authors'])
        author_list.append(data)

    # Write the output JSON file
    with open(output_file, 'w') as f:
        json.dump(author_list, f, indent=2)

    print(f"Processed {len(articles)} articles and {len(author_list)} authors.")
    print(f"Output written to {output_file}")

# Usage
input_file = 'full-data_spectral-clustering_translated_metadata.json' 
output_file = 'authors_output.json' 

process_articles(input_file, output_file)