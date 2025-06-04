# Generate short and long descriptions of the contributions of authors

from openai import OpenAI
import json

def process_authors(input_file, output_file, batch_size=50):
    client = OpenAI()

    with open(input_file, 'r') as file:
        author_data = json.load(file)

    total_authors = len(author_data)
    
    for i, author in enumerate(author_data, 1):
        author_name = author['name']
        contributions = author['contributions']
        
        prompt_string_short = f"### Task Description:\nThe author '{author_name}' contributed to these abstracts in the visualization research field.\n\
        Please perform the following tasks with the above abstracts:\n\
        - What novel contributions did they achieve for the field, if any\n\
        - Do not summarize the abstracts\n\
        - Do not separate the topics by the abstracts if they talk about similar topics\n\
        - The response should only be one quick sentence"
        
        prompt_string_long = f"### Task Description:\nThe author '{author_name}' contributed to these abstracts in the visualization research field.\n\
        Please perform the following tasks with the above abstracts:\n\
        - What novel contributions did they achieve for the field, if any\n\
        - Do not summarize the abstracts\n\
        - Do not separate the topics by the abstracts if they talk about similar topics\n"
        
        content_string = "### Abstracts:\n" + "\n".join(f"Abstract:\n{contribution['abstract']}" for contribution in contributions)
        
        content_string_short = f"{content_string}\n{prompt_string_short}"
        content_string_long = f"{content_string}\n{prompt_string_long}"

        # Short description
        response_short = client.chat.completions.create(
            model="gpt-4o",
            temperature=0.0,
            messages=[
                {"role": "assistant", "content": "As a research assistant."},
                {"role": "user", "content": content_string_short},
            ],
            seed=31
        )
        author["description_short"] = response_short.choices[0].message.content
        print(author["description_short"])
        # Long description
        response_long = client.chat.completions.create(
            model="gpt-4o",
            temperature=0.0,
            messages=[
                {"role": "assistant", "content": "As a research assistant."},
                {"role": "user", "content": content_string_long},
            ],
            seed=31
        )
        author["description_long"] = response_long.choices[0].message.content

        # Save progress every 'batch_size' authors or at the end
        if i % batch_size == 0 or i == total_authors:
            with open(output_file, 'w') as file:
                json.dump(author_data, file, indent=2)
            print(f"Processed and saved {i} out of {total_authors} authors.")

    print("Processing complete. All results saved.")

# Usage
input_file = 'authors_output.json'
output_file = 'authors_descriptions.json'
process_authors(input_file, output_file)