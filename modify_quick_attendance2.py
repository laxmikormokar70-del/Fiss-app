import re

with open('src/components/AttendanceTab.tsx', 'r') as f:
    code = f.read()

old_quick = r'\{\/\* TAB 1: QUICK ATTENDANCE \(Chat Messenger\) \*\/\}.*?(?=\{\/\* TAB 2:)'

new_quick = """{/* TAB 1: QUICK ATTENDANCE (Chat Messenger) */}
          {activeTab === 'quick' && (
            <motion.div
              key="quick-attendance-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex flex-col h-full bg-slate-50/30 w-full"
            >
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 shadow-sm border border-emerald-100">
                      <Send className="h-5 w-5 ml-0.5" />
                    </div>
                    <p className="text-[12px] font-bold text-slate-600 mt-2">Type roll numbers to mark attendance</p>
                    <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">Enter a single roll number or comma-separated list.</p>
                  </div>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={msg.id}
                      className={`flex flex-col \${msg.sender === 'teacher' ? 'items-end' : 'items-start'}`}
                    >
                      <span className="text-[9px] font-bold text-slate-400 mb-1 px-1">{msg.sender === 'teacher' ? 'You' : 'System'} • {msg.timestamp}</span>
                      <div className={`max-w-[85%] rounded-2xl p-3 text-[12px] border shadow-xs \${
                        msg.sender === 'teacher' 
                          ? 'bg-[#16A34A] text-white border-transparent' 
                          : 'bg-white border-[#E5E7EB] text-slate-700'
                      }`}>
                        {msg.type === 'text' && <span className="font-medium whitespace-pre-wrap">{msg.text}</span>}
                        {msg.type === 'success' && (
                          <div className="flex items-center gap-1.5 font-bold text-[#16A34A]">
                            <CheckCircle2 className="h-4 w-4" />
                            {msg.text}
                          </div>
                        )}
                        {msg.type === 'confirmation' && (
                          <div className="space-y-2 w-full min-w-[200px]">
                            {msg.found && msg.found.length > 0 && (
                              <div className="space-y-1.5">
                                {msg.found.map(f => (
                                  <div key={f.studentId} className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-100">#{f.rollNumber}</span>
                                    <span className="font-bold text-slate-700">{f.name}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {msg.notFound && msg.notFound.length > 0 && (
                              <div className="mt-1 pt-2 border-t border-slate-100">
                                <span className="text-[10px] font-bold text-red-500">Not Found: {msg.notFound.join(', ')}</span>
                              </div>
                            )}
                            {!msg.confirmed ? (
                              <button
                                onClick={() => confirmAttendance(msg.id)}
                                className="mt-3 w-full py-2 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                {msg.found && msg.found.length > 1 ? 'Confirm All' : 'Confirm Attendance'}
                              </button>
                            ) : (
                              <div className="mt-3 text-center text-[10px] font-bold text-[#16A34A] bg-emerald-50 py-1.5 rounded-xl border border-emerald-100">
                                Marked Present ✓
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              <form onSubmit={handleSendChat} className="p-3 bg-white border-t border-gray-100 shrink-0 flex gap-2 w-full">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Enter Roll No (e.g. 1, 2, 5-10)"
                  disabled={!selectedBatchId}
                  enterKeyHint="send"
                  className="flex-1 bg-slate-50 border border-[#E5E7EB] focus:bg-white focus:border-[#16A34A] rounded-xl px-3 py-2.5 text-[12px] font-bold text-slate-700 outline-none transition-all placeholder-slate-400"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || !selectedBatchId}
                  className="bg-[#16A34A] hover:bg-[#15803D] text-white px-4 py-2.5 rounded-xl disabled:opacity-40 transition-colors cursor-pointer flex items-center justify-center gap-1.5 shrink-0 shadow-sm"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </motion.div>
          )}

          """

code = re.sub(old_quick, new_quick, code, flags=re.DOTALL)

with open('src/components/AttendanceTab.tsx', 'w') as f:
    f.write(code)
