const fs = require('fs');
let code = fs.readFileSync('src/components/AttendanceTab.tsx', 'utf8');

const oldRenderArea = `      <div className="flex-1 w-full bg-white py-2 space-y-3 pb-20">
        {/* 2. CLASS SECTION */}`;

const newRenderArea = `      <div className="flex-1 w-full px-2 sm:px-4 py-2 space-y-3 pb-20 max-w-5xl mx-auto">
        <div className="bg-white rounded-[18px] border border-[#E5E7EB] shadow-sm flex flex-col overflow-hidden h-[calc(100vh-180px)] min-h-[500px]">
          <div className="p-3 bg-white border-b border-[#E5E7EB] shrink-0 space-y-2">
            {/* 2. CLASS SECTION */}`;

// Let's just do a big replace for the structural divs.
