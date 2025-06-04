# Get the metadata for each paper in the dataset using CROSSREF API
import requests
import json

def add_metadata_to_json():
    with open("full-data_spectral-clustering_translated.json") as f:
        data=json.load(f)
    for item in data:
        doi=item['doi']
        title, authors = get_paper_info_from_doi(doi)
        item['title']=title
        item['authors']=authors
        print(title, authors)
    with open("full-data_spectral-clustering_translated_metadata.json","w") as f:
        json.dump(data, f, indent=4)

def fetch_metadata(doi):
    url = f"https://api.crossref.org/works/{doi}"
    response = requests.get(url)
    
    if response.status_code != 200:
        print(f"Could not fetch metadata for {doi}")
    
    return response.json()

def extract_title(metadata):
    if 'message' not in metadata or 'title' not in metadata['message']:
        title="No title found"
        return title
    
    title = metadata['message']['title']
    return title[0] if title else "No title found"

def extract_authors(metadata):
    if 'message' not in metadata or 'author' not in metadata['message']:
       authors = ["No authors found"] 
       return authors

    authors = metadata['message']['author']
    author_names = [f"{author.get('given', '')} {author.get('family', '')}".strip() for author in authors]
    
    return author_names

def get_paper_info_from_doi(doi):
    metadata = fetch_metadata(doi)
    title = extract_title(metadata)
    authors = extract_authors(metadata)
    
    return title, authors


add_metadata_to_json()
    
