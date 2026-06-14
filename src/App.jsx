import { useState } from 'react';
import { Dna, FlaskConical, Gamepad2, Home, ExternalLink, Loader, AlertTriangle } from 'lucide-react';
import SearchBar from './components/SearchBar';
import ProteinCard from './components/ProteinCard';
import StructureViewer from './components/StructureViewer';
import PocketPanel from './components/PocketPanel';
import ConfidenceChart from './components/ConfidenceChart';
import HomePage from './components/HomePage';
import GamesHub from './components/GamesHub';
import { searchUniProt, getAlphaFoldStructure, fetchPDBFile, parsePDB, computePocketHeuristic, esmFoldFromSequence, getUniProtSequence } from './utils/api';

function NavBtn({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all rounded"
      style={{
        color: active ? '#00ff88' : '#5a7a5a',
        background: active ? '#0d200d' : 'transparent',
        border: active ? '1px solid #1a3a1a' : '1px solid transparent',
      }}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

export default function App() {
  const [mode, setMode] = useState('home'); // 'home' | 'explorer' | 'games'
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [selectedProtein, setSelectedProtein] = useState(null);
  const [structureData, setStructureData] = useState(null);
  const [pockets, setPockets] = useState(null);
  const [allAtoms, setAllAtoms] = useState(null);
  const [structureSource, setStructureSource] = useState(null);
  const [loadingStructure, setLoadingStructure] = useState(false);
  const [error, setError] = useState(null);

  async function handleSearch(query) {
    setSearching(true);
    setError(null);
    setResults(null);
    setSelectedProtein(null);
    setStructureData(null);
    setPockets(null);
    try {
      const data = await searchUniProt(query);
      setResults(data.results || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  }

  async function handleSelectProtein(protein) {
    setSelectedProtein(protein);
    setStructureData(null);
    setPockets(null);
    setLoadingStructure(true);
    setError(null);
    try {
      const accession = protein.primaryAccession;
      let pdbText;
      try {
        const afData = await getAlphaFoldStructure(accession);
        if (!afData || !afData[0]) throw new Error('no alphafold');
        const entry = afData[0];
        setStructureData(entry);
        setStructureSource('alphafold');
        pdbText = await fetchPDBFile(entry.pdbUrl);
      } catch {
        setStructureSource('esmfold');
        const seq = await getUniProtSequence(accession);
        pdbText = await esmFoldFromSequence(seq);
        const blob = new Blob([pdbText], { type: 'text/plain' });
        const blobUrl = URL.createObjectURL(blob);
        setStructureData({ pdbUrl: blobUrl, uniprotAccession: accession });
      }
      const atoms = parsePDB(pdbText);
      setAllAtoms(atoms);
      const computedPockets = computePocketHeuristic(atoms);
      setPockets(computedPockets);
    } catch (err) {
      setError('Structure error: ' + err.message);
    } finally {
      setLoadingStructure(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#080c08', color: '#b8cbb8', fontFamily: 'Courier New, monospace' }}>
      {/* Nav */}
      <header style={{ borderBottom: '1px solid #1a2e1a', background: '#060b06', position: 'sticky', top: 0, zIndex: 20 }}>
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Dna className="w-5 h-5" style={{ color: '#00ff88' }} />
            <div>
              <span className="font-bold text-sm" style={{ color: '#00ff88' }}>BioLink</span>
              <span className="text-xs ml-2" style={{ color: '#2a4a2a' }}>// structure & target explorer</span>
            </div>
          </div>

          <nav className="flex items-center gap-1">
            <NavBtn active={mode === 'home'} onClick={() => setMode('home')} icon={Home} label="Home" />
            <NavBtn active={mode === 'explorer'} onClick={() => setMode('explorer')} icon={FlaskConical} label="Explorer" />
            <NavBtn active={mode === 'games'} onClick={() => setMode('games')} icon={Gamepad2} label="Games" />
          </nav>
        </div>
      </header>

      {mode === 'home' && (
        <HomePage
          onExplore={() => setMode('explorer')}
          onGames={() => setMode('games')}
        />
      )}

      {mode === 'games' && <GamesHub />}

      {mode === 'explorer' && (
        <main className="max-w-6xl mx-auto px-6 py-10">
          <div className="mb-8">
            <div className="text-xs tracking-widest uppercase mb-3" style={{ color: '#2a4a2a' }}>// protein structure explorer</div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#00ff88' }}>
              Search Proteins
            </h2>
            <p className="text-sm" style={{ color: '#5a7a5a', maxWidth: '480px' }}>
              Search any protein to view its 3D AlphaFold structure and identify druggable binding pockets.
            </p>
          </div>

          <SearchBar onSearch={handleSearch} loading={searching} />

          {error && (
            <div className="mt-4 max-w-2xl flex items-center gap-2 p-3 rounded text-sm"
              style={{ background: '#1a050a', border: '1px solid #3a1020', color: '#ff4455' }}>
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {results !== null && (
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-3">
                <h3 className="text-xs font-bold mb-2 tracking-widest uppercase" style={{ color: '#5a7a5a' }}>
                  {results.length} result{results.length !== 1 ? 's' : ''}
                </h3>
                {results.length === 0 && (
                  <p className="text-sm text-center py-8" style={{ color: '#2a4a2a' }}>No proteins found.</p>
                )}
                {results.map(p => (
                  <ProteinCard
                    key={p.primaryAccession}
                    protein={p}
                    onSelect={handleSelectProtein}
                    selected={selectedProtein?.primaryAccession === p.primaryAccession}
                  />
                ))}
              </div>

              <div className="lg:col-span-2">
                {!selectedProtein && (
                  <div className="h-full min-h-[400px] flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed"
                    style={{ borderColor: '#1a2e1a', background: '#0d120d' }}>
                    <Dna className="w-10 h-10" style={{ color: '#2a4a2a' }} />
                    <p className="text-sm" style={{ color: '#2a4a2a' }}>Select a protein to view its 3D structure</p>
                  </div>
                )}
                {selectedProtein && (
                  <div className="space-y-4">
                    <div className="rounded-lg p-4" style={{ background: '#0d120d', border: '1px solid #1a2e1a' }}>
                      <h3 className="font-bold" style={{ color: '#00ff88' }}>
                        {selectedProtein.proteinDescription?.recommendedName?.fullName?.value || selectedProtein.uniProtkbId}
                      </h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <a href={"https://www.uniprot.org/uniprot/" + selectedProtein.primaryAccession}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs hover:underline" style={{ color: '#00d4ff' }}>
                          UniProt {selectedProtein.primaryAccession} <ExternalLink className="w-3 h-3" />
                        </a>
                        {structureSource === 'esmfold' && (
                          <span className="text-xs px-2 py-0.5 rounded" style={{ background: '#1a1000', color: '#ffcc00', border: '1px solid #2a2000' }}>
                            ESMFold prediction
                          </span>
                        )}
                        {structureSource === 'alphafold' && (
                          <span className="text-xs px-2 py-0.5 rounded" style={{ background: '#001a20', color: '#00d4ff', border: '1px solid #002a30' }}>
                            AlphaFold structure
                          </span>
                        )}
                      </div>
                    </div>

                    {loadingStructure && (
                      <div className="flex items-center justify-center gap-2 py-16">
                        <Loader className="w-5 h-5 animate-spin" style={{ color: '#00ff88' }} />
                        <span className="text-sm" style={{ color: '#5a7a5a' }}>Loading structure…</span>
                      </div>
                    )}

                    {!loadingStructure && structureData && (
                      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                        <div className="xl:col-span-2 h-[450px]">
                          <StructureViewer pdbUrl={structureData.pdbUrl} pockets={pockets} />
                        </div>
                        <div className="xl:col-span-1 h-[450px]">
                          <PocketPanel pockets={pockets} proteinName={selectedProtein.uniProtkbId} uniprotId={selectedProtein.primaryAccession} />
                        </div>
                      </div>
                    )}

                    {allAtoms && <ConfidenceChart atoms={allAtoms} />}

                    <p className="text-xs text-center p-2 rounded" style={{ background: '#0d100a', color: '#2a4a2a', border: '1px solid #1a2010' }}>
                      Pocket predictions are heuristic estimates based on pLDDT scores. Not validated docking analysis.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {results === null && !searching && (
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
              {[
                { title: 'Search UniProt', desc: 'Find proteins by name, gene symbol, or accession ID', icon: '🔍' },
                { title: 'View AlphaFold Structure', desc: 'AI-predicted 3D structure with confidence color-coding', icon: '🧬' },
                { title: 'Identify Binding Pockets', desc: 'Highlight residues likely to form druggable pockets', icon: '🎯' },
              ].map(f => (
                <div key={f.title} className="rounded-lg p-5 text-center" style={{ background: '#0d120d', border: '1px solid #1a2e1a' }}>
                  <div className="text-2xl mb-3">{f.icon}</div>
                  <h4 className="font-bold text-sm mb-1" style={{ color: '#00ff88' }}>{f.title}</h4>
                  <p className="text-xs" style={{ color: '#5a7a5a' }}>{f.desc}</p>
                </div>
              ))}
            </div>
          )}
        </main>
      )}
    </div>
  );
}
