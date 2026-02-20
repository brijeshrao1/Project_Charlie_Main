# 🚀 Charlie - HDL Management & Transformation Platform

## Frontend Application - Skeuomorphism UI

A beautifully designed React frontend for Oracle HDL (Hierarchical Data Loader) management and transformation with a modern **skeuomorphism** design aesthetic.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Architecture](#architecture)
- [API Integration](#api-integration)
- [Component Structure](#component-structure)
- [Skeuomorphism Design System](#skeuomorphism-design-system)
- [Troubleshooting](#troubleshooting)

---

## ✨ Features

### 🎨 Skeuomorphism UI Design
- Realistic depth and shadow effects
- Tactile button interactions (press/release animations)
- Gradient backgrounds simulating physical materials
- Smooth 3D transformations on hover/click
- Polished, professional interface mimicking real-world controls

### 🔧 Core Functionality
- **Dashboard**: Real-time statistics and system status monitoring
- **HDL Hierarchy**: Browse and manage HDL component hierarchies
- **File Upload**: Drag-and-drop interface for Excel and DAT files
- **Data Validation**: Validate files against backend rules
- **Data Transformation**: Transform data using configured mappings
- **Lookup Data**: Manage lookup values for components
- **Oracle Integration**: Direct integration with Oracle HCM Cloud
- **Settings**: Configure application preferences and customer instances

### 🔄 API Integration
- Seamless integration with FastAPI backend (localhost:8000)
- Real-time server status monitoring
- Error handling and retry logic
- Request/response interceptors

---

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| React | 19.2.4 | UI framework |
| React Router DOM | 7.13.0 | Client-side routing |
| Axios | 1.6.2 | HTTP client |
| CSS3 | - | Skeuomorphism styling |
| npm | Latest | Package manager |

---

## 📦 Installation

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager
- Backend API running on localhost:8000

### Step 1: Navigate to Frontend Directory
```bash
cd frontend/charlie_client
```

### Step 2: Install Dependencies
```bash
npm install
```

This will install:
- React and React Router
- Axios (for API calls)
- React Scripts (build tools)
- Testing libraries

### Step 3: Verify Installation
```bash
npm list
```

---

## 🚀 Running the Application

### Development Server
```bash
npm start
```

- Application opens automatically at `http://localhost:3001`
- Hot-reload enabled for development
- ESLint warnings displayed in console

### Production Build
```bash
npm run build
```

Creates an optimized production build in the `build/` directory.

### Testing
```bash
npm test
```

Runs the test suite in watch mode.

---

## 🏗️ Architecture

### Directory Structure
```
frontend/charlie_client/
├── public/
│   ├── index.html
│   ├── manifest.json
│   └── robots.txt
├── src/
│   ├── Components/
│   │   ├── sidebar.jsx          # Navigation sidebar
│   │   ├── Sidebar.css          # Sidebar styles
│   │   ├── Topbar.jsx           # Top navigation bar
│   │   └── Topbar.css           # Topbar styles
│   ├── Pages/
│   │   ├── Dashboard.jsx        # Main dashboard
│   │   ├── Dashboard.css        # Dashboard styles
│   │   ├── Upload.jsx           # File upload page
│   │   └── Upload.css           # Upload page styles
│   ├── services/
│   │   └── api.js               # Axios API configuration
│   ├── App.js                   # Main application component
│   ├── App.css                  # App-level styles
│   ├── index.js                 # React entry point
│   └── index.css                # Global styles & theme variables
├── package.json                 # Dependencies and scripts
└── README.md                    # This file
```

---

## 🔗 API Integration

### Backend Connection
The frontend connects to the FastAPI backend running on **localhost:8000**.

**File**: `src/services/api.js`

```javascript
const api = axios.create({
  baseURL: "http://localhost:8000/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json"
  }
});
```

### Starting the Backend

```bash
cd ../Server
python -m uvicorn Main:app --reload --port 8000
```

### API Endpoints Used

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/utils/hdl/menu-items` | Fetch HDL hierarchy |
| POST | `/api/hdl/upload` | Upload files |
| POST | `/api/hdl/validate-data` | Validate data |
| POST | `/api/hdl/transform-customer-excel` | Transform data |
| POST | `/api/hdl/upload-to-oracle` | Upload to Oracle |
| GET | `/api/customers` | Get customer list |

---

## 🧩 Component Structure

### App.js
Main component handling:
- Route setup and navigation
- Server status checking
- Loading and error states

### Sidebar Component
- Collapsible navigation menu
- Active route highlighting
- API connection status indicator
- Smooth collapse/expand animations

### Topbar Component
- Search bar for quick navigation
- Real-time server status display
- System clock
- User profile menu

### Dashboard Component
- Statistics cards with live data
- Quick action buttons
- System status monitors
- API integration examples

### Upload Component
- Drag-and-drop file upload area
- File size and format validation
- Upload progress bar
- Error handling and user feedback

---

## 🎨 Skeuomorphism Design System

### Design Philosophy
**Skeuomorphism** is a design philosophy that mimics real-world physics and materials. The Charlie UI implements this through:

1. **Depth & Shadows**
   - Multiple shadow layers for 3D effect
   - Inset shadows for depth perception
   - Elevation-based shadow system

2. **Material Simulation**
   - Cream/paper-like backgrounds
   - Subtle gradients simulating material texture
   - Border highlights like light reflection

3. **Tactile Interactions**
   - Press-in effect on button click
   - Hover elevation animations
   - Smooth state transitions

4. **Color Palette**
   ```css
   --primary: #2c3e50           /* Deep blue-gray */
   --accent: #e74c3c            /* Warm red */
   --bg-cream: #f5f3f0          /* Paper-like background */
   --success: #27ae60           /* Green */
   --warning: #f39c12           /* Orange */
   --error: #e74c3c             /* Red */
   ```

### CSS Variables (Theme)
Located in `src/index.css`:
- Color scheme
- Spacing scale
- Typography scale
- Shadow system
- Border radius values
- Transition timings

### Responsive Design
- Mobile-first approach
- Sidebar collapses on smaller screens
- Touch-friendly button sizes
- Flexible grid layouts

---

## 🔧 Troubleshooting

### Issue: Cannot Connect to Backend
**Error**: "Backend Service Unavailable"

**Solution**:
1. Ensure FastAPI backend is running:
   ```bash
   cd Server
   python -m uvicorn Main:app --reload --port 8000
   ```
2. Check if port 8000 is not blocked by firewall
3. Verify backend is responding:
   ```bash
   curl http://localhost:8000/api/utils/hdl/menu-items
   ```

### Issue: Module Not Found
**Error**: `Cannot find module...`

**Solution**:
1. Clear node_modules and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
2. Check for case-sensitivity issues in imports

### Issue: Port 3001 Already in Use
**Error**: `Something is already running on port 3001`

**Solution**:
```bash
# On Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# On macOS/Linux
lsof -i :3001
kill -9 <PID>
```

### Issue: Styling Not Applied
**Problem**: Components look plain/unstyled

**Solution**:
1. Verify `index.css` is imported in `index.js`
2. Clear browser cache (Ctrl+Shift+Del)
3. Hard refresh (Ctrl+Shift+R)
4. Check browser console for CSS errors

### Issue: API Requests Timing Out
**Problem**: Long loading times or timeout errors

**Solution**:
1. Increase timeout in `api.js`:
   ```javascript
   timeout: 60000 // 60 seconds
   ```
2. Check backend performance
3. Monitor network tab in DevTools

---

## 📱 Responsive Breakpoints

| Breakpoint | Width | Behavior |
|---|---|---|
| Desktop | 1024px+ | Full layout with sidebar |
| Tablet | 768px-1023px | Compact sidebar |
| Mobile | Below 768px | Collapsed sidebar, stack layout |

---

## 🔌 Keyboard Shortcuts (Future)
- `Ctrl/Cmd + K`: Search
- `Ctrl/Cmd + /`: Toggle sidebar
- `Ctrl/Cmd + U`: Upload files

---

## 📝 Development Guidelines

### Code Style
- Use functional components with hooks
- PropTypes for prop validation
- Descriptive variable and function names
- Comments for complex logic

### CSS Organization
- Use CSS variables for theming
- Mobile-first responsive design
- Group related styles together
- Follow BEM naming conventions

### Git Workflow
```bash
git checkout -b feature/new-feature
git add .
git commit -m "feat: describe changes"
git push origin feature/new-feature
```

---

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Deploy to GitHub Pages
```bash
npm run build
npm install --save-dev gh-pages
```

Then add to `package.json`:
```json
"homepage": "https://yourusername.github.io/Project_Charlie_Main",
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d build"
}
```

---

## 📚 Resources

- [React Documentation](https://react.dev)
- [React Router Guide](https://reactrouter.com)
- [Axios Documentation](https://axios-http.com)
- [CSS Skeuomorphism Guide](https://www.smashingmagazine.com)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📄 License

This project is part of Project Charlie and follows the organization's license terms.

---

## 👤 Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review backend logs
3. Check browser DevTools console
4. Contact the development team

---

**Last Updated**: February 18, 2026
**Version**: 1.0.0
**Status**: Production Ready ✅
