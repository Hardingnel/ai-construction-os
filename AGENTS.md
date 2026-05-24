# AI Construction Operating System (AI COS)

## Architecture — Hybrid Web + Desktop Platform

```
ai-cos/
├── web/                  # Next.js 14 Web Application (PRIMARY)
│   ├── src/app/          # App router: page.tsx, login, dashboard
│   ├── src/components/   # Shared React components
│   ├── src/lib/          # API client, utilities
│   └── src/store/        # Zustand (persisted)
│
├── frontend/             # Electron Desktop App (SECONDARY CLIENT)
│   ├── electron/         # Electron main/preload
│   ├── src/pages/        # 10 route pages
│   ├── src/components/   # UI, layout, sync, 3d, gis, bim, chat
│   ├── src/services/     # Sync engine, offline cache
│   ├── src/hooks/        # useSync hook
│   └── src/store/        # Zustand (persisted)
│
├── backend/              # MASTER API SERVER (port 3001)
│   ├── src/routes/       # auth, projects, designs, boq, tasks,
│   │                     # documents, team, sync, upload, realtime
│   ├── src/services/     # syncService, storageService
│   ├── src/middleware/   # JWT auth, zod validation
│   └── prisma/           # SQLite schema + seed data
│
├── python-services/      # AI Microservices (port 8000)
│   └── app/              # FastAPI: design gen, BOQ, GIS, structural
│
├── shared/               # Shared TypeScript types
├── config/               # Config files
├── assets/               # Static assets
└── scripts/              # Build/deploy scripts
```

## System Roles

| Component | Role | Tech |
|-----------|------|------|
| **Web App** (port 3000) | Primary user interface, central platform | Next.js 14, React 18, Tailwind |
| **Desktop App** (port 5173) | High-performance client, offline-capable | Electron, React 18, Vite |
| **Backend API** (port 3001) | Master data + auth + sync server | Express, Prisma, SQLite |
| **Python AI** (port 8000) | AI/ML processing microservices | FastAPI, LangChain |
| **Python Manager** (in backend) | Auto-starts/restarts Python AI, health checks every 15s, max 5 retries with exponential backoff | Node.js child_process |

## Data Flow

```
Web Browser ──► Next.js App ──► Backend API ◄── Electron Desktop
                                      │
                                 Python AI Services
```

- The **backend** is the single source of truth
- Both web and desktop apps consume the same REST APIs
- Desktop has a **sync engine** for offline/background sync with conflict resolution
- Desktop uses an **offline cache** with TTL-based invalidation
- **Socket.IO** provides realtime collaboration across both platforms

## Python Service Manager

The backend includes an automatic Python AI service manager (`backend/src/services/pythonServiceManager.ts`):
- **Auto-start**: Python AI starts when backend starts (via `index.ts`)
- **Health checks**: Every 15s via `GET /api/health` on port 8000
- **Auto-restart**: On crash/exit, retries up to 5 times with exponential backoff (2s, 3s, 4.5s, 6.75s, 10.125s)
- **Status API**: `GET /api/python/status` shows availability, PID, uptime, retry count, last error
- **Restart API**: `POST /api/python/restart` (authenticated) manually restarts the service
- **Fallback**: If Python AI is offline, `/api/generations` uses a local fallback engine and marks results with `_fallback: true`
- **Service script**: `python-services/service.py` (production mode via uvicorn.Server, handles SIGTERM/SIGINT)

## Key Commands

```bash
# HYBRID: Start everything (web + desktop + backend + python)
start-hybrid.bat

# Individual services
cd web && npm run dev           # Web app (port 3000)
cd frontend && npm run dev      # Desktop app (port 5173)
cd backend && npm run dev       # Backend API (port 3001)
cd python-services && python service.py  # AI (port 8000) — production
cd python-services && python run.py       # AI (port 8000) — dev with hot-reload

# Build
cd frontend && npm run build    # Desktop production build
cd backend && npm run build     # Backend TypeScript compile

# Desktop installer
cd frontend && npm run dist     # Windows .exe installer

# Database
cd backend && npx prisma db push && npx tsx src/seed.ts
```

## API Endpoints

### Master Backend (port 3001)
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Sign in |
| GET | /api/auth/me | Current user |
| GET/POST/PUT/DELETE | /api/projects | Project CRUD |
| GET/POST/DELETE | /api/designs | Design management |
| GET/POST/PUT/DELETE | /api/boq | BOQ items |
| GET/POST/PUT/DELETE | /api/tasks | Tasks with assignees |
| GET/POST/DELETE | /api/documents | Project documents |
| GET/POST/DELETE | /api/team | Team management |
| POST | /api/sync | Single sync operation |
| POST | /api/sync/batch | Batch sync operations |
| POST | /api/sync/snapshot | Full sync snapshot |
| POST | /api/sync/resolve-conflict | Conflict resolution |
| POST | /api/upload | File upload (single) |
| POST | /api/upload/multiple | File upload (multiple) |
| POST | /api/realtime/comments | Realtime comments |

### Python AI (port 8000)
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/generate/design | AI building design |
| POST | /api/generate/boq | BOQ estimation |
| POST | /api/analyze/gis | GIS/terrain analysis |
| POST | /api/analyze/structural | Structural engineering |

## Sync Architecture

```
Desktop App                    Backend
    │                             │
    ├─ enqueue(op) ──────────────►│─ processSync()
    │◄── { success, data } ──────┤
    │                             │
    ├─ syncSnapshot(lastSync) ───►│─ getSyncSnapshot()
    │◄── { projects, designs } ──┤
    │                             │
    │  Conflict Detection:        │
    │  If version mismatch ───────► 409 Conflict
    │◄── { serverData, local } ──┤
    │─ resolveConflict() ─────────►
```

- **Auto-sync** every 30 seconds
- **Offline queue** persists in localStorage
- **Max 3 retries** per operation
- **TTL-based cache** (5 min default)
- **Online/offline listeners** for connectivity changes

## Desktop Executable

```bash
cd frontend && npm run dist
# Output: release/AI Construction OS Setup.exe
# Config: electron-builder in package.json
# - Windows: NSIS installer
# - Auto-updater: electron-updater
# - Icons: resources/icon.svg
# - Frame: frameless with custom title bar
```
