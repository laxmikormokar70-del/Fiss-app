const fs = require('fs');
let code = fs.readFileSync('src/components/DashboardTab.tsx', 'utf8');

// We will replace the entire header and the main content up to Quick Actions.
const startHeaderIdx = code.indexOf('{/* 1. TOP APP BAR - REDESIGNED */}');
const endQuickActionsIdx = code.indexOf('{/* B. GOOGLE CLASSROOM-STYLE CLASS HORIZONTAL SELECTION CHIPS */}');

if (startHeaderIdx !== -1 && endQuickActionsIdx !== -1) {
  const newContent = `
      {/* 1. COMBINED HEADER & WELCOME SECTION */}
      <div className="relative bg-[#0F5C35] rounded-b-[40px] px-5 pt-8 pb-12 overflow-hidden shrink-0 shadow-md">
        {/* Decorative Wave at the bottom of the green section */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto translate-y-1">
            <path d="M0,64L80,74.7C160,85,320,107,480,101.3C640,96,800,64,960,53.3C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z" fill="#F8FAFC"/>
          </svg>
        </div>
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute -left-16 top-32 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>

        {/* Top Bar */}
        <div className="relative z-10 flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button className="text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-white/10 text-white rounded-[10px] flex items-center justify-center backdrop-blur-sm border border-white/20">
                <School className="h-5 w-5" />
              </div>
              <h1 className="text-[17px] font-bold text-white tracking-tight">
                EduManager <span className="text-emerald-400">AI</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <button 
                  onClick={() => setShowNotificationDrawer(true)}
                  className="relative p-1.5 text-white hover:bg-white/10 rounded-full transition-colors"
                >
                  <Bell className="h-6 w-6" />
                  {notificationsList.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-3.5 w-3.5 bg-red-500 rounded-full border-2 border-[#0F5C35] flex items-center justify-center text-[8px] font-bold text-white">
                      {notificationsList.length}
                    </span>
                  )}
                </button>
                <div className="h-9 w-9 rounded-full bg-blue-100 overflow-hidden border-2 border-[#0F5C35] shadow-sm relative shrink-0">
                  {teacherProfile?.logoUrl ? (
                    <img src={teacherProfile.logoUrl} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-[#16A34A] font-bold text-xs">
                      {teacherProfile?.name?.slice(0, 2).toUpperCase() || 'TR'}
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-emerald-400 rounded-full border-2 border-white"></div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onTriggerAuth('login')}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-lg transition-all border border-white/20"
                >
                  Login
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Welcome Section */}
        {isLoggedIn ? (
          <div className="relative z-10 flex items-center justify-between pb-4">
            <div className="flex-1">
              <p className="text-[13px] font-medium text-emerald-100 mb-0.5">Welcome Back,</p>
              <h2 className="text-[22px] font-bold text-white leading-tight flex items-center gap-1.5 mb-1.5">
                <span className="truncate max-w-[200px]">{teacherProfile?.name || 'Instructor'}</span> <span>👋</span>
              </h2>
              <p className="text-[13px] font-medium text-emerald-300 flex items-center gap-1 mb-5">
                {greeting}
              </p>

              {classes.length === 0 && (
                <button
                  onClick={() => setShowCreateClassModal(true)}
                  className="bg-white hover:bg-gray-50 text-[#0F5C35] px-4 py-2.5 rounded-[12px] font-bold text-[13px] flex items-center gap-2 transition-transform active:scale-[0.98] shadow-sm"
                >
                  <PlusCircle className="h-4 w-4" />
                  Create First Class
                </button>
              )}
            </div>
            
            {/* School Illustration */}
            <div className="w-32 h-32 shrink-0 rounded-full bg-emerald-100/20 backdrop-blur-md border-[4px] border-white/20 flex items-center justify-center overflow-hidden ml-4 relative">
              <div className="absolute inset-0 bg-gradient-to-b from-sky-300 to-emerald-200 opacity-80"></div>
              {/* Fake school vector */}
              <div className="relative z-10 w-20 h-16 bg-white rounded-t-sm shadow-sm flex flex-col items-center justify-end pb-1 border-b-[3px] border-emerald-600">
                <div className="w-16 h-8 bg-emerald-100 flex justify-center gap-1 p-1">
                  <div className="w-2 h-3 bg-white"></div>
                  <div className="w-2 h-3 bg-white"></div>
                  <div className="w-2 h-3 bg-white"></div>
                  <div className="w-2 h-3 bg-white"></div>
                </div>
                <div className="absolute top-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center"><div className="w-1 h-1 bg-white rounded-full"></div></div>
                <div className="absolute -top-3 w-0 h-0 border-l-[12px] border-r-[12px] border-b-[12px] border-l-transparent border-r-transparent border-b-emerald-600"></div>
                <div className="w-6 h-4 bg-emerald-600 rounded-t-sm mx-auto mt-1"></div>
              </div>
              <div className="absolute bottom-0 w-full h-4 bg-emerald-500 z-0"></div>
              {/* Trees */}
              <div className="absolute bottom-2 left-2 w-6 h-10 bg-emerald-600 rounded-full z-10"></div>
              <div className="absolute bottom-1 right-1 w-8 h-12 bg-emerald-400 rounded-full z-10"></div>
            </div>
          </div>
        ) : (
          <div className="relative z-10 pb-12">
            <h2 className="text-[24px] font-bold text-white leading-tight mb-2">
              Manage your coaching<br/>with EduManager AI
            </h2>
            <p className="text-emerald-100 text-sm mb-6">
              The complete ERP solution for modern institutes.
            </p>
            <button
              onClick={() => onTriggerAuth('register')}
              className="bg-white hover:bg-gray-50 text-[#0F5C35] px-6 py-3 rounded-[12px] font-bold text-[14px] flex items-center gap-2 transition-transform active:scale-[0.98] shadow-sm"
            >
              Get Started for Free
            </button>
          </div>
        )}
      </div>

      {/* 2. MAIN MOBILE CONTAINER SCROLL */}
      <div className={\`relative flex-1 overflow-y-auto pb-6 \${!isLoggedIn ? 'blur-md pointer-events-none' : ''}\`}>
        <div className="max-w-7xl mx-auto p-5 space-y-6">

          {isLoggedIn && (
            <>
              {/* OVERVIEW SECTION */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[17px] font-extrabold text-[#111827]">Overview</h3>
                  <span className="text-[10px] font-bold bg-[#DCFCE7] text-[#16A34A] px-2 py-1 rounded-md flex items-center gap-1">
                    Today's Summary <Calendar className="h-3 w-3" />
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white p-3.5 rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-50 flex flex-col justify-between h-[105px]">
                    <div className="h-8 w-8 bg-[#E6F4EA] rounded-xl flex items-center justify-center mb-1">
                      <Users className="h-4 w-4 text-[#16A34A]" />
                    </div>
                    <div>
                      <p className="text-[10px] text-[#64748B] font-medium mb-0.5">Total Students</p>
                      <h4 className="text-[18px] font-extrabold text-[#111827]">{stats.totalStudents}</h4>
                    </div>
                  </div>

                  <div className="bg-white p-3.5 rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-50 flex flex-col justify-between h-[105px]">
                    <div className="h-8 w-8 bg-[#E8F0FE] rounded-xl flex items-center justify-center mb-1">
                      <User className="h-4 w-4 text-[#1A73E8]" />
                    </div>
                    <div>
                      <p className="text-[10px] text-[#64748B] font-medium mb-0.5">Total Boys</p>
                      <h4 className="text-[18px] font-extrabold text-[#111827]">{stats.boysCount}</h4>
                    </div>
                  </div>

                  <div className="bg-white p-3.5 rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-50 flex flex-col justify-between h-[105px]">
                    <div className="h-8 w-8 bg-[#FCE8E6] rounded-xl flex items-center justify-center mb-1">
                      <UserCircle className="h-4 w-4 text-[#D93025]" />
                    </div>
                    <div>
                      <p className="text-[10px] text-[#64748B] font-medium mb-0.5">Total Girls</p>
                      <h4 className="text-[18px] font-extrabold text-[#111827]">{stats.girlsCount}</h4>
                    </div>
                  </div>

                  <div className="bg-white p-3.5 rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-50 flex flex-col justify-between h-[105px]">
                    <div className="h-8 w-8 bg-[#F3E8FD] rounded-xl flex items-center justify-center mb-1">
                      <CheckCircle2 className="h-4 w-4 text-[#9334E6]" />
                    </div>
                    <div>
                      <p className="text-[10px] text-[#64748B] font-medium mb-0.5">Total Paid Students</p>
                      <h4 className="text-[18px] font-extrabold text-[#111827]">{stats.paidStudentsCount}</h4>
                    </div>
                  </div>

                  <div className="bg-white p-3.5 rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-50 flex flex-col justify-between h-[105px]">
                    <div className="h-8 w-8 bg-[#FEF7E0] rounded-xl flex items-center justify-center mb-1">
                      <Clock className="h-4 w-4 text-[#E37400]" />
                    </div>
                    <div>
                      <p className="text-[10px] text-[#64748B] font-medium mb-0.5">Total Due Students</p>
                      <h4 className="text-[18px] font-extrabold text-[#111827]">{stats.dueStudentsCount}</h4>
                    </div>
                  </div>

                  <div className="bg-white p-3.5 rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-50 flex flex-col justify-between h-[105px]">
                    <div className="h-8 w-8 bg-[#E6F4EA] rounded-xl flex items-center justify-center mb-1">
                      <Wallet className="h-4 w-4 text-[#16A34A]" />
                    </div>
                    <div>
                      <p className="text-[10px] text-[#64748B] font-medium mb-0.5">Total Paid Amount</p>
                      <h4 className="text-[18px] font-extrabold text-[#111827]">₹{stats.paidSum}</h4>
                    </div>
                  </div>

                  <div className="bg-white p-3.5 rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-50 flex flex-col justify-between h-[105px]">
                    <div className="h-8 w-8 bg-[#FCE8E6] rounded-xl flex items-center justify-center mb-1">
                      <Wallet className="h-4 w-4 text-[#D93025]" />
                    </div>
                    <div>
                      <p className="text-[10px] text-[#64748B] font-medium mb-0.5">Total Due Amount</p>
                      <h4 className="text-[18px] font-extrabold text-[#111827]">₹{stats.dueSum}</h4>
                    </div>
                  </div>
                </div>
              </div>

              {/* QUICK ACTIONS */}
              <div className="space-y-4 pt-2">
                <h3 className="text-[17px] font-extrabold text-[#111827]">Quick Actions</h3>
                <div className="flex justify-between px-1">
                  <button onClick={() => { onTabChange('students'); setTimeout(() => document.getElementById('add-student-btn')?.click(), 100); }} className="flex flex-col items-center gap-2 group">
                    <div className="h-[52px] w-[52px] rounded-full bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100 flex items-center justify-center group-active:scale-95 transition-all">
                      <UserPlus className="h-5 w-5 text-[#16A34A]" />
                    </div>
                    <span className="text-[10px] font-bold text-[#475569]">Add Student</span>
                  </button>

                  <button onClick={() => onTabChange('attendance')} className="flex flex-col items-center gap-2 group">
                    <div className="h-[52px] w-[52px] rounded-full bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100 flex items-center justify-center group-active:scale-95 transition-all">
                      <CalendarCheck className="h-5 w-5 text-[#E37400]" />
                    </div>
                    <span className="text-[10px] font-bold text-[#475569]">Attendance</span>
                  </button>

                  <button onClick={() => onTabChange('students')} className="flex flex-col items-center gap-2 group">
                    <div className="h-[52px] w-[52px] rounded-full bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100 flex items-center justify-center group-active:scale-95 transition-all">
                      <Users className="h-5 w-5 text-[#1A73E8]" />
                    </div>
                    <span className="text-[10px] font-bold text-[#475569]">Student List</span>
                  </button>

                  <button onClick={() => onTabChange('reports')} className="flex flex-col items-center gap-2 group">
                    <div className="h-[52px] w-[52px] rounded-full bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100 flex items-center justify-center group-active:scale-95 transition-all">
                      <BarChart3 className="h-5 w-5 text-[#9334E6]" />
                    </div>
                    <span className="text-[10px] font-bold text-[#475569]">Reports</span>
                  </button>

                  <button onClick={() => onTabChange('more')} className="flex flex-col items-center gap-2 group">
                    <div className="h-[52px] w-[52px] rounded-full bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100 flex items-center justify-center group-active:scale-95 transition-all">
                      <MoreHorizontal className="h-5 w-5 text-[#475569]" />
                    </div>
                    <span className="text-[10px] font-bold text-[#475569]">More</span>
                  </button>
                </div>
              </div>

              {/* YOUR CLASSES SECTION */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[17px] font-extrabold text-[#111827]">Your Classes</h3>
                  <button className="text-[12px] font-bold text-[#16A34A] flex items-center gap-1">
                    View All <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                
                {classes.length === 0 ? (
                  <div className="bg-white rounded-[24px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-50 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xl">📁</span>
                        <h4 className="text-[14px] font-bold text-[#111827]">No Classes Found</h4>
                      </div>
                      <p className="text-[11px] text-[#64748B] font-medium mb-3">Create your first class to get started</p>
                      <button 
                        onClick={() => setShowCreateClassModal(true)}
                        className="bg-[#16A34A] hover:bg-[#15803d] text-white px-4 py-2 rounded-full text-[11px] font-bold flex items-center gap-1 transition-colors"
                      >
                        <PlusCircle className="h-3 w-3" /> Create Class
                      </button>
                    </div>
                    <div className="w-24 h-20 bg-emerald-50 rounded-xl flex flex-col justify-end p-2 relative overflow-hidden">
                       <div className="absolute -right-2 top-2 w-12 h-16 bg-emerald-200 rounded-md rotate-12 opacity-50"></div>
                       <div className="absolute right-2 bottom-0 w-16 h-12 bg-emerald-400 rounded-t-md opacity-80"></div>
                    </div>
                  </div>
                ) : (
                  <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-none snap-x touch-pan-x">
                    {classesList.filter(c => c !== 'All').map(className => (
                      <div key={className} className="bg-white p-4 rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-50 min-w-[140px] shrink-0 snap-start">
                        <div className="h-10 w-10 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
                          <Layers className="h-5 w-5 text-emerald-600" />
                        </div>
                        <h4 className="text-[15px] font-bold text-[#111827]">Class {className}</h4>
                        <p className="text-[11px] text-[#64748B] mt-0.5">{students.filter(s => s.class === className).length} Students</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* RECENT ACTIVITIES SECTION */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[17px] font-extrabold text-[#111827]">Recent Activities</h3>
                  <button className="text-[12px] font-bold text-[#16A34A] flex items-center gap-1">
                    View All <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {recentActivities.length === 0 ? (
                  <div className="bg-[#FFF8F1] rounded-[24px] p-5 border border-orange-50 flex items-center gap-4">
                    <div className="h-16 w-16 bg-white rounded-[16px] shadow-sm flex items-center justify-center shrink-0">
                      <Activity className="h-8 w-8 text-orange-200" />
                    </div>
                    <div>
                      <h4 className="text-[14px] font-bold text-[#111827]">No Recent Activities</h4>
                      <p className="text-[11px] text-[#64748B] font-medium mt-0.5">All your activities will appear here</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentActivities.slice(0, 3).map((activity, idx) => (
                       <div key={idx} className="bg-white p-4 rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-50 flex items-center gap-3">
                         <div className={\`h-10 w-10 rounded-full flex items-center justify-center shrink-0 \${
                           activity.type === 'student' ? 'bg-blue-50 text-blue-500' :
                           activity.type === 'payment' ? 'bg-emerald-50 text-emerald-500' :
                           'bg-orange-50 text-orange-500'
                         }\`}>
                           {activity.type === 'student' && <UserPlus className="h-5 w-5" />}
                           {activity.type === 'payment' && <DollarSign className="h-5 w-5" />}
                           {activity.type === 'attendance' && <CheckSquare className="h-5 w-5" />}
                         </div>
                         <div className="flex-1">
                           <p className="text-[13px] font-bold text-[#111827]">{activity.title}</p>
                           <p className="text-[11px] text-[#64748B] line-clamp-1">{activity.desc}</p>
                         </div>
                         <span className="text-[10px] font-bold text-[#94A3B8] whitespace-nowrap">{activity.time}</span>
                       </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="h-6"></div>
            </>
          )}

`;
  code = code.substring(0, startHeaderIdx) + newContent + code.substring(endQuickActionsIdx);
}

fs.writeFileSync('src/components/DashboardTab.tsx', code);
console.log('updated Dashboard layout');
