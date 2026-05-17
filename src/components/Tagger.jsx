import { useState, useEffect, useRef, useMemo } from 'react';
import ScrollView from './ScrollView';
import FilterModal from './FilterModal';

export default function Tagger({ products, tags, tagMap, setTagMap, onVisit, onExport }) {
  const [idx, setIdx] = useState(0);
  const [lastClicked, setLastClicked] = useState(null);
  const [showAllKv, setShowAllKv] = useState(false);
  const [jumpInput, setJumpInput] = useState(false);
  const [jumpVal, setJumpVal] = useState('');
  const [scrollMode, setScrollMode] = useState(false);
  const [activeTagId, setActiveTagId] = useState(() => tags[0]?.id ?? null);
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({});
  const jumpRef = useRef();

  const columnUniqueValues = useMemo(() => {
    const map = {};
    products.forEach(p => {
      Object.entries(p.keyValues).forEach(([col, val]) => {
        if (!map[col]) map[col] = new Set();
        if (val) map[col].add(val);
      });
    });
    return Object.fromEntries(
      Object.entries(map).map(([col, set]) => [
        col,
        [...set].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
      ])
    );
  }, [products]);

  const filteredProducts = useMemo(() => {
    const active = Object.entries(filters).filter(([, v]) => v !== null && v !== undefined);
    if (active.length === 0) return products;
    return products.filter(p =>
      active.every(([col, vals]) => vals.has(p.keyValues[col] ?? ''))
    );
  }, [products, filters]);

  // Reset idx when filter shrinks the list
  useEffect(() => {
    if (idx >= filteredProducts.length && filteredProducts.length > 0) {
      setIdx(0);
      setLastClicked(null);
    }
  }, [filteredProducts.length]);

  const filterActive = Object.keys(filters).length > 0;

  const stateRef = useRef({});
  stateRef.current = { idx, lastClicked, products: filteredProducts, tags, tagMap, scrollMode, activeTagId };

  useEffect(() => {
    if (filteredProducts[idx]) onVisit(filteredProducts[idx].id);
  }, [idx, filteredProducts]);

  const preloadRef = useRef([]);
  useEffect(() => {
    preloadRef.current = [];
    for (let offset = 1; offset <= 2; offset++) {
      const next = filteredProducts[idx + offset];
      if (!next) break;
      next.images.forEach(img => {
        const el = new Image();
        el.src = img.url;
        preloadRef.current.push(el);
      });
    }
  }, [idx, filteredProducts]);

  const product = filteredProducts[idx];
  if (!product) return null;
  const productTagMap = tagMap[product.id] || {};
  const taggedCount = Object.keys(productTagMap).length;
  const totalTagged = Object.values(tagMap).reduce((s, m) => s + Object.keys(m).length, 0);
  const filteredTotal = filteredProducts.length;

  const clearProductTags = () => {
    const pid = stateRef.current.products[stateRef.current.idx].id;
    setTagMap(prev => ({ ...prev, [pid]: {} }));
  };

  const goNext = () => {
    const { idx, products } = stateRef.current;
    if (idx < products.length - 1) {
      setIdx(i => i + 1);
      setLastClicked(null);
      setShowAllKv(false);
    }
  };

  const goPrev = () => {
    const { idx } = stateRef.current;
    if (idx > 0) {
      setIdx(i => i - 1);
      setLastClicked(null);
      setShowAllKv(false);
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if (jumpInput) return;
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON') return;

      const { tags, scrollMode } = stateRef.current;
      const key = e.key;

      if (key >= '1' && key <= '9') {
        const t = tags[parseInt(key) - 1];
        if (t) setActiveTagId(t.id);
        return;
      }

      if (scrollMode) return;

      if (key === '0' || key === 'Delete') {
        clearProductTags();
        return;
      }
      if (key === 'Escape') {
        setLastClicked(null);
        return;
      }
      if ((key === 'Enter' || key === ' ') && !e.shiftKey) {
        e.preventDefault();
        goNext();
        return;
      }
      if (key === 'Backspace' || key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
        return;
      }
      if (key === 'ArrowRight') {
        e.preventDefault();
        goNext();
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [jumpInput, scrollMode]);

  const handleImageClick = (imgIdx, e) => {
    e.preventDefault();
    const { activeTagId, lastClicked } = stateRef.current;
    if (!activeTagId) return;
    const pid = filteredProducts[idx].id;

    if (e.shiftKey && lastClicked !== null) {
      const lo = Math.min(lastClicked, imgIdx);
      const hi = Math.max(lastClicked, imgIdx);
      setTagMap(prev => {
        const m = { ...(prev[pid] || {}) };
        for (let i = lo; i <= hi; i++) m[i] = activeTagId;
        return { ...prev, [pid]: m };
      });
    } else {
      setTagMap(prev => {
        const m = { ...(prev[pid] || {}) };
        m[imgIdx] === activeTagId ? delete m[imgIdx] : (m[imgIdx] = activeTagId);
        return { ...prev, [pid]: m };
      });
    }
    setLastClicked(imgIdx);
  };

  const submitJump = () => {
    const n = parseInt(jumpVal);
    if (!isNaN(n) && n >= 1 && n <= filteredTotal) {
      setIdx(n - 1);
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
              max={filteredTotal}
              autoFocus
              className="w-20 bg-gray-800 border border-blue-600 rounded px-2 py-0.5 text-white text-sm focus:outline-none"
            />
            <span className="text-gray-500 text-sm">/ {filteredTotal}</span>
          </div>
        ) : (
          <button
            onClick={() => { setJumpInput(true); setJumpVal(String(idx + 1)); }}
            className="text-gray-400 text-sm font-mono hover:text-white transition-colors"
            title="Click to jump to product"
          >
            {idx + 1} / {filteredTotal}
            {filterActive && (
              <span className="ml-1 text-blue-400 text-xs">of {products.length}</span>
            )}
          </button>
        )}

        <div className="flex-1 h-1 bg-gray-800 rounded-full">
          <div
            className="h-1 bg-blue-500 rounded-full transition-all duration-200"
            style={{ width: `${filteredTotal > 0 ? ((idx + 1) / filteredTotal) * 100 : 0}%` }}
          />
        </div>

        <button
          onClick={() => setShowFilter(true)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
            filterActive
              ? 'bg-blue-600 hover:bg-blue-500 text-white'
              : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
          }`}
          title="Filter products"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 2.5h10M3 6h6M5 9.5h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Filter
          {filterActive && (
            <span className="bg-white/20 rounded px-1 text-[10px]">{Object.keys(filters).length}</span>
          )}
        </button>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <span className="text-xs text-gray-500">Scroll</span>
          <div
            onClick={() => setScrollMode(s => !s)}
            className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${scrollMode ? 'bg-blue-600' : 'bg-gray-700'}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${scrollMode ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </div>
        </label>

        <span className="text-gray-600 text-xs">{totalTagged} tagged total</span>

        <button
          onClick={onExport}
          className="bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
        >
          Export
        </button>
      </div>

      {/* Key-value pairs — card mode only */}
      {!scrollMode && (
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
      )}

      {/* Image area — scroll or card mode */}
      {scrollMode ? (
        <ScrollView
          products={filteredProducts}
          tags={tags}
          tagMap={tagMap}
          activeTagId={activeTagId}
          initialIndex={idx}
          onCenterProduct={(productIdx) => {
            setIdx(productIdx);
            onVisit(products[productIdx].id);
          }}
          onImageTag={(productId, imgIdx) => {
            setTagMap(prev => {
              const m = { ...(prev[productId] || {}) };
              m[imgIdx] === activeTagId ? delete m[imgIdx] : (m[imgIdx] = activeTagId);
              return { ...prev, [productId]: m };
            });
          }}
        />
      ) : (
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
                const tagId = productTagMap[imgIdx];
                const tag = tags.find(t => t.id === tagId);
                const isActiveTag = tagId === activeTagId;
                return (
                  <div
                    key={`${idx}-${imgIdx}`}
                    onClick={(e) => handleImageClick(imgIdx, e)}
                    className="relative cursor-pointer rounded-xl overflow-hidden aspect-square select-none"
                    style={{
                      boxShadow: tag
                        ? `0 0 0 3px ${tag.color}${isActiveTag ? '' : '99'}`
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

                    {tag && (
                      <div
                        className="absolute bottom-0 left-0 right-0 py-1 px-2 text-xs font-semibold text-white text-center"
                        style={{ background: tag.color + 'cc' }}
                      >
                        {tag.key}: {tag.name}
                      </div>
                    )}

                    <div className="absolute top-1.5 left-1.5 bg-black/50 text-gray-400 text-xs px-1.5 py-0.5 rounded-md font-mono">
                      {imgIdx + 1}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {showFilter && (
        <FilterModal
          columnUniqueValues={columnUniqueValues}
          products={products}
          filters={filters}
          onApply={(applied) => {
            setFilters(applied);
            setIdx(0);
            setLastClicked(null);
            setShowFilter(false);
          }}
          onClose={() => setShowFilter(false)}
        />
      )}

      {/* Bottom toolbar — unified active-tag pattern for both modes */}
      <div className="shrink-0 bg-gray-900 border-t border-gray-800 px-4 py-2.5">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-gray-500">Active tag:</span>
          {tags.map(tag => (
            <button
              key={tag.id}
              onClick={() => setActiveTagId(tag.id)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-white transition-all"
              style={{
                background: tag.color,
                opacity: activeTagId === tag.id ? 1 : 0.4,
                boxShadow: activeTagId === tag.id ? '0 0 0 2px white' : 'none',
              }}
              title={`Key ${tag.key}`}
            >
              <span className="font-mono font-bold opacity-75">[{tag.key}]</span>
              {tag.name}
            </button>
          ))}

          <div className="w-px h-4 bg-gray-700" />

          {!scrollMode && (
            <>
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {taggedCount}/{product.images.length} tagged
              </span>
              <div className="w-px h-4 bg-gray-700" />
            </>
          )}

          <div className="flex gap-3 text-xs text-gray-500 ml-auto">
            <span><kbd className="bg-gray-700 text-gray-200 px-1 py-0.5 rounded">Click</kbd> tag/untag</span>
            <span><kbd className="bg-gray-700 text-gray-200 px-1 py-0.5 rounded">Shift+Click</kbd> range</span>
            {!scrollMode && (
              <>
                <span><kbd className="bg-gray-700 text-gray-200 px-1 py-0.5 rounded">0</kbd> clear</span>
                <span><kbd className="bg-gray-700 text-gray-200 px-1 py-0.5 rounded">Space</kbd> / <kbd className="bg-gray-700 text-gray-200 px-1 py-0.5 rounded">→</kbd> next</span>
                <span><kbd className="bg-gray-700 text-gray-200 px-1 py-0.5 rounded">⌫</kbd> / <kbd className="bg-gray-700 text-gray-200 px-1 py-0.5 rounded">←</kbd> prev</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
