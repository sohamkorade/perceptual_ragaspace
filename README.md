# Raga Perceptual Space Study

This project investigates the perceptual organization of ragas in Indian classical music by comparing human similarity judgments with a computational raga space derived from symbolic notation.

We designed and conducted a human-subject experiment where participants (mainly trained musicians) rated the similarity between pairs of short audio excerpts of ragas. These ratings were then compared to a symbolic, TF-IDF-based embedding space of ragas to understand the cognitive validity of such computational models.

This project is part of an independent study under the guidance of Dr. Vinoo Alluri. The study was conducted by Soham Korade at IIIT Hyderabad in 2025.

## Project Goals

- Construct a perceptual similarity space from human ratings of raga pairs.
- Compare perceptual similarity with TF-IDF-based symbolic representations of ragas.
- Evaluate whether short raga excerpts (16-length swara sequences) are sufficient to elicit meaningful perceptual judgments.
- Analyze differences in perception between musicians and non-musicians.

## Directory Structure

```bash
.
├── analysis/                     # All notebooks, embeddings, and comparison code
│   ├── 2dTSNE.json              # t-SNE embedding of ragas (computed from TF-IDF)
│   ├── grid_analyze_similarity.ipynb  # MDS, heatmaps, and correlation analysis (grid level)
│   ├── grid.pdf                 # Visualization of the raga grid used in experiment
│   ├── raga_grid_sets.json      # Grid-to-raga mapping (used for stimulus sampling)
│   ├── raga_similarity_perceptual.csv # Final perceptual similarity matrix (ragas)
│   ├── raga_space_grid.ipynb    # Scripts for creating the raga space grid
│   ├── Raga space.pdf           # Plot of the original raga space (t-SNE)
│   ├── tfidf_short_seq.ipynb    # Comparison of full vs short TF-IDF vectors
│   └── tokenize_seq.py          # Script to tokenize swara sequences
│
├── experiment_responses/        # All response data collected from participants
│   ├── sample_001.json
│   ├── ...
│   └── sample_014.json          # One file per participant (anonymized)
│
├── anonymization_mapping.csv    # Maps original participant IDs to anonymized names
├── anonymize_responses.ipynb    # Script to rename and anonymize JSON responses
│
├── experiment_web/              # Static site files for running the experiment
│   ├── index.html               # Web interface for rating raga pairs
│   ├── script.js                # Trial generation and response logging
│   ├── player.js                # Audio playback logic
│   ├── db.json                  # List of ragas and their swara sequences
│   ├── raga_sets.json           # Raga sets used in grid sampling
│   ├── C_tanpura.mp3			 # Background drone audio
│
└── README.md                    # This file
```

## Key Findings

* Strong correlation between perceptual similarity and computational TF-IDF features (ρ ≈ 0.51).
* Musicians and non-musicians show highly different perceptual spaces (ρ ≈ –0.10).
* Short raga excerpts (\~16 swaras) are generally sufficient for triggering meaningful similarity judgments in trained listeners.

## Acknowledgments

The computational raga space used in this study is based on the work of Korade et al. (2024), which applies TF-IDF and t-SNE to swara sequences to visualize melodic relationships across ragas.

If you use any part of this code or data, please cite the original paper:
```
@inproceedings{korade2024ragaspace,
  title={Raga Space Visualization: Analyzing Melodic Structures in Carnatic and Hindustani Music},
  author={Soham Korade and Suswara Pochampally and Saroja TK},
  booktitle={Proceedings of the NLP4MUSA Workshop},
  year={2024},
  note={\url{https://aclanthology.org/2024.nlp4musa-1.10.pdf}}
}
```

## License

This project is for academic research and educational use. Please contact the author for permission before reuse or redistribution.