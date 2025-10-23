import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="container">
      <div className="card" style={{ marginTop: 20 }}>
        <h2>Welcome to OnlineWorkersKE</h2>
        <p className="small">Connects verified youth with online-only micro-gigs. Sign up and start applying or posting jobs.</p>
        <p><Link to="/jobs">Browse Jobs →</Link></p>
      </div>
    </div>
  );
}
