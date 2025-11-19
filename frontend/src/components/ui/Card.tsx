import React from 'react';

export default function Card({ children, className='' }: any) {
  return <div className={`bg-white rounded-lg shadow-sm p-4 ${className}`}>{children}</div>;
}
