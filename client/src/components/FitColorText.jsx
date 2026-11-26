import React from 'react';

/**
 * Lamba colour naam (CHARCOAL, LIGHT GREY...) cell se bahar na nikle.
 * Pure CSS: colour cell ko container banate hain aur font ko cell ki
 * width (cqw) ke hisaab se set karte hain — window chhoti/badi hone par
 * khud adjust hota rehta hai, aur print mein bhi wahi rehta hai.
 * Thora chhota font = word poora ek line mein cell ke andar.
 */
export default function FitColorText({ text, maxSize = 13, align = 'center' }) {
  const value = String(text || '');
  const len = Math.max(value.length, 1);
  // Helvetica/Arial Black uppercase ka average advance ~0.70em per character;
  // 6px cell padding ke liye jagah chhodte hain.
  const k = (0.7 * len).toFixed(2);

  return (
    <div
      className={`w-full flex items-center overflow-hidden px-0.5 ${align === 'left' ? 'justify-start' : 'justify-center'}`}
    >
      <span
        className="font-black leading-none whitespace-nowrap"
        style={{ fontSize: `clamp(5px, calc((100cqw - 6px) / ${k}), ${maxSize}px)` }}
      >
        {value}
      </span>
    </div>
  );
}
