import React, { useState } from 'react';

/**
 * StarRating Component
 * @param {number} rating - Current rating (1-5)
 * @param {boolean} interactive - Whether the user can select a rating
 * @param {function} onChange - Callback when rating changes (used when interactive is true)
 * @param {number} size - Size of stars in pixels (default 24)
 */
export default function StarRating({ rating = 0, interactive = false, onChange, size = 24 }) {
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (val) => {
    if (interactive && onChange) {
      onChange(val);
    }
  };

  const handleMouseEnter = (val) => {
    if (interactive) {
      setHoverRating(val);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0);
    }
  };

  const currentDisplayRating = hoverRating || rating;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => handleClick(star)}
          onMouseEnter={() => handleMouseEnter(star)}
          onMouseLeave={handleMouseLeave}
          className={`transition-all duration-150 inline-block ${
            interactive ? 'cursor-pointer hover:scale-110 active:scale-95' : ''
          }`}
          style={{ width: `${size}px`, height: `${size}px` }}
        >
          <svg
            className={`w-full h-full transition-colors duration-150 ${
              star <= currentDisplayRating
                ? 'text-amber-400 fill-amber-400'
                : 'text-slate-300 fill-none'
            }`}
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.36 1.252.583 1.823l-3.97 2.887a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.887a1 1 0 00-1.175 0l-3.97 2.887c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118l-3.97-2.887c-.777-.571-.378-1.823.582-1.823h4.907a1 1 0 00.95-.69L11.049 2.927z"
            />
          </svg>
        </span>
      ))}
    </div>
  );
}
