import React from 'react';

export default function AttendancePage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* ======================= NAVBAR======================= */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 flex items-center justify-between sticky top-0 z-50">
         <div className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity">
            <img src="/assets/Logo_Truerize.png" alt="Truerize Logo" className="h-20 w-auto object-contain" />
            <div className="flex flex-col leading-none">
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TRUERIZE</span>
              <span className="font-extrabold text-xl tracking-tight" style={{ color: '#000080' }}>HRMS</span>
            </div>
          </div>

        <a href="/" className="text-sm font-bold text-slate-500 hover:text-[#000080] flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          Back to Home
        </a>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-5xl mx-auto px-6 py-16">
        
        {/* Hero Area */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-100 text-4xl mb-6">
            ⏰
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
            Smart Time & Attendance
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Track work hours, manage shifts, and handle leave requests effortlessly with biometric integration and geo-tagging.
          </p>
        </div>

        {/* Key Features Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:border-orange-200 transition-colors">
            <h3 className="text-xl font-bold text-[#000080] mb-3">Biometric & Geo-Fencing</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Integrate with biometric devices for office staff, or allow field employees to clock in via mobile with GPS geo-fencing validation.
            </p>
          </div>
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:border-orange-200 transition-colors">
            <h3 className="text-xl font-bold text-[#000080] mb-3">Shift Management</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Create complex shift rosters, handle rotations, and manage weekly offs. Employees can view their schedules instantly on the app.
            </p>
          </div>
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:border-orange-200 transition-colors">
            <h3 className="text-xl font-bold text-[#000080] mb-3">Leave Management</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Customizable leave policies (Sick, Casual, Earned). Employees apply online, managers approve in a click, and balances update automatically.
            </p>
          </div>
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:border-orange-200 transition-colors">
            <h3 className="text-xl font-bold text-[#000080] mb-3">Overtime Tracking</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Automatically calculate overtime hours based on your company policies and sync the data directly with payroll for payment.
            </p>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="bg-[#000080] rounded-3xl p-10 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Track time with precision</h2>
          <p className="text-blue-100 mb-8 max-w-xl mx-auto">Start your 14-day free trial today. No credit card required.</p>
          <button className="bg-white text-[#000080] px-8 py-3 rounded-full font-bold text-sm hover:bg-blue-50 transition-colors">
            Get Started Now
          </button>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} Truerize Inc. All rights reserved.
      </footer>
    </div>
  );
}