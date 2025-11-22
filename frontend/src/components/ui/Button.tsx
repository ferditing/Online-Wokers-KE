export default function Button({ children, className = "", variant = "primary", ...props }: any) {
  const baseClasses = "px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 focus:scale-95";
  
  const variants = {
    primary: "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg hover:shadow-xl hover:from-violet-700 hover:to-purple-700",
    secondary: "bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 hover:border-slate-300",
    success: "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg hover:shadow-xl hover:from-emerald-600 hover:to-green-700",
    danger: "bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg hover:shadow-xl hover:from-rose-600 hover:to-pink-700"
  };

  return (
    <button 
      {...props} 
      className={`${baseClasses} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}