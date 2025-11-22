export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-violet-600 to-purple-600 rounded-lg"></div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
                Online Workers
              </h3>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Connecting employers with skilled freelancers for various tasks and projects across Kenya.
            </p>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center hover:bg-slate-600 transition-colors cursor-pointer">
                <span className="text-xs">f</span>
              </div>
              <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center hover:bg-slate-600 transition-colors cursor-pointer">
                <span className="text-xs">t</span>
              </div>
              <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center hover:bg-slate-600 transition-colors cursor-pointer">
                <span className="text-xs">in</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">For Employers</h4>
            <ul className="space-y-3">
              {["Post a Job", "Find Talent", "Pricing"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-slate-300 hover:text-white transition-colors flex items-center gap-2 group">
                    <div className="w-1.5 h-1.5 bg-violet-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">For Workers</h4>
            <ul className="space-y-3">
              {["Browse Jobs", "Get Paid", "Build Profile"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-slate-300 hover:text-white transition-colors flex items-center gap-2 group">
                    <div className="w-1.5 h-1.5 bg-violet-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Support</h4>
            <ul className="space-y-3">
              {["Help Center", "Contact Us", "Privacy Policy"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-slate-300 hover:text-white transition-colors flex items-center gap-2 group">
                    <div className="w-1.5 h-1.5 bg-violet-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-700 mt-12 pt-8 text-center">
          <p className="text-slate-400">
            &copy; 2024 Online Workers. All rights reserved. Built for Kenyan youth empowerment.
          </p>
        </div>
      </div>
    </footer>
  );
}