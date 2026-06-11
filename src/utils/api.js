// API utilities for free bioinformatics services

const ALPHAFOLD_BASE = 'https://alphafold.ebi.ac.uk/api';
const UNIPROT_BASE = 'https://rest.uniprot.org/uniprotkb';
const PDB_BASE = 'https://data.rcsb.org/rest/v1';
const ESMATLAS_BASE = 'https://esmatlas.com/api';

export async function searchUniProt(query) {
  const url = `${UNIPROT_BASE}/search?query=${encodeURIComponent(query)}&format=json&size=10&fields=accession,id,protein_name,organism_name,gene_names,length,reviewed`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`UniProt search failed: ${res.status}`);
  return res.json();
}

export async function getAlphaFoldStructure(uniprotId) {
  const url = `${ALPHAFOLD_BASE}/prediction/${uniprotId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`AlphaFold API failed: ${res.status}`);
  return res.json();
}

// ESMFold fallback: predict structure from sequence using ESM Atlas API
// Returns a synthetic entry with pdbUrl pointing to data URL
export async function esmFoldFromSequence(sequence) {
  const res = await fetch(`${ESMATLAS_BASE}/foldSequence/v1/pdb`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `sequence=${encodeURIComponent(sequence)}&potential_sequence_of_concern=false`,
  });
  if (!res.ok) throw new Error(`ESMFold API failed: ${res.status}`);
  const pdbText = await res.text();
  // Return the PDB text directly (caller uses fetchPDBFile or parses inline)
  return pdbText;
}

export async function getUniProtSequence(uniprotId) {
  const res = await fetch(`${UNIPROT_BASE}/${uniprotId}.fasta`);
  if (!res.ok) throw new Error('Could not fetch sequence');
  const fasta = await res.text();
  // Strip header line(s) and join sequence
  return fasta.split('\n').filter(l => !l.startsWith('>')).join('').slice(0, 400);
}

export async function getPDBStructures(uniprotId) {
  const url = `${PDB_BASE}/core/uniprot/${uniprotId}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchPDBFile(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch PDB: ${res.status}`);
  return res.text();
}

// Compute simple binding pocket heuristic from pLDDT scores
// Residues with pLDDT 70-90 at surface are good pocket candidates
export function computePocketHeuristic(atoms) {
  const residueMap = new Map();
  for (const atom of atoms) {
    if (!residueMap.has(atom.resSeq)) {
      residueMap.set(atom.resSeq, { resSeq: atom.resSeq, resName: atom.resName, bFactor: atom.bFactor, atoms: [] });
    }
    residueMap.get(atom.resSeq).atoms.push(atom);
  }
  const residues = Array.from(residueMap.values());
  // In AlphaFold PDB, B-factor column contains pLDDT score
  const pockets = residues
    .filter(r => r.bFactor >= 60 && r.bFactor <= 90)
    .map(r => ({ ...r, score: r.bFactor }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 30);
  return pockets;
}

export function parsePDB(pdbText) {
  const atoms = [];
  for (const line of pdbText.split('\n')) {
    if (!line.startsWith('ATOM') && !line.startsWith('HETATM')) continue;
    atoms.push({
      serial: parseInt(line.slice(6, 11).trim()),
      name: line.slice(12, 16).trim(),
      resName: line.slice(17, 20).trim(),
      chainId: line.slice(21, 22).trim(),
      resSeq: parseInt(line.slice(22, 26).trim()),
      x: parseFloat(line.slice(30, 38).trim()),
      y: parseFloat(line.slice(38, 46).trim()),
      z: parseFloat(line.slice(46, 54).trim()),
      bFactor: parseFloat(line.slice(60, 66).trim()) || 0,
      element: line.slice(76, 78).trim(),
    });
  }
  return atoms;
}
