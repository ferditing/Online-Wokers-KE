import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

const SidebarLink: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => {
  const loc = useLocation();
  const active = loc.pathname === to;
  return (
    <Link
      to={to}
      className={`block px-3 py-2 rounded-md text-sm font-medium ${
        active ? 'bg-teal-500 text-white' : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {children}
    </Link>
  );
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [isLarge, setIsLarge] = useState(window.innerWidth >= 768);

  useEffect(() => {
    function handleResize() {
      const large = window.innerWidth >= 768;
      setIsLarge(large);
      setOpen(large); // always open on large screens
    }
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const closeSidebar = () => {
    if (!isLarge) setOpen(false);
  };

  return (
    <div className="min-h-screen flex bg-gray-50 relative">
      {/* Overlay for mobile */}
      {!isLarge && open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-20 md:hidden"
          onClick={closeSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-white border-r shadow-sm transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:static`}
      >
        <div className="h-full flex flex-col">
          {/* Header + close button (mobile only) */}
          <div className="flex items-center justify-between px-6 py-4 border-b md:justify-center">
            <Link to="/" className="text-xl font-bold text-primary" onClick={closeSidebar}>
              OnlineWorkersKE
            </Link>
            {!isLarge && (
              <button
                onClick={closeSidebar}
                aria-label="Close sidebar"
                className="text-gray-700 hover:text-red-600 md:hidden"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="p-4 flex-1 space-y-1 overflow-auto">
            <SidebarLink to="/" >Home</SidebarLink>
            <SidebarLink to="/jobs">Jobs</SidebarLink>
            {user && <SidebarLink to="/profile">Profile</SidebarLink>}
            {user?.role === 'employer' && <SidebarLink to="/post-job">Post Job</SidebarLink>}
            {user?.role === 'admin' && <SidebarLink to="/dashboard">Admin</SidebarLink>}
          </nav>

          {/* Footer (user info or auth) */}
          <div className="p-4 border-t">
            {user ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{user.name}</div>
                  <div className="text-xs text-gray-500">{user.role}</div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    closeSidebar();
                  }}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="space-x-2">
                <Link
                  to="/login"
                  className="btn btn-primary text-sm"
                  onClick={closeSidebar}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-sm ml-2"
                  onClick={closeSidebar}
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Page content */}
      <div className="flex-1 md:ml-64">
        {/* Top bar for small screens */}
        <div className="sticky top-0 z-20 bg-white border-b md:hidden">
          <div className="flex items-center justify-between h-14 px-4">
            <button
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
              className="p-1 rounded-md text-gray-700"
            >
              {open ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>
            <Link to="/" className="font-bold text-lg text-primary">
              OnlineWorkersKE
            </Link>
            <div />
          </div>
        </div>

        <main className="p-4">{children}</main>
      </div>
    </div>
  );
}
