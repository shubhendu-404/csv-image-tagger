import { memo } from 'react';

const ScrollProductRow = memo(function ScrollProductRow({ product, productIdx, tags, productTagMap, activeTagId, onImageTag }) {
  const title = product.keyValues?.Title || product.keyValues?.title || `Product ${productIdx + 1}`;
  const taggedCount = Object.keys(productTagMap).length;

  return (
    <div
      className="px-3 pt-2 pb-3 border-b border-gray-800/50"
      style={{ contain: 'layout paint' }}
    >
      <div className="flex items-baseline gap-3 mb-2">
        <span className="text-xs font-mono text-gray-600">{productIdx + 1}</span>
        <span className="text-sm text-gray-300 font-medium truncate flex-1">{title}</span>
        <span className="text-xs text-gray-600 shrink-0">
          {taggedCount}/{product.images.length} tagged
        </span>
      </div>

      {product.images.length === 0 ? (
        <div className="text-xs text-gray-700 py-2 px-1">(no images)</div>
      ) : (
        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))' }}>
          {product.images.map((img, imgIdx) => {
            const tagId = productTagMap[imgIdx];
            const tag = tags.find(t => t.id === tagId);
            const isActiveTag = tagId === activeTagId;
            return (
              <div
                key={imgIdx}
                onClick={() => onImageTag(product.id, imgIdx)}
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
                  decoding="async"
                  className="w-full h-full object-cover"
                  draggable={false}
                  onError={e => {
                    console.warn(`[ImageTagger] failed to load: ${img.url}`);
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
  );
});

export default ScrollProductRow;
