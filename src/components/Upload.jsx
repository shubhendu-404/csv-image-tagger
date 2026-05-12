import { useState, useRef } from 'react';
import { parseCSV } from '../utils/csvParser';

export default function Upload({ onUpload }) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef();

  const handle = async (file) => {
    if (!file || !file.name.endsWith('.csv')) {
      setError('Upload a CSV file');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await parseCSV(file);
      if (!data.products.length) throw new Error('No products found');
      const withImages = data.products.filter(p => p.images.length > 0).length;
      if (!withImages) throw new Error('No image URLs detected in CSV');
      onUpload(data);
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-950 p-8">
      <div className="w-full max-w-lg">
        <h1 className="text-3xl font-bold text-white mb-1">Image Tagger</h1>
        <p className="text-gray-500 mb-8 text-sm">
          Upload any product CSV · Images auto-detected from all columns
        </p>

        <div
          className={`border-2 border-dashed rounded-2xl p-20 text-center cursor-pointer transition-all ${
            dragging
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-gray-700 hover:border-gray-500 hover:bg-gray-900/50'
          }`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handle(e.dataTransfer.files[0]);
          }}
        >
          <div className="text-5xl mb-4">📂</div>
          <p className="text-gray-200 font-medium">Drop CSV here or click to browse</p>
          <p className="text-gray-600 text-sm mt-2">Shopify exports, custom exports — any format</p>
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => handle(e.target.files[0])}
          />
        </div>

        {loading && (
          <p className="text-blue-400 mt-4 text-center text-sm animate-pulse">Parsing CSV...</p>
        )}
        {error && (
          <p className="text-red-400 mt-4 text-center text-sm bg-red-950/50 rounded-lg py-2 px-4">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
