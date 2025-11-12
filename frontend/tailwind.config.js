module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0ea5a4', // Ensure this is defined if you're using text-primary
      },
    },
  },
  plugins: [],
};