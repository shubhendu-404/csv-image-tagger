import { useState, useEffect, useRef } from 'react';

export default function Tagger({ products, tags, tagMap, setTagMap, onExport }) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(new Set());
  const [lastClicked, setLastClicked] = useState(null);
  const [showAllKv, setShowAllKv] = useState(false);
  const [jumpInput, setJumpInput] = useState(false);
  const [jumpVal, setJumpVal] = useState('');
  const jumpRef = useRef();

  const stateRef = useRef({});
  stateRef.current = { idx, selected, lastClicked, products, tags, tagMap };

  const preloadRef = useRef([]);
  useEffect(() => {
    preloadRef.current = [];
    for (let offset = 1; offset <= 2; offset++) {
      const next = products[idx + offset];
      if (!next) break;
      next.images.forEach(img => {
        const el = new Image();
        el.src = img.url;
        preloadRef.current.push(el);
      });
    }
  }, [idx, products]);

  const product = products[idx];
  const productTagMap = tagMap[product.id] || {};
  const taggedCount = Object.keys(productTagMap).length;
  const totalTagged = Object.values(tagMap).reduce((s, m) => s + Object.keys(m).length, 0);

  const applyTagById = (tagId) => {
    const { selected, products, idx } = stateRef.current;
    if (selected.size === 0) return;
    const pid = products[idx].id;
    setTagMap(prev => {
      const m = { ...(prev[pid] || {}) };
      selected.forEach(i => { m[i] = tagId; });
      return { ...prev, [pid]: m };
    });
    setSelected(new Set());
    setLastClicked(null);
  };

  const clearSelected = () => {
    const { selected, products, idx } = stateRef.current;
    const pid = products[idx].id;
    setTagMap(prev => {
      const m = { ...(prev[pid] || {}) };
      if (selected.size === 0) {
        // clear all tags for this product
        return { ...prev, [pid]: {} };
      }
      selected.forEach(i => { delete m[i]; });
      return { ...prev, [pid]: m };
    });
    setSelected(new Set());
  };

  const goNext = () => {
    const { idx, products } = stateRef.current;
    if (idx < products.length - 1) {
      setIdx(i => i + 1);
      setSelected(new Set());
      setLastClicked(null);
      setShowAllKv(false);
    }
  };

  const goPrev = () => {
    const { idx } = stateRef.current;
    if (idx > 0) {
      setIdx(i => i - 1);
      setSelected(new Set());
      setLastClicked(null);
      setShowAllKv(false);
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if (jumpInput) return;
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON') return;

      const { tags, selected, products } = stateRef.current;
      const key = e.key;

      if (key >= '1' && key <= '9') {
        const t = tags[parseInt(key) - 1];
        if (t) applyTagById(t.id);
        return;
      }
      if (key === '0' || key === 'Delete') {
        clearSelected();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && key.toLowerCase() === 'a') {
        e.preventDefault();
        setSelected(new Set(products[stateRef.current.idx].images.map((_, i) => i)));
        return;
      }
      if (key === 'Escape') {
        setSelected(new Set());
        setLastClicked(null);
        return;
      }
      if ((key === 'Enter' || key === ' ') && !e.shiftKey) {
        e.preventDefault();
        goNext();
        return;
      }
      if (key === 'Backspace') {
        e.preventDefault();
        goPrev();
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [jumpInput]);

  const singleTagMode = tags.length === 1;

  const handleImageClick = (imgIdx, e) => {
    e.preventDefault();

    if (singleTagMode) {
      const pid = products[idx].id;
      if (e.shiftKey && lastClicked !== null) {
        // range: apply single tag to all in range
        const lo = Math.min(lastClicked, imgIdx);
        const hi = Math.max(lastClicked, imgIdx);
        setTagMap(prev => {
          const m = { ...(prev[pid] || {}) };
          for (let i = lo; i <= hi; i++) m[i] = tags[0].id;
          return { ...prev, [pid]: m };
        });
      } else {
        // toggle tag directly
        setTagMap(prev => {
          const m = { ...(prev[pid] || {}) };
          m[imgIdx] === tags[0].id ? delete m[imgIdx] : (m[imgIdx] = tags[0].id);
          return { ...prev, [pid]: m };
        });
      }
      setLastClicked(imgIdx);
      return;
    }

    if (e.shiftKey && lastClicked !== null) {
      const lo = Math.min(lastClicked, imgIdx);
      const hi = Math.max(lastClicked, imgIdx);
      setSelected(prev => {
        const n = new Set(prev);
        for (let i = lo; i <= hi; i++) n.add(i);
        return n;
      });
    } else {
      setSelected(prev => {
        const n = new Set(prev);
        n.has(imgIdx) ? n.delete(imgIdx) : n.add(imgIdx);
        return n;
      });
    }
    setLastClicked(imgIdx);
  };

  const submitJump = () => {
    const n = parseInt(jumpVal);
    if (!isNaN(n) && n >= 1 && n <= products.length) {
      setIdx(n - 1);
      setSelected(new Set());
      setLastClicked(null);
      setShowAllKv(false);
    }
    setJumpInput(false);
    setJumpVal('');
  };

  const kvEntries = Object.entries(product.keyValues);
  const visibleKv = showAllKv ? kvEntries : kvEntries.slice(0, 8);

  return (
    <div className="h-screen flex flex-col bg-gray-950 overflow-hidden">
      {/* Top bar */}
      <div className="shrink-0 bg-gray-900 border-b border-gray-800 px-4 py-2 flex items-center gap-4">
        {jumpInput ? (
          <div className="flex items-center gap-2">
            <input
              ref={jumpRef}
              type="number"
              value={jumpVal}
              onChange={e => setJumpVal(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') submitJump();
                if (e.key === 'Escape') { setJumpInput(false); setJumpVal(''); }
              }}
              onBlur={submitJump}
              min={1}
              max={products.length}
              autoFocus
              className="w-20 bg-gray-800 border border-blue-600 rounded px-2 py-0.5 text-white text-sm focus:outline-none"
            />
            <span className="text-gray-500 text-sm">/ {products.length}</span>
          </div>
        ) : (
          <button
            onClick={() => { setJumpInput(true); setJumpVal(String(idx + 1)); }}
            className="text-gray-400 text-sm font-mono hover:text-white transition-colors"
            title="Click to jump to product"
          >
            {idx + 1} / {products.length}
          </button>
        )}

        <div className="flex-1 h-1 bg-gray-800 rounded-full">
          <div
            className="h-1 bg-blue-500 rounded-full transition-all duration-200"
            style={{ width: `${((idx + 1) / products.length) * 100}%` }}
          />
        </div>

        <span className="text-gray-600 text-xs">{totalTagged} tagged total</span>

        <button
          onClick={onExport}
          className="bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
        >
          Export
        </button>
      </div>

      {/* Key-value pairs */}
      <div className="shrink-0 bg-gray-900/70 border-b border-gray-800/60 px-4 py-2">
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 items-baseline">
          {visibleKv.map(([k, v]) => (
            <span key={k} className="text-xs">
              <span className="text-gray-600">{k}:</span>{' '}
              <span className="text-gray-300">{v.length > 60 ? v.slice(0, 60) + '…' : v}</span>
            </span>
          ))}
          {kvEntries.length > 8 && (
            <button
              onClick={() => setShowAllKv(s => !s)}
              className="text-xs text-blue-500 hover:text-blue-400 transition-colors"
            >
              {showAllKv ? 'less' : `+${kvEntries.length - 8} more`}
            </button>
          )}
        </div>
      </div>

      {/* Image grid */}
      <div className="flex-1 overflow-auto p-3">
        {product.images.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-700 gap-3">
            <span className="text-4xl">🖼</span>
            <p>No images found for this product</p>
            <p className="text-sm">Press <kbd className="bg-gray-800 px-2 py-0.5 rounded text-gray-400">Enter</kbd> to continue</p>
          </div>
        ) : (
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))' }}
          >
            {product.images.map((img, imgIdx) => {
              const isSel = selected.has(imgIdx);
              const tagId = productTagMap[imgIdx];
              const tag = tags.find(t => t.id === tagId);
              return (
                <div
                  key={`${idx}-${imgIdx}`}
                  onClick={(e) => handleImageClick(imgIdx, e)}
                  className="relative cursor-pointer rounded-xl overflow-hidden aspect-square select-none"
                  style={{
                    boxShadow: isSel
                      ? '0 0 0 3px #3b82f6, 0 0 0 5px rgba(59,130,246,0.3)'
                      : tag
                      ? `0 0 0 3px ${tag.color}`
                      : '0 0 0 1px rgba(255,255,255,0.06)',
                  }}
                >
                  <img
                    src={img.url}
                    alt=""
                    className="w-full h-full object-cover"
                    draggable={false}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling.style.display = 'flex';
                    }}
                  />
                  <div
                    className="absolute inset-0 items-center justify-center bg-gray-800 text-gray-600 text-xs flex-col gap-1"
                    style={{ display: 'none' }}
                  >
                    <span>⚠️</span>
                    <span>Failed to load</span>
                  </div>

                  {/* Tag label */}
                  {tag && (
                    <div
                      className="absolute bottom-0 left-0 right-0 py-1 px-2 text-xs font-semibold text-white text-center"
                      style={{ background: tag.color + 'cc' }}
                    >
                      {tag.key}: {tag.name}
                    </div>
                  )}

                  {/* Selection checkmark */}
                  {isSel && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}

                  {/* Image index */}
                  <div className="absolute top-1.5 left-1.5 bg-black/50 text-gray-400 text-xs px-1.5 py-0.5 rounded-md font-mono">
                    {imgIdx + 1}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom toolbar */}
      <div className="shrink-0 bg-gray-900 border-t border-gray-800 px-4 py-2.5">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Mode / selection status */}
          {singleTagMode ? (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: tags[0].color + '33', color: tags[0].color }}
            >
              Click to tag
            </span>
          ) : (
            <span className="text-sm min-w-[90px]">
              {selected.size > 0 ? (
                <span className="text-blue-400 font-medium">{selected.size} selected</span>
              ) : (
                <span className="text-gray-600">Nothing selected</span>
              )}
            </span>
          )}

          <div className="w-px h-4 bg-gray-700" />

          {/* Tag buttons */}
          <div className="flex gap-1.5 flex-wrap flex-1">
            {tags.map(tag => (
              <button
                key={tag.id}
                onClick={() => applyTagById(tag.id)}
                disabled={selected.size === 0}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-white disabled:opacity-40 transition-opacity"
                style={{ background: tag.color }}
                title={`Key ${tag.key}`}
              >
                <span className="font-mono font-bold opacity-75">[{tag.key}]</span>
                {tag.name}
              </button>
            ))}
            {selected.size > 0 && (
              <button
                onClick={clearSelected}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
              >
                <span className="font-mono opacity-75">[0]</span> Clear
              </button>
            )}
          </div>

          <div className="w-px h-4 bg-gray-700" />

          {/* Status */}
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {taggedCount}/{product.images.length} tagged
          </span>

          <div className="w-px h-4 bg-gray-700" />

          {/* Hint bar */}
          <div className="flex gap-3 text-xs text-gray-500">
            {singleTagMode ? (
              <>
                <span><kbd className="bg-gray-700 text-gray-200 px-1 py-0.5 rounded">Click</kbd> tag/untag</span>
                <span><kbd className="bg-gray-700 text-gray-200 px-1 py-0.5 rounded">Shift+Click</kbd> range tag</span>
              </>
            ) : (
              <>
                <span><kbd className="bg-gray-700 text-gray-200 px-1 py-0.5 rounded">Click</kbd> toggle</span>
                <span><kbd className="bg-gray-700 text-gray-200 px-1 py-0.5 rounded">Shift+Click</kbd> range</span>
                <span><kbd className="bg-gray-700 text-gray-200 px-1 py-0.5 rounded">Ctrl+A</kbd> all</span>
                <span><kbd className="bg-gray-700 text-gray-200 px-1 py-0.5 rounded">Esc</kbd> deselect</span>
              </>
            )}
            <span><kbd className="bg-gray-700 text-gray-200 px-1 py-0.5 rounded">0</kbd> clear tags</span>
            <span><kbd className="bg-gray-700 text-gray-200 px-1 py-0.5 rounded">Space</kbd> next</span>
            <span><kbd className="bg-gray-700 text-gray-200 px-1 py-0.5 rounded">⌫</kbd> prev</span>
          </div>
        </div>
      </div>
    </div>
  );
}
