import React, { useState } from 'react';

interface DynamicTextProps {
  value: string | number;
  className?: string;
  thresholdReduce?: number; // character length to reduce font size
  thresholdMarquee?: number; // character length to trigger marquee
}

export default function DynamicText({
  value,
  className = '',
  thresholdReduce = 10,
  thresholdMarquee = 16
}: DynamicTextProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const textStr = String(value ?? '');
  const len = textStr.length;

  const handleTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowTooltip(true);
    setTimeout(() => setShowTooltip(false), 4000);
  };

  if (len > thresholdMarquee) {
    return (
      <div 
        onClick={handleTap}
        className="relative marquee-container cursor-pointer select-none py-0.5 max-w-full w-full"
        title={textStr}
      >
        <div className="flex animate-marquee">
          <span className={`${className} pr-8 font-extrabold whitespace-nowrap shrink-0`}>{textStr}</span>
          <span className={`${className} pr-8 font-extrabold whitespace-nowrap shrink-0`}>{textStr}</span>
        </div>
        {showTooltip && (
          <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-[11px] font-black rounded-lg shadow-2xl uppercase tracking-wider whitespace-nowrap border border-slate-800">
            {textStr}
          </div>
        )}
      </div>
    );
  }

  // Determine reduced font style
  let computedClass = className;
  if (len > thresholdReduce) {
    if (className.includes('text-6xl')) {
      computedClass = className.replace('text-6xl', 'text-4xl');
    } else if (className.includes('text-5xl')) {
      computedClass = className.replace('text-5xl', 'text-3xl');
    } else if (className.includes('text-4xl')) {
      computedClass = className.replace('text-4xl', 'text-2xl');
    } else if (className.includes('text-3xl')) {
      computedClass = className.replace('text-3xl', 'text-xl');
    } else if (className.includes('text-2xl')) {
      computedClass = className.replace('text-2xl', 'text-lg');
    } else if (className.includes('text-xl')) {
      computedClass = className.replace('text-xl', 'text-base');
    } else if (className.includes('text-lg')) {
      computedClass = className.replace('text-lg', 'text-sm');
    } else {
      computedClass = `${className} text-xs sm:text-sm`;
    }
  }

  return (
    <div 
      onClick={handleTap} 
      className="relative inline-block max-w-full truncate cursor-pointer select-none"
      title={textStr}
    >
      <span className={`${computedClass} font-semibold truncate block max-w-full`}>{textStr}</span>
      {showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-[11px] font-black rounded-lg shadow-2xl uppercase tracking-wider whitespace-nowrap border border-slate-800">
          {textStr}
        </div>
      )}
    </div>
  );
}
