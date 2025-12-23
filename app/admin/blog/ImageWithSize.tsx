// app/admin/blog/ImageWithSize.tsx
"use client";

import { useState, useEffect } from 'react';

export default function ImageWithSize({ url }: { url: string | null }) {
  const [sizeKB, setSizeKB] = useState<number | null>(null);

  useEffect(() => {
    if (!url) return;

    fetch(url, { method: 'HEAD' })
      .then(res => {
        const contentLength = res.headers.get('content-length');
        if (contentLength) {
          setSizeKB(Math.round(parseInt(contentLength) / 1024));
        }
      })
      .catch(() => {
        // ignore
      });
  }, [url]);

  if (!url) {
    return (
      <div className="w-16 h-12 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
        Brak
      </div>
    );
  }

  const color = sizeKB === null 
    ? 'bg-gray-500' 
    : sizeKB > 500 
      ? 'bg-red-600' 
      : sizeKB > 200 
        ? 'bg-yellow-600' 
        : 'bg-green-600';

  return (
    <div className="relative w-16">
      <img 
        src={url} 
        alt="" 
        className="w-16 h-12 object-cover rounded"
        loading="lazy"
      />
      {sizeKB !== null && (
        <div className={`absolute -bottom-1 left-0 right-0 ${color} text-white text-[9px] px-1 text-center rounded-b`}>
          {sizeKB} KB
        </div>
      )}
    </div>
  );
}
