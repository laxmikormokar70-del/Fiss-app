const fs = require('fs');
let content = fs.readFileSync('src/components/StudentsTab.tsx', 'utf8');

if (!content.includes('selectedProfileStudent')) {
  content = content.replace(
    'const [showAddForm, setShowAddForm] = useState(false);',
    'const [showAddForm, setShowAddForm] = useState(false);\n  const [selectedProfileStudent, setSelectedProfileStudent] = useState<Student | null>(null);'
  );
  
  // Make the card clickable to open profile
  content = content.replace(
    /className="bg-white rounded-\[16px\] border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between hover:border-blue-200 hover:shadow-md transition-all duration-200"/,
    'className="bg-white rounded-[16px] border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between hover:border-blue-200 hover:shadow-md transition-all duration-200 cursor-pointer" onClick={() => setSelectedProfileStudent(student)}'
  );
  
  // Prevent edit button from triggering card click
  content = content.replace(
    /onClick=\{\(\) => handleEditClick\(student\)\}/,
    'onClick={(e) => { e.stopPropagation(); handleEditClick(student); }}'
  );
  
  // Prevent phone buttons from triggering card click
  content = content.replace(
    /<a href=\{\`tel:\$\{student.mobileNumber\}\`\}/,
    '<a href={`tel:${student.mobileNumber}`} onClick={(e) => e.stopPropagation()}'
  );
  
  content = content.replace(
    /<a href=\{\`https:\/\/wa.me\/\$\{student.mobileNumber\}\`\}/,
    '<a href={`https://wa.me/${student.mobileNumber}`} onClick={(e) => e.stopPropagation()}'
  );
  
  // Add the modal JSX
  const modalJSX = `
      {/* Student Profile Modal */}
      <AnimatePresence>
        {selectedProfileStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setSelectedProfileStudent(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[16px] shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 relative text-center">
                <button 
                  onClick={() => setSelectedProfileStudent(null)}
                  className="absolute top-4 right-4 p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="h-24 w-24 mx-auto bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-3xl overflow-hidden shadow-lg shadow-blue-100 mb-4">
                  {selectedProfileStudent.photoUrl ? (
                    <img src={selectedProfileStudent.photoUrl} alt={selectedProfileStudent.name} className="h-full w-full object-cover" />
                  ) : (
                    <span>{selectedProfileStudent.name.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <h2 className="text-[24px] font-semibold text-slate-900 font-display">{selectedProfileStudent.name}</h2>
                <p className="text-[15px] text-slate-500 font-medium">Roll {selectedProfileStudent.rollNumber} &bull; Class {selectedProfileStudent.class}</p>
                <div className="mt-4 flex gap-2 justify-center">
                  <span className={\`text-[13px] font-bold px-3 py-1 rounded-full uppercase \${selectedProfileStudent.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}\`}>
                    {selectedProfileStudent.status}
                  </span>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
                    <span className="text-[13px] text-slate-500 block mb-1">Monthly Fee</span>
                    <span className="text-[20px] font-bold text-slate-900">\${selectedProfileStudent.monthlyFee}</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
                    <span className="text-[13px] text-slate-500 block mb-1">Total Paid</span>
                    <span className="text-[20px] font-bold text-green-600">
                      \${payments?.filter(p => p.studentId === selectedProfileStudent.id && p.status === 'Paid').reduce((sum, p) => sum + Number(p.amountPaid), 0) || 0}
                    </span>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm space-y-3">
                  <h3 className="text-[16px] font-semibold text-slate-800 border-b border-slate-50 pb-2">Full Details</h3>
                  <div className="flex justify-between items-center text-[15px]">
                    <span className="text-slate-500">Guardian Name</span>
                    <span className="font-semibold text-slate-900">{selectedProfileStudent.guardianName || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center text-[15px]">
                    <span className="text-slate-500">Mobile Number</span>
                    <span className="font-semibold text-slate-900">{selectedProfileStudent.mobileNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center text-[15px]">
                    <span className="text-slate-500">Address</span>
                    <span className="font-semibold text-slate-900 line-clamp-1 text-right">{selectedProfileStudent.address || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center text-[15px]">
                    <span className="text-slate-500">Admitted</span>
                    <span className="font-semibold text-slate-900">
                      {selectedProfileStudent.admissionDate ? new Date(selectedProfileStudent.admissionDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm space-y-3">
                  <h3 className="text-[16px] font-semibold text-slate-800 border-b border-slate-50 pb-2">Payment History</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {payments?.filter(p => p.studentId === selectedProfileStudent.id).length === 0 ? (
                      <p className="text-[13px] text-slate-400 text-center py-2">No payments recorded</p>
                    ) : (
                      payments?.filter(p => p.studentId === selectedProfileStudent.id).sort((a,b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()).map(p => (
                        <div key={p.id} className="flex justify-between items-center text-[14px]">
                          <div>
                            <span className="font-medium text-slate-800">{p.month}</span>
                            <span className="text-[11px] text-slate-400 block">{new Date(p.paymentDate).toLocaleDateString()}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-slate-900">\${p.amountPaid}</span>
                            <span className={\`text-[10px] font-bold block \${p.status === 'Paid' ? 'text-green-600' : 'text-red-500'}\`}>{p.status}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-white border-t border-slate-100 flex gap-3">
                <button 
                  onClick={() => {
                    handleEditClick(selectedProfileStudent);
                    setSelectedProfileStudent(null);
                  }}
                  className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[16px] rounded-2xl transition-colors cursor-pointer"
                >
                  Edit Profile
                </button>
                {/* Normally we'd navigate to Fees, but this tab doesn't have the nav function directly. 
                    Wait, let's just make it close for now, or dispatch a custom event. */}
                <button 
                  onClick={() => {
                    // Assuming we can select the nav item
                    document.getElementById('nav-mobile-fees-btn')?.click();
                    document.getElementById('nav-fees-btn')?.click();
                    setSelectedProfileStudent(null);
                  }}
                  className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[16px] rounded-2xl transition-colors shadow-md shadow-blue-200 cursor-pointer"
                >
                  Collect Fee
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
  `;
  
  content = content.replace('      </div>\n    </div>\n  );\n}', '      </div>\n' + modalJSX + '\n    </div>\n  );\n}');
  
  fs.writeFileSync('src/components/StudentsTab.tsx', content);
}
