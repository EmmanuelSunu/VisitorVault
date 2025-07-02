# VisitorVault - Visitor Management System

A modern, mobile-friendly visitor management system built with React, TypeScript, Vite, and Tailwind CSS.

## Features

- **Visitor Registration**: Streamlined, multi-step registration with photo capture and QR code generation
- **Host Dashboard**: Manage and approve visitor requests, view stats, schedule, and recent activity
- **Reception Interface**: Easy check-in/check-out for visitors
- **Admin Panel**: System management for admins
- **Mobile Responsive**: Fully responsive design for phones, tablets, and desktops
- **Global Footer**: Fixed footer with a link to Desiderata Information Systems Limited

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Build Tool**: Vite

## Project Structure

```
VisitorVault/
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── App.tsx
    ├── main.tsx
    ├── index.css
    ├── components/
    ├── hooks/
    ├── lib/
    └── pages/
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the development server**
   ```bash
   npm run dev
   ```
   The app will be available at http://localhost:5173 (or as indicated in your terminal).

3. **Build for production**
   ```bash
   npm run build
   ```
   The production build will be output to the `dist/` folder.

4. **Preview the production build**
   ```bash
   npm run preview
   ```
   This serves the `dist/` folder locally. Do **not** open `dist/index.html` directly in your browser, as this may cause CORS or routing issues.

## Mobile Responsiveness

- The app is fully responsive and adapts to mobile, tablet, and desktop screens.
- The visitor registration and host dashboard layouts are optimized for small screens.
- The stepper and forms are compact and easy to use on mobile devices.

## Footer

- A global footer is fixed at the bottom of the app, containing a hyperlink to [Desiderata Information Systems Limited](https://desiderata.com).

## Customization

- All UI components are built with Tailwind CSS and can be easily customized in the `src/components/` and `src/pages/` directories.
- Utility functions and hooks are in `src/lib/` and `src/hooks/`.

## Support

For issues and questions, please create an issue in the repository or contact the maintainers.

---

© Desiderata Information Systems Limited 