import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';

export default function Home(){
  return (
    <div className="container mx-auto px-4">
      <section className="grid lg:grid-cols-2 gap-8 items-center py-12">
        <div>
          <h1 className="text-4xl font-extrabold text-indigo-800">Jobs that fit skills — fast</h1>
          <p className="mt-4 text-gray-600">Verified workers, trusted employers, secure M-Pesa escrow — hire or get work in minutes.</p>
          <div className="mt-6 flex gap-3">
            <Link to="/register?role=employer" className="px-4 py-2 bg-indigo-600 text-white rounded-md">Become an employer</Link>
            <Link to="/register?role=worker" className="px-4 py-2 border border-indigo-200 text-indigo-700 rounded-md">Become a worker</Link>
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <h3 className="text-lg font-semibold">How it works</h3>
            <ol className="mt-2 text-sm text-gray-600 list-decimal list-inside">
              <li>Post job with required skills</li>
              <li>Hire verified workers, fund escrow</li>
              <li>Release funds after approval — admin verifies</li>
            </ol>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold">Why OnlineWorkersKE</h3>
            <ul className="mt-2 text-sm text-gray-600 list-disc list-inside">
              <li>Verification-first</li>
              <li>M-Pesa escrow</li>
              <li>Skill-based matching</li>
            </ul>
          </Card>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-indigo-800 mb-4">Featured jobs</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* you can map job cards here */}
          <Card className="hover:shadow-md">
            <div className="flex justify-between">
              <div>
                <div className="font-medium">React Developer</div>
                <div className="text-xs text-gray-500 mt-1">React, TypeScript — remote</div>
              </div>
              <div className="text-right"><div className="text-sm font-semibold">KES 8,000</div></div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
