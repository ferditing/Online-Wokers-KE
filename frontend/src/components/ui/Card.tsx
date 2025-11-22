import React from 'react';

export default function Card({ children, className = '' }: any) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 p-6 ${className}`}>
      {children}
    </div>
  );
}