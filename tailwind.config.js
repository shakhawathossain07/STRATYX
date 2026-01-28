/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#050508', // Deep void
        surface: '#0f111a',    // Dark tech panel
        primary: '#00ccff',    // Neon Cyan
        secondary: '#8b5cf6',  // Electric Violet
        accent: '#ff0055',     // Cyber Pink
        danger: '#ff2a2a',     // Bright Red
        success: '#00ff9d',    // Neon Green
      },
      fontFamily: {
        game: ['Oxanium', 'sans-serif'],
        tech: ['Space Grotesk', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
