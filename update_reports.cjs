const fs = require('fs');
let content = fs.readFileSync('src/components/ReportsTab.tsx', 'utf8');

content = content.replace(/bg-white rounded-3xl/g, 'bg-white rounded-[16px]');
content = content.replace(/rounded-2xl/g, 'rounded-[16px]');
content = content.replace(/text-2xl font-bold/g, 'text-[28px] font-bold');
content = content.replace(/text-lg font-bold text-slate-900/g, 'text-[18px] font-bold text-slate-900');
content = content.replace(/text-base font-semibold/g, 'text-[16px] font-semibold');

fs.writeFileSync('src/components/ReportsTab.tsx', content);
