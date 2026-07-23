const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

app = app.replace(
  /<h2 className="text-sm font-bold text-slate-900 font-display line-clamp-1">.*?<\/h2>/,
  '<h2 className="text-[28px] font-bold text-slate-900 font-display line-clamp-1">\n                {teacherProfile?.schoolName || \'Fee Management\'}\n              </h2>'
);

// Mobile bottom nav should have 48dp touch targets and proper spacing
app = app.replace(
  /<nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex justify-around py-2 z-40 no-print shadow-lg pb-\[env\(safe-area-inset-bottom\)\]">/,
  '<nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex justify-around py-2 z-40 no-print shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-[calc(env(safe-area-inset-bottom)+8px)]">'
);

app = app.replace(
  /<span className={`text-\[9px\] font-bold \${isActive \? 'text-blue-700' : 'text-slate-400'}`}>/g,
  '<span className={`text-[13px] font-bold mt-1 ${isActive ? \'text-blue-700\' : \'text-slate-400\'}`}>'
);

app = app.replace(
  /className="flex flex-col items-center gap-1 px-3 py-1 cursor-pointer"/g,
  'className="flex flex-col items-center justify-center min-h-[48px] min-w-[48px] px-2 py-1 cursor-pointer"'
);

fs.writeFileSync('src/App.tsx', app);
