# AI Construction Operating System (AI COS)

## Project Overview
AI-powered Architecture, Civil Engineering, BIM, GIS, Construction Management, and Smart Infrastructure desktop application built with Electron + React + TypeScript + Node.js + Python.

## Architecture

```
ai-cos/
├── frontend/           # Electron + React + Vite desktop app
│   ├── electron/       # Electron main/preload (TypeScript)
│   ├── src/
│   │   ├── components/ # UI components, layout, 3d, gis, bim, chat
│   │   ├── pages/      # Route pages (10 pages)
│   │   ├── store/      # Zustand state management
│   │   ├── lib/        # Utilities, API client, constants
│   │   └── styles/     # Global CSS with design system
│   └── resources/      # Icons and assets
├── backend/            # Node.js + Express + Prisma API
│   ├── src/
│   │   ├── routes/     # Auth, Projects, BOQ, Tasks, etc.
│   │   └── middleware/ # JWT authentication
│   └── prisma/         # Schema + SQLite database
├── python-services/    # FastAPI AI microservices
│   └── app/            # AI agents, analysis, generation
├── shared/             # Shared TypeScript types
├── config/             # Configuration files
├── assets/             # Static assets
├── scripts/            # Build/deploy scripts
└── database/           # Database migrations
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite |
| Desktop | Electron, electron-builder |
| Styling | Tailwind CSS, ShadCN UI, Framer Motion |
| State | Zustand, TanStack Query |
| 3D/BIM | Three.js, React Three Fiber |
| GIS | Mapbox GL |
| Backend | Node.js, Express, Prisma ORM |
| Database | SQLite (local), PostgreSQL (cloud) |
| AI | Python, FastAPI, LangChain |
| Realtime | Socket.IO |
| Security | JWT, bcrypt, Helmet, rate-limit |
| Charts | Recharts |

## Commands

```bash
# Development (all services)
npm run dev

# Frontend only
cd frontend && npm run dev

# Backend only
cd backend && npm run dev

# Python services
cd python-services && python run.py

# Build frontend
cd frontend && npm run build

# Package Electron installer
cd frontend && npm run dist

# Database setup
cd backend && npx prisma db push
```

## Key Config Files

- `frontend/.env.local` - Frontend env vars (API URLs, Mapbox token)
- `backend/.env` - Backend env vars (JWT secret, DB URL)
- `python-services/.env` - Python env vars (API keys)
- `frontend/vite.config.ts` - Vite + Electron build config
- `frontend/tailwind.config.js` - Design system tokens
- `backend/prisma/schema.prisma` - Database schema

## API Endpoints

### Backend (port 3001)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Current user
- `GET/POST /api/projects` - Project CRUD
- `GET/POST /api/designs` - Design management
- `GET/POST /api/boq` - BOQ items
- `GET/POST /api/tasks` - Task management
- `GET/POST /api/documents` - Documents

### Python (port 8000)
- `POST /api/generate/design` - AI design generation
- `POST /api/generate/boq` - BOQ estimation
- `POST /api/analyze/gis` - GIS analysis
- `POST /api/analyze/structural` - Structural analysis
- `POST /api/generate/document` - Document generation

## Design System

- Dark/light mode with CSS variables
- Glassmorphism cards (`.glass`, `.glass-card`)
- Gradient text (`.text-gradient-primary`)
- Futuristic glow effects (`.glow-border`)
- Grid background pattern (`.bg-grid`)
- Custom scrollbar styles
- Animation utilities (framer-motion)

## Desktop Build

```bash
# Production installer
cd frontend && npm run dist

# Output: dist-electron/AI Construction OS Setup.exe

# Config: electron-builder in package.json
# - Windows: NSIS installer
# - Auto-updater support
# - Icons in resources/
```

## Known Commands for Development

```bash
# Type check frontend
cd frontend && npx tsc --noEmit

# Type check backend
cd backend && npx tsc --noEmit

# Generate Prisma client
cd backend && npx prisma generate

# Apply DB schema changes
cd backend && npx prisma db push
```
