import { useState } from 'react';
import Papa from 'papaparse';

function download(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Export({ products, fields, tags, tagMap, onBack }) {
  const [removeTagIds, setRemoveTagIds] = useState(new Set());
  const [extraFields, setExtraFields] = useState(new Set());

  // collect all non-image field names across all products
  const allKvFields = fields.filter(f =>
    products.some(p => p.keyValues[f] !== undefined)
  );

  const toggleField = (f) =>
    setExtraFields(prev => {
      const n = new Set(prev);
      n.has(f) ? n.delete(f) : n.add(f);
      return n;
    });

  const toggleAllFields = () =>
    setExtraFields(extraFields.size === allKvFields.length ? new Set() : new Set(allKvFields));

  const toggleTag = (id) =>
    setRemoveTagIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  // per-tag counts
  const tagCounts = Object.fromEntries(tags.map(t => [t.id, 0]));
  let totalTagged = 0;
  products.forEach(p => {
    Object.values(tagMap[p.id] || {}).forEach(tid => {
      if (tagCounts[tid] !== undefined) tagCounts[tid]++;
      totalTagged++;
    });
  });

  const untaggedTotal = products.reduce(
    (s, p) => s + p.images.filter((_, i) => !(tagMap[p.id] || {})[i]).length,
    0
  );

  const toRemoveCount = tags
    .filter(t => removeTagIds.has(t.id))
    .reduce((s, t) => s + tagCounts[t.id], 0);

  const exportFilteredCSV = () => {
    const rows = products.map(p => {
      const pm = tagMap[p.id] || {};
      const imageCols = p.images.map(img => img.column);
      const remaining = p.images.filter((_, i) => !removeTagIds.has(pm[i]));
      const row = { ...p.row };
      imageCols.forEach((col, i) => {
        row[col] = remaining[i]?.url ?? '';
      });
      return row;
    });
    download(Papa.unparse(rows, { columns: fields }), 'products_filtered.csv');
  };

  const exportURLList = () => {
    const rows = [];
    products.forEach(p => {
      const pm = tagMap[p.id] || {};
      p.images.forEach((img, i) => {
        const tagId = pm[i];
        if (!tagId) return;
        const tag = tags.find(t => t.id === tagId);
        if (!tag) return;
        const extra = {};
        extraFields.forEach(f => { extra[f] = p.row[f] ?? ''; });
        rows.push({
          image_url: img.url,
          tag: tag.name,
          column: img.column,
          product_ref: p.row[fields[0]] ?? p.id,
          ...extra,
        });
      });
    });
    download(Papa.unparse(rows), 'tagged_images.csv');
  };

  return (
    <div className="h-screen bg-gray-950 overflow-auto p-8 flex flex-col items-center">
      <div className="w-full max-w-md">
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-gray-300 mb-6 text-sm transition-colors"
        >
          ← Back to tagger
        </button>

        <h2 className="text-2xl font-bold text-white mb-6">Export</h2>

        {/* Summary */}
        <div className="bg-gray-900 rounded-2xl p-5 mb-5">
          <p className="text-gray-400 text-sm font-medium mb-3 uppercase tracking-wide">Summary</p>
          <div className="space-y-2">
            {tags.map(tag => (
              <div key={tag.id} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: tag.color }} />
                <span className="text-gray-300 text-sm flex-1">{tag.name}</span>
                <span className="text-gray-500 text-sm font-mono tabular-nums">{tagCounts[tag.id]}</span>
              </div>
            ))}
            <div className="flex items-center gap-3 border-t border-gray-800 pt-2">
              <div className="w-2 h-2 rounded-full bg-gray-700 shrink-0" />
              <span className="text-gray-600 text-sm flex-1">Untagged</span>
              <span className="text-gray-600 text-sm font-mono tabular-nums">{untaggedTotal}</span>
            </div>
          </div>
        </div>

        {/* Option 1 */}
        <div className="bg-gray-900 rounded-2xl p-5 mb-4">
          <p className="text-white font-medium mb-1">Filtered CSV</p>
          <p className="text-gray-600 text-xs mb-4">
            Select tags to remove. Image columns cleared and compacted in output CSV.
          </p>
          <div className="space-y-2 mb-4">
            {tags.map(tag => (
              <label key={tag.id} className="flex items-center gap-3 cursor-pointer group">
                <div
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                    removeTagIds.has(tag.id)
                      ? 'border-transparent'
                      : 'border-gray-700'
                  }`}
                  style={removeTagIds.has(tag.id) ? { background: tag.color } : {}}
                  onClick={() => toggleTag(tag.id)}
                >
                  {removeTagIds.has(tag.id) && (
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: tag.color }} />
                <span className="text-gray-300 text-sm flex-1">{tag.name}</span>
                <span className="text-gray-600 text-xs font-mono">{tagCounts[tag.id]} images</span>
              </label>
            ))}
          </div>
          <button
            onClick={exportFilteredCSV}
            disabled={removeTagIds.size === 0}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            {removeTagIds.size > 0
              ? `Download CSV (removes ${toRemoveCount} images)`
              : 'Select tags to remove'}
          </button>
        </div>

        {/* Option 2 */}
        <div className="bg-gray-900 rounded-2xl p-5">
          <p className="text-white font-medium mb-1">Tagged Image URL List</p>
          <p className="text-gray-600 text-xs mb-4">
            All tagged image URLs with tag name, column, and product ref. Optionally include extra product fields.
          </p>

          {/* Always-generated fields */}
          <div className="mb-3">
            <p className="text-gray-600 text-xs mb-1.5">Always generated</p>
            <div className="flex flex-wrap gap-1.5">
              {['image_url', 'tag', 'column', 'product_ref'].map(f => (
                <span key={f} className="text-xs bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full font-mono">
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* Extra field selector */}
          {allKvFields.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-400 text-xs">From your CSV</p>
                <button
                  onClick={toggleAllFields}
                  className="text-xs text-blue-500 hover:text-blue-400 transition-colors"
                >
                  {extraFields.size === allKvFields.length ? 'Deselect all' : 'Select all'}
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto grid grid-cols-2 gap-1">
                {allKvFields.map(f => (
                  <label key={f} className="flex items-center gap-2 cursor-pointer group py-0.5">
                    <div
                      className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        extraFields.has(f)
                          ? 'bg-blue-600 border-blue-600'
                          : 'border-gray-700 group-hover:border-gray-500'
                      }`}
                      onClick={() => toggleField(f)}
                    >
                      {extraFields.has(f) && (
                        <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="text-gray-400 text-xs truncate font-mono">{f}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={exportURLList}
            disabled={totalTagged === 0}
            className="w-full bg-gray-700 hover:bg-gray-600 disabled:opacity-30 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            Download tagged_images.csv ({totalTagged} images
            {extraFields.size > 0 ? ` · +${extraFields.size} fields` : ''})
          </button>
        </div>
      </div>
    </div>
  );
}
