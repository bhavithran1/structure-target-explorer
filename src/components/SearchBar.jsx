import { useState, useEffect, useRef } from 'react';
import { Search, Loader, Clock, X } from 'lucide-react';

const HISTORY_KEY = 'ste_search_history';
function getHistory() { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
function pushHistory(q) {
  const h = [q, ...getHistory().filter(x => x !== q)].slice(0, 8);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h));
}

export default function SearchBar({ onSearch, loading }) {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState(getHistory);
  const [showHistory, setShowHistory] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    function onKey(e) {
      if (e.key === '/' && !e.target.matches('input,textarea')) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  function submit(q) {
    const t = q.trim();
    if (!t) return;
    pushHistory(t);
    setHistory(getHistory());
    setShowHistory(false);
    onSearch(t);
  }

  function handleSubmit(e) {
    e.preventDefault();
    submit(query);
  }

  function removeHistory(item, e) {
    e.stopPropagation();
    const h = getHistory().filter(x => x !== item);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(h));
    setHistory(h);
  }

  const examples = ['TP53', 'EGFR', 'BRCA1', 'KRAS', 'BCL2'];

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setShowHistory(history.length > 0)}
            onBlur={() => setTimeout(() => setShowHistory(false), 150)}
            placeholder="Search protein name, gene symbol, or UniProt ID… (press / to focus)"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
          {showHistory && (
            <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
              <p className="text-xs text-gray-400 px-3 pt-2 pb-1">Recent searches</p>
              {history.map(item => (
                <div
                  key={item}
                  className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onMouseDown={() => { setQuery(item); submit(item); }}
                >
                  <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <Clock className="w-3 h-3 text-gray-400" /> {item}
                  </div>
                  <button onMouseDown={e => removeHistory(item, e)} className="text-gray-300 hover:text-red-400 p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-medium text-sm flex items-center gap-2 transition-colors"
        >
          {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Search
        </button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2 justify-center">
        <span className="text-xs text-gray-400">Examples:</span>
        {examples.map(ex => (
          <button
            key={ex}
            onClick={() => { setQuery(ex); submit(ex); }}
            className="text-xs px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
