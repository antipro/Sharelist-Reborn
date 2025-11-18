# Sharelist

A modern, real-time capable Todo list application built with React 19, TypeScript, and Tailwind CSS. It mimics a full-stack architecture (Node.js + MySQL + Socket.io) entirely within the browser using a sophisticated mock service layer.

## 🚀 Overview

Sharelist is designed as a "desktop-class" web application featuring a command-driven interface, real-time state synchronization simulation, and a robust user preference system (themes, languages, timezones).

## ✨ Key Features

### Desktop Application (Tauri)
- **Cross-Platform**: Runs natively on macOS, Windows, and Linux.
- **Native UI**: Frameless window design with custom drag regions.
- **Performance**: Built with Rust and Vite for minimal footprint.

### Authentication & User Management
- **Secure Flow**: Implements a multi-step registration process (Email → Verification Code → User Details).
- **Simulation**: Mock email service sends verification codes (displayed via browser alerts).
- **Preferences**: User-specific settings for **Dark/Light Theme**, Timezone, and Language.

### Project & Task Management
- **Command Bar**: A unified input interface:
  - Type text to create a task in the current project.
  - Type `#projectname` to create a new project instantly.
- **Real-time UX**: Optimistic UI updates with undo functionality for deleted items.
- **Organization**: Sidebar navigation for switching between projects.

## 📂 Project Structure

- **`src-tauri/`**: Rust backend for the desktop application.
- **`components/`**: UI Building blocks (AuthScreen, Dashboard, ProjectView, InputBar).
- **`context/`**: React Context providers for global state (Auth, Socket, App Data).
- **`services/`**: `mockService.ts` contains the core backend logic.

## 🔧 Configuration

The application can run in two modes: **Mock Mode** (Browser-only) or **Real Mode** (Connected to Node.js Backend).

### Switching to Real Server
To connect the client to the local Node.js server:

1. Create a file named `.env` in the root directory.
2. Add the following configuration:

```env
# Disable mock service
VITE_USE_MOCK=false

# Point to your local server
VITE_API_URL=http://localhost:3001
```

3. Restart the development server:
```bash
npm run dev
```

## 🎮 How to Run

### Web
```bash
npm install
npm run dev
```

### Desktop App
1. Ensure you have Rust installed.
2. Run the desktop development environment:
```bash
npm run tauri dev
```
3. Build for release:
```bash
npm run tauri build
```

### Server (Optional)
The project includes a full Node.js backend in `server/`.
1. Navigate to the server directory: `cd server`
2. Install dependencies: `npm install`
3. Setup MySQL database using `db/schema.sql`
4. Create a `.env` file in `server/` with DB credentials.
5. Run server: `npm start`