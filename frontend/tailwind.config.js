export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        // Redefine semantic colors for Light Mode SaaS theme
        primary: {
          DEFAULT: "#4f46e5", // indigo-600
          hover: "#4338ca", // indigo-700
          light: "#e0e7ff", // indigo-100
        },
        secondary: {
          DEFAULT: "#ffffff",
          hover: "#f9fafb", // gray-50
        },
        background: "#f9fafb", // gray-50 - Page background
        surface: "#ffffff", // Card background
        border: "#e5e7eb", // gray-200
        text: {
          main: "#111827", // gray-900
          secondary: "#4b5563", // gray-600
          muted: "#9ca3af", // gray-400
        },
        success: "#10b981", // emerald-500
        danger: "#ef4444", // red-500
        warning: "#f59e0b", // amber-500
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        DEFAULT:
          "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
        card: "0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)", // Very subtle
      },
    },
  },
  plugins: [],
};
