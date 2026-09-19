module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0d47a1", // Deep Blue
        secondary: "#3f51b5", // Indigo
        success: "#4caf50", // Green
        warning: "#ff9800", // Orange
        danger: "#f44336", // Red
        background: "#f5f5f5", // Very light gray
        card: "#ffffff" // White
      },
      borderRadius: {
        DEFAULT: "0.5rem"
      },
      boxShadow: {
        card: "0 2px 8px rgba(0, 0, 0, 0.05)"
      }
    }
  },
  plugins: []
};
