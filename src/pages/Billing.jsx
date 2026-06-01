import React from 'react';
import { ThemeProvider } from '../context/ThemeContext';
export default function Billing() {
  return (
    <>
      <div className="flex justify-between items-end mb-8 font-[Manrope]">
        <div>
          <h1 className="text-[32px] font-bold text-gray-900 dark:text-white leading-tight mb-1">Billing & Invoices</h1>
          <p className="text-gray-600 dark:text-gray-400 text-[14px]">Manage your invoices, payments, and billing history.</p>
        </div>
      </div>
      
      <div className="glass-panel p-10 rounded-lg flex flex-col items-center justify-center text-center font-[Manrope]">
        <div className="w-16 h-16 bg-executive-blue/10 text-executive-blue rounded-full flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-3xl">receipt_long</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Billing Module</h2>
        <p className="text-gray-500 max-w-md">
          The billing and invoicing module is currently under construction. You will be able to generate invoices and track payments soon.
        </p>
      </div>
    </>
  );
}

