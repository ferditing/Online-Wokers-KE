export default function Footer() {
  return (
    <footer className="bg-slate-800 text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Online Workers</h3>
            <p className="text-slate-300">
              Connecting employers with skilled freelancers for various tasks and projects.
            </p>
          </div>
          <div>
            <h4 className="text-md font-semibold mb-4">For Employers</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-slate-300 hover:text-white">Post a Job</a></li>
              <li><a href="#" className="text-slate-300 hover:text-white">Find Talent</a></li>
              <li><a href="#" className="text-slate-300 hover:text-white">Pricing</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-md font-semibold mb-4">For Workers</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-slate-300 hover:text-white">Browse Jobs</a></li>
              <li><a href="#" className="text-slate-300 hover:text-white">Get Paid</a></li>
              <li><a href="#" className="text-slate-300 hover:text-white">Build Profile</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-md font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-slate-300 hover:text-white">Help Center</a></li>
              <li><a href="#" className="text-slate-300 hover:text-white">Contact Us</a></li>
              <li><a href="#" className="text-slate-300 hover:text-white">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-700 mt-8 pt-8 text-center">
          <p className="text-slate-300">&copy; 2024 Online Workers. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
