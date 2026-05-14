import Papa from 'papaparse';

export const isImageUrl = (val) => {
  if (typeof val !== 'string') return false;
  try {
    const url = new URL(val.trim());
    return /\.(?:jpg|jpeg|png|gif|webp|avif|svg)$/i.test(url.pathname);
  } catch {
    return false;
  }
};

export function parseCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data, meta, errors }) => {
        if (!data.length) {
          reject(new Error(errors[0]?.message || 'No data found'));
          return;
        }
        const products = data.map((row, idx) => {
          const images = [];
          const keyValues = {};
          for (const [col, val] of Object.entries(row)) {
            const v = (val || '').trim();
            if (!v) continue;
            if (isImageUrl(v)) {
              images.push({ url: v, column: col });
            } else {
              keyValues[col] = v;
            }
          }
          return { id: idx, row, images, keyValues };
        });
        resolve({ products, fields: meta.fields || [] });
      },
      error: reject,
    });
  });
}
