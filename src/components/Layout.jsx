import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <div className="min-h-screen bg-theme-bg text-theme-text font-inter antialiased relative overflow-hidden flex" style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)`
      }}>
        {/* Dynamic Abstract Glassmorphism Background Elements for Light Mode */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-executive-blue/20 dark:bg-transparent blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-purple-500/15 dark:bg-transparent blur-[150px] pointer-events-none" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-cyan-400/10 dark:bg-transparent blur-[100px] pointer-events-none" />
        
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="lg:ml-64 min-h-screen flex flex-col relative z-10 transition-all duration-300 w-full">
          <Topbar onMenuClick={() => setSidebarOpen(true)} />
          <section className="mt-16 p-4 lg:p-8 space-y-8 overflow-y-auto max-w-[1440px] mx-auto w-full flex-1">
            <Outlet />
          </section>
        </main>
      </div>
    </>
  );
}