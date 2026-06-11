# Structure & Target Explorer

A web tool that searches proteins via **UniProt**, loads their 3D structures from **AlphaFold EBI**, and highlights likely binding pockets — entirely using free public APIs, no API key required.

## Features

- **UniProt Search** — find proteins by name, gene symbol, or accession ID
- **AlphaFold Visualization** — 3D protein structure rendered with NGL Viewer, colored by pLDDT confidence
- **Binding Pocket Detection** — heuristic pocket detection based on pLDDT scores and residue chemistry
- **Druggability Scoring** — estimates pocket druggability from aromatic/hydrophobic residue density
- **Multiple View Modes** — cartoon, surface, licorice, spacefill
- **Disease Tagging** — auto-tags proteins associated with cancer, neurological, cardiovascular, etc.

## Free Data Sources

| Source | URL | What is used |
|--------|-----|-------------|
| UniProt REST API | https://rest.uniprot.org | Protein search, metadata |
| AlphaFold EBI API | https://alphafold.ebi.ac.uk/api | PDB structure files |
| RCSB PDB | https://data.rcsb.org | Experimental structure lookup |

## Tech Stack

- React 19 + Vite
- NGL Viewer — WebGL-based molecular visualization
- Tailwind CSS v4
- Lucide React — icons

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Project Structure

```
src/
  components/
    SearchBar.jsx       - Protein search input with example queries
    ProteinCard.jsx     - Result card with disease tags + reviewed badge
    StructureViewer.jsx - NGL 3D viewer with view mode controls
    PocketPanel.jsx     - Pocket analysis panel with druggability score
  utils/
    api.js              - UniProt/AlphaFold fetch helpers + PDB parser
  App.jsx               - Main layout and state management
```

## How Pocket Detection Works

1. Fetch the AlphaFold PDB file (B-factor column = pLDDT score)
2. Filter residues with pLDDT between 60-90 (structured but not rigid = likely surface-exposed binding region)
3. Score by aromatic + hydrophobic composition (pharma rule-of-thumb for druggable pockets)
4. Visualize as orange ball+stick overlay on the cartoon structure

Disclaimer: This is a heuristic educational tool, not a validated docking pipeline. For research use, follow up with Fpocket, AutoDock Vina, or Schrodinger.

## Planned Improvements

- Integrate actual Fpocket via WebAssembly for proper pocket detection
- Add ESMFold for proteins not in AlphaFold DB
- Show known drug binding sites from ChEMBL
- Export pocket residues as FASTA / CSV
- Side-by-side comparison of AlphaFold vs experimental PDB
- Filter by disease class in search results
