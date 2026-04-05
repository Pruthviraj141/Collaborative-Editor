<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&height=220&color=0:0ea5e9,100:8b5cf6&text=WriterFlow&fontColor=ffffff&fontSize=54&fontAlignY=38&desc=Collaborative%20Writing%20%2B%20AI%20Diagrams&descAlignY=58&animation=fadeIn" alt="WriterFlow banner" />

<p>
  <img src="https://readme-typing-svg.herokuapp.com?font=Inter&weight=600&size=20&pause=1200&color=38BDF8&center=true&vCenter=true&width=780&lines=Real-time+collaborative+editor;AI-powered+diagram+generation;Next.js+%2B+Yjs+%2B+Hocuspocus+%2B+Supabase" alt="Typing intro" />
</p>

<p>
  <img src="https://img.shields.io/badge/Next.js-14-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-18-149eca?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tiptap-Editor-8b5cf6" alt="Tiptap" />
  <img src="https://img.shields.io/badge/Yjs-Realtime-16a34a" alt="Yjs" />
  <img src="https://img.shields.io/badge/Supabase-Backend-3ecf8e?logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ed?logo=docker&logoColor=white" alt="Docker" />
</p>

</div>

---

## ✨ Overview

**WriterFlow** is a modern collaborative writing platform built for fast drafting, live multi-user editing, and diagram-driven communication.

It combines:
- a rich editor experience,
- real-time presence and synchronization,
- AI diagram generation,
- and production-ready deployment with Docker + Nginx.

---

## 🎬 Animated Walkthrough (replace with your own GIFs)

> Drop your recordings in `docs/assets/` and keep these names to make this section live.

<div align="center">

| Flow | Preview |
|------|---------|
| Dashboard to document creation | <img src="docs/assets/01-create-document.gif" width="420" alt="Create document demo" /> |
| Real-time collaboration + presence | <img src="docs/assets/02-collaboration.gif" width="420" alt="Collaboration demo" /> |
| AI prompt to generated diagram | <img src="docs/assets/03-ai-diagram.gif" width="420" alt="AI diagram demo" /> |
| Export/share flow | <img src="docs/assets/04-export-share.gif" width="420" alt="Export and share demo" /> |

</div>

---

## 🧩 Core Features

- **Rich text editor** with formatting, quick insert tools, and writing-focused UI.
- **Live collaboration** powered by Yjs/Hocuspocus with active collaborator presence.
- **Embedded diagrams** using Excalidraw-style canvas blocks in documents.
- **AI diagram generation** from natural-language prompts.
- **Secure auth flow** for login/signup and protected routes.
- **Document management** including dashboard listing and editor sessions.
- **Production deployment path** with Docker Compose, Nginx, and EC2 automation.

---

## 🏗️ Architecture

```text
Browser (Next.js UI + Tiptap + Excalidraw)
   │
   ├── HTTP API (Next.js route handlers)
   │      └── Supabase (auth, data, persistence)
   │
   └── WebSocket (Yjs provider)
          └── Hocuspocus Collaboration Server
                 └── Supabase persistence
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|------|------------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| Editor | Tiptap, custom editor extensions |
| Diagramming | Excalidraw |
| Collaboration | Yjs, Hocuspocus |
| Backend/Data | Next.js API routes, Supabase |
| Auth | Supabase auth + local auth endpoints |
| Deployment | Docker, Docker Compose, Nginx, EC2 |

---

## 🚀 Quick Start (Balanced: Local + Docker)

### Option A — Local development

1) Install dependencies:

```bash
npm ci
npm --prefix collaboration-server ci
```

2) Configure environment files:

- Copy `.env.example` to `.env.local`
- Copy `collaboration-server/.env.example` to `collaboration-server/.env`

3) Start both services in separate terminals:

```bash
npm run dev
```

```bash
npm run collab:dev
```

4) Open:
- App: `http://localhost:3000`
- Collaboration server: `ws://localhost:1234`

---

### Option B — Docker development

1) Prepare env file:

- Copy `.env.example` to `.env.local`

2) Start the dev stack:

```bash
docker compose -f docker-compose.dev.yml up --build
```

3) Open:
- App: `http://localhost:3000`
- Collaboration server: `ws://localhost:1234`

---

## 🔐 Environment

Use these templates:
- `.env.example` (local/dev)
- `.env.production.example` (production)
- `collaboration-server/.env.example` (collab server)

Keep secrets private. Never commit real credentials.

---

## 📦 Production Deployment

Production stack includes:
- `nextjs-app` container
- `collab-server` container
- `nginx` reverse proxy + TLS termination

See full guide: **DEPLOYMENT.md**

---

## 🧪 Useful Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run collab:dev
npm run collab:build
npm run collab:start
```

---

## 🤖 AI Used

This project was created with help from **Codex**.

---

## 📁 Project Structure (high-level)

```text
app/                    Next.js App Router pages and API routes
components/             Reusable UI/editor/auth components
hooks/                  Collaboration/editor/document hooks
lib/                    Auth, DB, env, collab, diagram, utilities
collaboration-server/   Hocuspocus/Yjs collaboration backend
supabase/migrations/    SQL schema and RLS migrations
nginx/                  Reverse proxy and SSL config
scripts/                Deployment and server setup scripts
```

---

## 📌 Roadmap Ideas

- Version history UI and restore flow
- More export formats and templates
- Presence analytics and session replay
- Better AI diagram style presets

---

## 📝 License

Current package license field is `ISC`.
If needed, add a dedicated `LICENSE` file for explicit repository-level licensing.

---

<div align="center">

### Built for focused writing, visual thinking, and real-time teamwork.

</div>
