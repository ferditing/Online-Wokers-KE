export default function Button({ children, className = "", ...props }: any) {
  return (
    <button {...props} className={`px-4 py-2 rounded-md font-medium shadow-sm transition ${className}`}>
      {children}
    </button>
  );
}
