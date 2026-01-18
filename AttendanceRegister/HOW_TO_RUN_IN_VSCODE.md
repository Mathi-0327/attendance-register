# 🚀 How to Run Attendance Register in VS Code

## Quick Start Guide

### ✅ Prerequisites Check

Before running the project, ensure you have:

1. **Node.js** (version 18.0 or higher)
   - Check: Open terminal and run `node --version`
   - If not installed: Download from https://nodejs.org/

2. **VS Code** (latest version)
   - Download from https://code.visualstudio.com/

3. **Git** (optional, for version control)
   - Check: `git --version`

---

## 📂 Step 1: Open Project in VS Code

### Method 1: From VS Code
1. Open VS Code
2. Click **File** → **Open Folder**
3. Navigate to `d:\AttendanceRegister\AttendanceRegister`
4. Click **Select Folder**

### Method 2: From File Explorer
1. Navigate to `d:\AttendanceRegister\AttendanceRegister`
2. Right-click in the folder
3. Select **Open with Code**

### Method 3: From Terminal
```bash
cd d:\AttendanceRegister\AttendanceRegister
code .
```

---

## 📦 Step 2: Install Dependencies

### First Time Setup Only

1. **Open Integrated Terminal in VS Code**
   - Press `` Ctrl + ` `` (backtick)
   - Or: **View** → **Terminal**

2. **Install all dependencies:**
   ```bash
   npm install
   ```

   This will install:
   - React, Express, TypeScript
   - All frontend and backend libraries
   - Development tools

   ⏱️ **Wait time**: 2-3 minutes (depending on internet speed)

3. **Verify installation:**
   ```bash
   npm list --depth=0
   ```

---

## ▶️ Step 3: Run the Project

### Development Mode (Recommended)

**Single Command:**
```bash
npm run dev
```

This will:
- ✅ Start the Express server on port 5000
- ✅ Enable hot-reload (auto-refresh on code changes)
- ✅ Start WebSocket server
- ✅ Initialize SQLite database

**Expected Output:**
```
> rest-express@1.0.0 dev
> cross-env NODE_ENV=development tsx server/index.ts

[network] Server IP: 10.109.219.179
[network] Network prefix: 10.109.219
[network] Allowed subnet: 10.109.219.0/24
1:26:17 PM [express] serving on port 5000
```

### Production Mode

**Build first:**
```bash
npm run build
```

**Then run:**
```bash
npm start
```

---

## 🌐 Step 4: Access the Application

Once the server is running:

1. **Open your browser**
2. **Navigate to one of these URLs:**

   - **Homepage**: http://localhost:5000
   - **Admin Dashboard**: http://localhost:5000/admin
   - **Student Access**: http://localhost:5000/attendance
   - **Student Portal**: http://localhost:5000/student

3. **From other devices on same network:**
   - Use the server IP shown in terminal
   - Example: http://10.109.219.179:5000

---

## 🛠️ VS Code Tips & Tricks

### Recommended Extensions

Install these VS Code extensions for better experience:

1. **ESLint** - Code linting
   - Extension ID: `dbaeumer.vscode-eslint`

2. **Prettier** - Code formatting
   - Extension ID: `esbenp.prettier-vscode`

3. **TypeScript Vue Plugin (Volar)**
   - Extension ID: `Vue.volar`

4. **Path Intellisense** - Autocomplete file paths
   - Extension ID: `christian-kohler.path-intellisense`

5. **Auto Rename Tag** - Rename HTML tags
   - Extension ID: `formulahendry.auto-rename-tag`

**To Install:**
1. Press `Ctrl + Shift + X`
2. Search for extension name
3. Click **Install**

### Useful Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open Terminal | `` Ctrl + ` `` |
| Command Palette | `Ctrl + Shift + P` |
| Quick File Open | `Ctrl + P` |
| Find in Files | `Ctrl + Shift + F` |
| Format Document | `Shift + Alt + F` |
| Go to Definition | `F12` |
| Toggle Sidebar | `Ctrl + B` |
| Split Editor | `Ctrl + \` |
| Close Terminal | `Ctrl + Shift + ` ` |

### VS Code Settings

**Enable Auto Save:**
1. **File** → **Preferences** → **Settings**
2. Search for "Auto Save"
3. Set to "afterDelay"

**Format on Save:**
1. Settings → Search "Format On Save"
2. Check the box

---

## 📁 Project Structure in VS Code

```
AttendanceRegister/
├── 📂 client/              # Frontend React app
│   ├── 📂 src/
│   │   ├── 📂 components/  # Reusable components
│   │   ├── 📂 pages/       # Page components
│   │   ├── 📂 context/     # State management
│   │   └── main.tsx        # Entry point
│   └── package.json
│
├── 📂 server/              # Backend Express app
│   ├── index.ts            # Server entry
│   ├── routes.ts           # API routes
│   ├── storage.ts          # Database operations
│   ├── websocket.ts        # WebSocket server
│   └── db.ts               # Database setup
│
├── 📂 PROJECT_REPORT/      # Your 50-page report
├── 📄 package.json         # Dependencies
├── 📄 tsconfig.json        # TypeScript config
└── 📄 README.md            # Project info
```

---

## 🐛 Debugging in VS Code

### Method 1: Using Console Logs

**Frontend (Browser Console):**
```typescript
console.log('Debug:', variable);
```
- Open browser DevTools: `F12`
- Check Console tab

**Backend (Terminal):**
```typescript
console.log('[DEBUG]', data);
```
- Output appears in VS Code terminal

### Method 2: VS Code Debugger

**Create `.vscode/launch.json`:**
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Server",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

**To Debug:**
1. Set breakpoints (click left of line number)
2. Press `F5` or click **Run and Debug**
3. Use debug controls to step through code

---

## 🔄 Common Development Tasks

### Restart the Server

**If server is running:**
1. In terminal, press `Ctrl + C`
2. Run `npm run dev` again

**Or use nodemon (auto-restart):**
```bash
npm install -g nodemon
nodemon server/index.ts
```

### Clear Database

**Method 1: Delete database file**
```bash
# In terminal
rm sqlite.db
# Server will recreate on next start
```

**Method 2: Use admin panel**
- Login to admin dashboard
- Click "Reset / Clear Data"

### View Database

**Install SQLite Viewer extension:**
1. Extension ID: `alexcvzz.vscode-sqlite`
2. Right-click `sqlite.db`
3. Select "Open Database"

### Check for Errors

**TypeScript errors:**
```bash
npm run type-check
```

**Lint errors:**
```bash
npm run lint
```

---

## 📊 Multiple Terminal Windows

You can run multiple terminals for different tasks:

### Terminal 1: Development Server
```bash
npm run dev
```

### Terminal 2: Watch TypeScript
```bash
npm run type-check -- --watch
```

### Terminal 3: View Logs
```bash
# View server logs
tail -f server.log
```

**To create new terminal:**
- Click `+` icon in terminal panel
- Or: `Ctrl + Shift + ` `

---

## 🎨 Live Preview in VS Code

### Option 1: Simple Live Server

1. Install "Live Server" extension
2. Right-click `index.html`
3. Select "Open with Live Server"

### Option 2: Browser Preview

1. Install "Browser Preview" extension
2. `Ctrl + Shift + P`
3. Type "Browser Preview: Open Preview"
4. Enter: http://localhost:5000

---

## 🔧 Troubleshooting

### Issue 1: "Port 5000 already in use"

**Solution:**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Or change port in server/index.ts
const PORT = 5001;
```

### Issue 2: "Module not found"

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

### Issue 3: "Cannot find module 'tsx'"

**Solution:**
```bash
npm install -g tsx
# Or use npx
npx tsx server/index.ts
```

### Issue 4: TypeScript errors

**Solution:**
```bash
# Rebuild TypeScript
npm run build
```

### Issue 5: Database locked

**Solution:**
```bash
# Stop server (Ctrl + C)
# Delete database
rm sqlite.db
# Restart server
npm run dev
```

---

## 📝 Git Integration in VS Code

### Initialize Git (if not done)
```bash
git init
git add .
git commit -m "Initial commit"
```

### VS Code Git Features

**Source Control Panel:**
- Click Source Control icon (left sidebar)
- Or press `Ctrl + Shift + G`

**Common Actions:**
- **Stage changes**: Click `+` icon
- **Commit**: Enter message, click ✓
- **View changes**: Click file in Source Control
- **Discard changes**: Click ↶ icon

---

## 🚀 Quick Start Checklist

- [ ] Open project folder in VS Code
- [ ] Open integrated terminal (`` Ctrl + ` ``)
- [ ] Run `npm install` (first time only)
- [ ] Run `npm run dev`
- [ ] Wait for "serving on port 5000" message
- [ ] Open browser to http://localhost:5000
- [ ] Test the application

---

## 📱 Testing on Mobile Devices

1. **Ensure mobile is on same WiFi**
2. **Find server IP** (shown in terminal)
3. **On mobile browser, visit:**
   ```
   http://[SERVER_IP]:5000
   ```
   Example: http://10.109.219.179:5000

4. **Scan QR code:**
   - Go to Admin Dashboard
   - Show QR code
   - Scan with mobile camera

---

## 🎯 Development Workflow

### Typical Development Session:

1. **Open VS Code**
   ```bash
   code d:\AttendanceRegister\AttendanceRegister
   ```

2. **Start server**
   ```bash
   npm run dev
   ```

3. **Open browser**
   - Navigate to http://localhost:5000

4. **Make changes**
   - Edit files in VS Code
   - Save (Ctrl + S)
   - Browser auto-refreshes

5. **Test changes**
   - Verify in browser
   - Check terminal for errors

6. **Commit changes** (optional)
   ```bash
   git add .
   git commit -m "Description of changes"
   ```

---

## 💡 Pro Tips

### 1. Split View
- Drag files to right side for split view
- Compare code side-by-side
- Shortcut: `Ctrl + \`

### 2. Multi-Cursor Editing
- Hold `Alt` and click to add cursors
- Edit multiple lines simultaneously

### 3. Quick File Navigation
- `Ctrl + P` → Type filename → Enter
- Faster than clicking through folders

### 4. Search Across Files
- `Ctrl + Shift + F`
- Find all occurrences in project

### 5. Integrated Git Diff
- Click file in Source Control
- See changes highlighted

### 6. Terminal History
- Press `↑` in terminal
- Recall previous commands

### 7. Zen Mode
- `Ctrl + K` then `Z`
- Distraction-free coding

---

## 📚 Additional Resources

**VS Code Documentation:**
- https://code.visualstudio.com/docs

**Node.js Documentation:**
- https://nodejs.org/docs/

**React Documentation:**
- https://react.dev/

**TypeScript Documentation:**
- https://www.typescriptlang.org/docs/

**Express Documentation:**
- https://expressjs.com/

---

## 🎓 Learning Path

If you're new to the stack:

1. **Week 1**: Learn TypeScript basics
2. **Week 2**: Understand React components
3. **Week 3**: Explore Express.js routing
4. **Week 4**: Study WebSocket communication
5. **Week 5**: Database operations with SQLite

---

## ✅ You're All Set!

Your development environment is ready. Happy coding! 🎉

**Need help?**
- Check the troubleshooting section
- Review the project documentation
- Refer to the presentation guide

**Quick Command Reference:**
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Run production build
npm run lint     # Check code quality
```

---

**Last Updated**: January 18, 2026
