import React from 'react';
export default function Footer(){
  return (
    <footer className="bg-indigo-900 text-white py-6 mt-12">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
        <div className="text-sm">© {new Date().getFullYear()} OnlineWorkersKE — Trusted gigs for Kenyan youth</div>
        <div className="text-sm mt-2 md:mt-0">Contact: hello@onlineworkers.ke</div>
      </div>
    </footer>
  );
}
