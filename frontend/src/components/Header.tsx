import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  return (
    <header>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link to="/"><strong>OnlineWorkersKE</strong></Link>
          <Link to="/jobs" className="small">Jobs</Link>
          {user?.role === 'employer' && <Link to="/post-job" className="small">Post Job</Link>}
        </div>
        <div>
          {user ? (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span className="small">Hi, {user.name}</span>
              <button onClick={() => { logout(); nav('/'); }}>Logout</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
