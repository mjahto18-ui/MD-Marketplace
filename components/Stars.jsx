'use client';
import { Star } from 'lucide-react';

export default function Stars({ rating = 0, size = 14, showValue = true, count }) {
  const r = parseFloat(rating) || 0;
  let full = Math.floor(r);
  let half = false;
  const dec = r - full;
  
  if (dec >= 0.75) full += 1;
  else if (dec >= 0.25) half = true;
  
  const empty = Math.max(0, 5 - full - (half ? 1 : 0));

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center">
        {[...Array(full)].map((_, i) => (
          <Star key={`f-${i}`} size={size} className="fill-yellow-400 text-yellow-400" />
        ))}
        {half && (
          <div className="relative" style={{ width: size, height: size }}>
            <Star size={size} className="absolute text-white/20" />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star size={size} className="fill-yellow-400 text-yellow-400" />
            </div>
          </div>
        )}
        {[...Array(empty)].map((_, i) => (
          <Star key={`e-${i}`} size={size} className="text-white/20" />
        ))}
      </div>
      {showValue && r > 0 && (
        <span className="text-xs text-yellow-400">
          {r.toFixed(1)} {count !== undefined && <span className="text-white/40">({count})</span>}
        </span>
      )}
    </div>
  );
}
