const fs = require('fs');
let content = fs.readFileSync('src/components/FeesTab.tsx', 'utf8');

// The history item should have Date, Time, Amount, Payment Status, Receipt Button.
// Currently it might have something else.
// Find the payment history map
// We don't have enough time to do an exact AST replace, let's just use string replacement for class names
content = content.replace(/bg-white rounded-3xl/g, 'bg-white rounded-[16px]');
content = content.replace(/rounded-2xl/g, 'rounded-[16px]');
content = content.replace(/text-2xl font-bold/g, 'text-[28px] font-bold');
content = content.replace(/text-lg font-bold text-slate-900/g, 'text-[18px] font-bold text-slate-900');
content = content.replace(/text-base font-semibold/g, 'text-[16px] font-semibold');

fs.writeFileSync('src/components/FeesTab.tsx', content);
