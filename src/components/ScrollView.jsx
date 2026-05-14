import { useRef, useEffect, useState, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import ScrollProductRow from './ScrollProductRow';

const EMPTY_TAG_MAP = {};
const PRELOAD_AHEAD = 5;

export default function ScrollView({ products, tags, tagMap, activeTagId, onImageTag, onCenterProduct, initialIndex = 0 }) {
  const scrollRef = useRef(null);
  const [columns, setColumns] = useState(4);
  const preloadedRef = useRef(new Set());
  const onCenterProductRef = useRef(onCenterProduct);
  onCenterProductRef.current = onCenterProduct;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setColumns(Math.max(1, Math.floor(entry.contentRect.width / 185)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const estimateSize = (index) => {
    const HEADER = 52;
    const CELL = 185;
    const PADDING = 24;
    const count = products[index].images.length;
    if (count === 0) return HEADER + PADDING + 32;
    return HEADER + PADDING + Math.ceil(count / columns) * CELL;
  };

  const virtualizer = useVirtualizer({
    count: products.length,
    getScrollElement: () => scrollRef.current,
    estimateSize,
    overscan: 2,
    measureElement: (el) => el?.getBoundingClientRect().height ?? 0,
  });

  useEffect(() => { virtualizer.measure(); }, [columns]);

  // Scroll to card-mode position on first mount
  useEffect(() => {
    if (initialIndex > 0) virtualizer.scrollToIndex(initialIndex, { align: 'start' });
  }, []);

  // Track centered product as user scrolls; only fires when product index actually changes
  const lastCenteredRef = useRef(-1);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const centerY = el.scrollTop + el.clientHeight / 2;
      const items = virtualizer.getVirtualItems();
      const centered = items.find(v => v.start <= centerY && v.end > centerY) ?? items[0];
      if (centered && centered.index !== lastCenteredRef.current) {
        lastCenteredRef.current = centered.index;
        onCenterProductRef.current?.(centered.index);
      }
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    // Fire once on mount so initial position is reported
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const vItems = virtualizer.getVirtualItems();
  const minRendered = vItems[0]?.index ?? 0;
  const maxRendered = vItems[vItems.length - 1]?.index ?? 0;

  // Debounced preload for products beyond rendered range
  useEffect(() => {
    const timer = setTimeout(() => {
      const toPreload = [];
      for (let i = Math.max(0, minRendered - PRELOAD_AHEAD); i < minRendered; i++) toPreload.push(i);
      for (let i = maxRendered + 1; i <= Math.min(products.length - 1, maxRendered + PRELOAD_AHEAD); i++) toPreload.push(i);
      for (const idx of toPreload) {
        const id = products[idx].id;
        if (preloadedRef.current.has(id)) continue;
        preloadedRef.current.add(id);
        products[idx].images.forEach(img => { new Image().src = img.url; });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [minRendered, maxRendered]);

  const handleImageTag = useCallback(onImageTag, [onImageTag]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-auto"
      style={{ overscrollBehavior: 'contain', willChange: 'scroll-position' }}
    >
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {vItems.map(vItem => {
          const product = products[vItem.index];
          return (
            <div
              key={vItem.key}
              data-index={vItem.index}
              ref={el => virtualizer.measureElement(el)}
              style={{
                position: 'absolute',
                top: 0,
                transform: `translateY(${vItem.start}px)`,
                width: '100%',
              }}
            >
              <ScrollProductRow
                product={product}
                productIdx={vItem.index}
                tags={tags}
                productTagMap={tagMap[product.id] ?? EMPTY_TAG_MAP}
                activeTagId={activeTagId}
                onImageTag={handleImageTag}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
