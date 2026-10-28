import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header.js';
import { Sidebar } from './Sidebar.js';
import { MobileNav } from './MobileNav.js';
import { Footer } from './Footer.js';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-theme-bg text-theme-text transition-colors duration-200 islamic-pattern">
      <Header />
      <div className="flex flex-1 w-full max-w-[var(--content-width,100%)] mx-auto">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 p-3.5 sm:p-6 lg:p-8 pb-20 lg:pb-8 overflow-x-hidden min-w-0">
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
      <MobileNav />
    </div>
  );
};
