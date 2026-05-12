import { useState } from 'react';

const PALETTE = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#3b82f6', '#a855f7', '#ec4899', '#14b8a6', '#f59e0b',
];

const PRESETS = ['Remove', 'Keep', 'Review', 'Blurry', 'Duplicate'];

export default function TagSetup({ tags, setTags, productCount, onStart, onBack }) {
  const [name, setName] = useState('');

  const addTag = (n = name.trim()) => {
    if (!n || tags.length >= 9) return;
    setTags(prev => [
      ...prev,
      { id: Date.now(), name: n, color: PALETTE[prev.length], key: prev.length + 1 },
    ]);
    setName('');
  };

  const removeTag = (id) => {
    setTags(prev =>
      prev.filter(t => t.id !== id).map((t, i) => ({ ...t, key: i + 1 }))
    );
  };

  return (
    <div className="h-screen bg-gray-950 overflow-auto p-8 flex flex-col items-center">
      <div className="w-full max-w-md">
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-gray-300 mb-6 text-sm transition-colors"
        >
          ← Back
        </button>

        <h2 className="text-2xl font-bold text-white mb-1">Setup Tags</h2>
        <p className="text-gray-500 text-sm mb-6">
          {productCount} products · Keys 1–9 apply tags to selected images
        </p>

        <div className="space-y-1.5 mb-6 min-h-[60px]">
          {tags.length === 0 && (
            <p className="text-gray-700 text-sm text-center py-6">Add at least one tag to start</p>
          )}
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center gap-3 bg-gray-900 rounded-xl px-4 py-3 group"
            >
              <span className="text-gray-600 font-mono text-xs w-4 text-center">{tag.key}</span>
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: tag.color }} />
              <span className="text-white flex-1 text-sm">{tag.name}</span>
              <button
                onClick={() => removeTag(tag.id)}
                className="text-gray-700 hover:text-red-400 text-lg leading-none opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {tags.length < 9 && (
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTag()}
              placeholder="Tag name..."
              maxLength={20}
              autoFocus
              className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-white placeholder-gray-700 text-sm focus:outline-none focus:border-blue-600"
            />
            <button
              onClick={() => addTag()}
              disabled={!name.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              Add
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-8">
          {PRESETS.filter(p => !tags.some(t => t.name === p)).map(p => (
            <button
              key={p}
              onClick={() => addTag(p)}
              disabled={tags.length >= 9}
              className="text-xs bg-gray-900 hover:bg-gray-800 disabled:opacity-30 text-gray-400 px-3 py-1.5 rounded-full border border-gray-800 transition-colors"
            >
              + {p}
            </button>
          ))}
        </div>

        <button
          onClick={onStart}
          disabled={tags.length === 0}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white py-3 rounded-xl font-semibold transition-colors"
        >
          Start Tagging →
        </button>
      </div>
    </div>
  );
}
