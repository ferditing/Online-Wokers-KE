import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 bg-gradient-to-r from-violet-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">OW</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                OnlineWorkersKE
              </span>
            </Link>
            
            <nav className="hidden md:flex gap-6">
              <Link 
                to="/jobs" 
                className="text-sm font-medium text-slate-600 hover:text-violet-600 transition-colors relative group"
              >
                Jobs
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-violet-600 group-hover:w-full transition-all duration-200"></span>
              </Link>
              <Link 
                to="/about" 
                className="text-sm font-medium text-slate-600 hover:text-violet-600 transition-colors relative group"
              >
                About
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-violet-600 group-hover:w-full transition-all duration-200"></span>
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link 
                  to="/profile" 
                  className="text-sm font-medium text-slate-700 hover:text-violet-600 transition-colors"
                >
                  {user.name}
                </Link>
                
                {user.role === 'employer' && (
                  <Link 
                    to="/post-job" 
                    className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-105"
                  >
                    Post Job
                  </Link>
                )}
                
                <button
                  onClick={() => { logout(); nav('/'); }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="text-sm font-medium text-slate-600 hover:text-violet-600 transition-colors"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-105"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}