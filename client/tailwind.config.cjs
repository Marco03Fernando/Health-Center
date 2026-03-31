module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#008080',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue'],
      },
      boxShadow: {
        soft: '0 6px 18px rgba(2,6,23,0.08)',
      },
    },
  },
  plugins: [],
}
