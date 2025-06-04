# Overview

![teaser](images/teaser.png)

This repository contains the demo code for the work ''PromptLenses: Enhancing the Magic of Lenses (for Text Analysis)'' by Satkunarajan et al. [[1]](#ref1).

We introduce an visual-interactive approach to fast analysis of textual data, utilizing a LLM-powered magic lens and a progressive analysis pipeline for the exploration of text data. 

The prototype implementation utilizes OpenAI's [GPT4o-mini] (https://platform.openai.com/docs/models/o4-mini) via the OpenAI API for the analysis of textual embeddings.

The data is visualized as 2D projections by utilizing [UMAP](https://umap-learn.readthedocs.io/en/latest/) to dimensionality reduce the data.

By applying [spectral clustering](https://scikit-learn.org/stable/modules/generated/sklearn.cluster.SpectralClustering.html) we also provide cluster labels for orientation.

The progressive analysis pipeline comprises three components: **(1)** Precomputation of clusters, **(2)** Short LLM answers and **(3)** extended LLM answers.

The code works with textual inputs and can be utilized out-of-the-box with the IEEE VIS abstracts [[2]](#ref2) found in /src/data. To use custom datasets please refer to the data processing tutorial. You can find below a a detailed description of how to run the code.

# Usage

# Demo video

# References
<a name="ref1"></a> [1] J. Satkunarajan et al., "PromptLenses: Improving the Magic of Lenses (for Text Analysis)", in EuroVis 2025 - Short Papers.

<a name="ref2"></a> [2] P. Isenberg et al., "Vispubdata.org: A Metadata Collection About IEEE Visualization (VIS) Publications," in IEEE Transactions on Visualization and Computer Graphics
