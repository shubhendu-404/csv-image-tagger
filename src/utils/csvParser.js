import Papa from 'papaparse';

const IMAGE_URL_RE = /^https?:\/\/\S+\.(?:jpg|jpeg|png|gif|webp|avif|svg)(\?\S*)?$/i;

export const isImageUrl = (val) =>
  typeof val === 'string' && IMAGE_URL_RE.test(val.trim());

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
