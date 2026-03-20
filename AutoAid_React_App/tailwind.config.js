/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#13c8ec",
        "background-light": "#F9FAFB", // Updated to cleaner light gray
        "background-dark": "#0B1120", // Updated to match RoutePlanning example
        "surface-light": "#FFFFFF",
        "surface-dark": "#121A2A",
        "card-dark": "#121A2A",
        "border-light": "#E5E7EB",
        "border-dark": "rgba(45, 156, 219, 0.15)",
        "text-muted": "#8899A9",
        "text-dark": "#F9FAFB",
        "text-light": "#1F2937", // Added dark text for light mode
        "subtle-dark": "#9CA3AF",
      },
      fontFamily: {
        "display": ["Inter", "sans-serif"]
      },
      borderRadius: {
        "DEFAULT": "0.75rem", // 12px
        "lg": "1rem", // 16px
        "xl": "1.5rem", // 24px
        "full": "9999px"
      },
      boxShadow: {
        'glow-md': '0 0 15px rgba(19, 200, 236, 0.1), 0 0 5px rgba(19, 200, 236, 0.05)',
        'glow-lg': '0 0 25px rgba(19, 200, 236, 0.2), 0 0 10px rgba(19, 200, 236, 0.1)',
        'nav': '0 4px 30px rgba(0, 0, 0, 0.2)',
        'button-glow': '0 0 15px rgba(19, 200, 236, 0.3)'
      }
    },
  },
  plugins: [],
}
