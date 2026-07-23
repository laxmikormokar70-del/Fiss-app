const fs = require('fs');
let content = fs.readFileSync('src/components/StudentsTab.tsx', 'utf8');

const newCard = `
            <motion.div
              key={student.id}
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[16px] border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between hover:border-blue-200 hover:shadow-md transition-all duration-200"
            >
              <div className="p-4 flex gap-4 items-start relative">
                <div className="h-16 w-16 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg overflow-hidden shrink-0 shadow-md shadow-blue-50">
                  {student.photoUrl ? (
                    <img src={student.photoUrl} alt={student.name} className="h-full w-full object-cover" />
                  ) : (
                    <span>{student.name.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div className="space-y-1 flex-1 pr-8">
                  <h3 className="text-[18px] font-bold text-slate-900 font-display line-clamp-1">{student.name}</h3>
                  <div className="flex flex-wrap gap-2 text-[13px] text-slate-500 font-medium">
                    <span className="bg-slate-100 px-2 py-0.5 rounded-md">Roll: {student.rollNumber}</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded-md">Class: {student.class}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[20px] font-bold text-green-600">\${student.monthlyFee}</span>
                    {/* Paid/Unpaid Badge */}
                    {(() => {
                      if (!payments) return null;
                      const d = new Date();
                      const currentMonthStr = \`\${d.getFullYear()}-\${String(d.getMonth() + 1).padStart(2, '0')}\`;
                      const thisMonthPayment = payments.find(p => p.studentId === student.id && p.month === currentMonthStr);
                      const isPaid = thisMonthPayment && thisMonthPayment.status === 'Paid';
                      return (
                        <span className={\`text-[12px] font-bold px-2.5 py-1 rounded-full \${isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}\`}>
                          {isPaid ? 'PAID' : 'DUE'}
                        </span>
                      );
                    })()}
                  </div>
                </div>
                
                <div className="absolute top-4 right-4 flex flex-col gap-1">
                  <button onClick={() => handleEditClick(student)} className="p-1.5 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 transition-all cursor-pointer">
                    <Edit className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
              
              <div className="bg-slate-50/75 border-t border-slate-100 p-3 flex items-center justify-between gap-2">
                <div className="flex gap-2">
                  <a href={\`tel:\${student.mobileNumber}\`} className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-all font-semibold text-[13px]">
                    <Phone className="h-4 w-4 text-blue-500" /> Call
                  </a>
                  <a href={\`https://wa.me/\${student.mobileNumber}\`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 bg-[#25D366] text-white px-3 py-1.5 rounded-xl hover:bg-[#20b958] transition-all font-semibold text-[13px]">
                    WhatsApp
                  </a>
                </div>
                <div className="text-[11px] text-slate-400 text-right pr-2">
                   {(() => {
                      if (!payments) return 'No payments';
                      const studentPayments = payments.filter(p => p.studentId === student.id).sort((a,b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
                      if (studentPayments.length > 0) {
                        return <>Last:<br/>{new Date(studentPayments[0].paymentDate).toLocaleDateString()}</>;
                      }
                      return 'No payments';
                    })()}
                </div>
              </div>
            </motion.div>
`;

const startIndex = content.indexOf('<motion.div\n              key={student.id}');
const endIndexStr = '              </div>\n            </motion.div>';
const endIndex = content.indexOf(endIndexStr, startIndex) + endIndexStr.length;

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + newCard + content.substring(endIndex);
  fs.writeFileSync('src/components/StudentsTab.tsx', content);
} else {
  console.log("Could not find the block to replace");
}
