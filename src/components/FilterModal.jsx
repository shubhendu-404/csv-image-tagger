import { useState, useMemo } from 'react';

export default function FilterModal({ columnUniqueValues, products, filters, onApply, onClose }) {
  const columns = Object.keys(columnUniqueValues);

  const [draft, setDraft] = useState(() => {
    const d = {};
    columns.forEach(col => {
      d[col] = filters[col] ? new Set(filters[col]) : null;
    });
    return d;
  });

  const [activeCol, setActiveCol] = useState(columns[0] ?? null);
  const [valSearch, setValSearch] = useState('');

  const uniqueVals = activeCol ? (columnUniqueValues[activeCol] ?? []) : [];

  const RENDER_CAP = 300;
  const filteredVals = valSearch
    ? uniqueVals.filter(v => v.toLowerCase().includes(valSearch.toLowerCase()))
    : uniqueVals;
  const visibleVals = filteredVals.slice(0, RENDER_CAP);
  const hiddenCount = filteredVals.length - visibleVals.length;

  const colSelection = activeCol ? (draft[activeCol] ?? null) : null;
  // null = all selected; Set = specific selection

  const toggleVal = (val) => {
    if (!activeCol) return;
    setDraft(prev => {
      const allVals = uniqueVals;
      let cur = prev[activeCol] ? new Set(prev[activeCol]) : new Set(allVals);
      cur.has(val) ? cur.delete(val) : cur.add(val);
      // If all selected, store null (no restriction)
      const isAll = allVals.every(v => cur.has(v));
      return { ...prev, [activeCol]: isAll ? null : cur };
    });
  };

  const selectAll = () => {
    if (!activeCol) return;
    setDraft(prev => ({ ...prev, [activeCol]: null }));
  };

  const clearAll = () => {
    if (!activeCol) return;
    setDraft(prev => ({ ...prev, [activeCol]: new Set() }));
  };

  const matchCount = useMemo(() => {
    const activeFilters = Object.fromEntries(
      Object.entries(draft).filter(([, v]) => v !== null)
    );
    if (Object.keys(activeFilters).length === 0) return products.length;
    return products.filter(p =>
      Object.entries(activeFilters).every(([col, vals]) => vals.has(p.keyValues[col] ?? ''))
    ).length;
  }, [draft, products]);

  const handleApply = () => {
    const applied = {};
    Object.entries(draft).forEach(([col, sel]) => {
      if (sel !== null) applied[col] = sel;
    });
    onApply(applied);
  };

  const handleReset = () => {
    const cleared = {};
    columns.forEach(col => { cleared[col] = null; });
    setDraft(cleared);
  };

  const hasActiveFilters = Object.values(draft).some(v => v !== null);

  const colHasFilter = (col) => draft[col] !== null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-[640px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-800">
          <span className="font-semibold text-white text-sm">Filter</span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">
              {matchCount} / {products.length} products
            </span>
            {hasActiveFilters && (
              <button
                onClick={handleReset}
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                Reset all
              </button>
            )}
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-lg leading-none">×</button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0">
          {/* Column list */}
          <div className="w-44 border-r border-gray-800 overflow-y-auto py-2">
            {columns.map(col => (
              <button
                key={col}
                onClick={() => { setActiveCol(col); setValSearch(''); }}
                className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors ${
                  activeCol === col
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                {colHasFilter(col) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                )}
                <span className={`truncate ${!colHasFilter(col) ? 'ml-3.5' : ''}`}>{col}</span>
              </button>
            ))}
          </div>

          {/* Value checkboxes */}
          <div className="flex-1 flex flex-col min-h-0">
            {activeCol && (
              <>
                <div className="flex flex-col border-b border-gray-800/60">
                  <div className="flex items-center gap-3 px-4 py-2">
                    <button
                      onClick={selectAll}
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Select all
                    </button>
                    <span className="text-gray-700">·</span>
                    <button
                      onClick={clearAll}
                      className="text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      Clear
                    </button>
                    <span className="ml-auto text-xs text-gray-600">{uniqueVals.length} values</span>
                  </div>
                  <div className="px-4 pb-2">
                    <input
                      type="text"
                      value={valSearch}
                      onChange={e => setValSearch(e.target.value)}
                      placeholder="Search values…"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto py-1">
                  {uniqueVals.length === 0 ? (
                    <p className="text-gray-600 text-xs px-4 py-3">No values</p>
                  ) : filteredVals.length === 0 ? (
                    <p className="text-gray-600 text-xs px-4 py-3">No match</p>
                  ) : (
                    <>
                      {visibleVals.map(val => {
                        const sel = draft[activeCol];
                        const checked = sel === null || sel.has(val);
                        return (
                          <label
                            key={val}
                            className="flex items-center gap-3 px-4 py-1.5 hover:bg-gray-800/50 cursor-pointer group"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleVal(val)}
                              className="w-3.5 h-3.5 accent-blue-500 shrink-0"
                            />
                            <span className="text-sm text-gray-300 group-hover:text-white transition-colors truncate">
                              {val}
                            </span>
                          </label>
                        );
                      })}
                      {hiddenCount > 0 && (
                        <p className="text-xs text-gray-600 px-4 py-2">
                          +{hiddenCount} more — search to filter
                        </p>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
            {!activeCol && (
              <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
                Select a column
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-5 py-1.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
