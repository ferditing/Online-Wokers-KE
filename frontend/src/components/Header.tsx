import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  return (
    <header className="bg-white border-b">
      <div className="container flex items-center justify-between h-16">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-xl font-bold text-slate-800">OnlineWorkersKE</Link>
          <nav className="hidden md:flex gap-4">
            <Link to="/jobs" className="text-sm text-gray-600 hover:text-slate-900">Jobs</Link>
            <Link to="/about" className="text-sm text-gray-600 hover:text-slate-900">About</Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link to="/profile" className="text-sm text-gray-700 hover:text-slate-900">{user.name}</Link>
              {user.role === 'employer' && (
                <Link to="/post-job" className="btn btn-primary text-sm">Post Job</Link>
              )}
              <button
                onClick={() => { logout(); nav('/'); }}
                className="ml-2 text-sm text-red-600 hover:text-red-800"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-gray-700">Login</Link>
              <Link to="/register" className="ml-2 btn btn-primary text-sm">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
