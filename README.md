<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&height=220&color=0:0ea5e9,100:8b5cf6&text=WriterFlow&fontColor=ffffff&fontSize=54&fontAlignY=38&desc=Collaborative%20Writing%20%2B%20AI%20Diagrams&descAlignY=58&animation=fadeIn" alt="Animated WriterFlow title banner with blue-to-violet wave background" />

<p>
  <img src="https://readme-typing-svg.demolab.com?font=Inter&weight=600&size=20&duration=2800&pause=1200&color=38BDF8&center=true&vCenter=true&width=860&lines=Real-time+collaborative+writing;AI-powered+diagram+generation;Built+with+Next.js%2C+Yjs%2C+Hocuspocus%2C+and+Supabase" alt="Animated typing subtitle describing WriterFlow core capabilities" />
</p>

<p>
  <img src="https://img.shields.io/badge/Next.js-14-black?logo=next.js" alt="Technology badge for Next.js 14" />
  <img src="https://img.shields.io/badge/React-18-149eca?logo=react" alt="Technology badge for React 18" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white" alt="Technology badge for TypeScript 5" />
  <img src="https://img.shields.io/badge/Yjs-Realtime-16a34a" alt="Technology badge for Yjs realtime collaboration" />
  <img src="https://img.shields.io/badge/Supabase-Backend-3ecf8e?logo=supabase&logoColor=white" alt="Technology badge for Supabase backend" />
</p>

</div>

# WriterFlow

WriterFlow is a collaborative document editor for teams that want writing, diagramming, and real-time editing in one place. It combines a Tiptap-based editor with Excalidraw blocks, Yjs synchronization, and AI-assisted diagram generation.

<p>
  <img src="https://capsule-render.vercel.app/api?type=waving&height=60&section=header&text=&fontSize=0&color=0:0ea5e9,100:8b5cf6&animation=twinkling" alt="Animated divider introducing live demo section" />
</p>

## Live Demo

**Production URL:** https://pruthvi.tech

The project is live and running in production.

<p>
  <img src="https://capsule-render.vercel.app/api?type=waving&height=60&section=header&text=&fontSize=0&color=0:22c55e,100:06b6d4&animation=twinkling" alt="Animated divider introducing project purpose section" />
</p>

## What this project does

WriterFlow reduces context-switching during planning and documentation. Instead of jumping between a text editor, whiteboard app, and separate collaboration tools, teams can:

- write and structure documents,
- generate or draw diagrams inline,
- collaborate with live cursors and presence,
- and keep the entire workflow persisted in one system.

<p>
  <img src="https://capsule-render.vercel.app/api?type=waving&height=60&section=header&text=&fontSize=0&color=0:8b5cf6,100:0ea5e9&animation=twinkling" alt="Animated divider introducing features section" />
</p>

## Features

- **Real-time collaboration:** multi-user editing with live presence and collaborative cursors.
- **Rich text editing:** headings, lists, code blocks, quotes, and formatting controls.
- **Inline diagrams:** Excalidraw canvas blocks directly inside documents.
- **AI diagram generation:** convert natural language prompts into structured diagram elements.
- **Authentication and protected routes:** secure sessions and controlled document actions.
- **Document workflow:** create, list, open, edit, save, share links, and PDF export.
- **Animated UI:** motion-based landing interactions, smooth transitions, and responsive polish.

<p>
  <img src="https://capsule-render.vercel.app/api?type=waving&height=60&section=header&text=&fontSize=0&color=0:f59e0b,100:ef4444&animation=twinkling" alt="Animated divider introducing animation strategy section" />
</p>

## Animations and UI direction

The current product already uses animation in key user-facing surfaces. To keep the experience smooth and readable, animation should stay purposeful:

- micro-interactions for toolbar and editor actions,
- clear transition states for loading/syncing/reconnecting,
- subtle collaborative feedback for presence and cursor changes,
- and consistent motion timing across landing, dashboard, and editor views.

<p>
  <img src="https://capsule-render.vercel.app/api?type=waving&height=60&section=header&text=&fontSize=0&color=0:14b8a6,100:6366f1&animation=twinkling" alt="Animated divider introducing tech stack section" />
</p>

## Tech Stack

### Frontend
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Radix UI

### Editor and Collaboration
- Tiptap
- Yjs
- Hocuspocus (provider + dedicated collaboration server)
- Excalidraw

### Backend and Data
- Next.js route handlers
- Supabase (Auth + Postgres)
- Zod validation
- jose (JWT for collaboration tokens)

### AI
- Groq Chat Completions API

### Deployment / Infrastructure
- Docker + Docker Compose
- Nginx reverse proxy
- AWS EC2

<p>
  <img src="https://capsule-render.vercel.app/api?type=waving&height=60&section=header&text=&fontSize=0&color=0:10b981,100:3b82f6&animation=twinkling" alt="Animated divider introducing project structure section" />
</p>

## Project Structure

```text
app/                      Next.js pages, layouts, and API route handlers
components/               UI, landing, editor, auth, and diagram components
hooks/                    Collaboration, editor state, and document hooks
lib/                      Auth, env, database access, and collaboration utilities
collaboration-server/     Hocuspocus WebSocket collaboration backend
supabase/migrations/      SQL schema and RLS migrations
nginx/                    Reverse proxy and SSL configuration
scripts/                  Deployment and server setup helpers
```

<p>
  <img src="https://capsule-render.vercel.app/api?type=waving&height=60&section=header&text=&fontSize=0&color=0:0ea5e9,100:9333ea&animation=twinkling" alt="Animated divider introducing local setup section" />
</p>

## Local Setup

1. Install dependencies

   - `npm ci`
   - `npm --prefix collaboration-server ci`

2. Configure environment files

   - copy `.env.example` to `.env.local`
   - copy `collaboration-server/.env.example` to `collaboration-server/.env`

3. Run both services

   - `npm run dev`
   - `npm run collab:dev`

4. Open `http://localhost:3000`

<p>
  <img src="https://capsule-render.vercel.app/api?type=waving&height=60&section=header&text=&fontSize=0&color=0:f97316,100:ec4899&animation=twinkling" alt="Animated divider introducing deployment section" />
</p>

## Deployment

Production is hosted on **AWS EC2** using a containerized architecture:

- Next.js app container
- dedicated Hocuspocus collaboration container
- Nginx for reverse proxy and TLS termination

Supporting infrastructure files are included in this repository, including `Dockerfile`, `docker-compose.yml`, and Nginx configuration.

<p>
  <img src="https://capsule-render.vercel.app/api?type=waving&height=60&section=header&text=&fontSize=0&color=0:22c55e,100:06b6d4&animation=twinkling" alt="Animated divider introducing future improvements section" />
</p>

## Future Improvements

- Expand animation consistency across dashboard and editor states.
- Improve perceived performance for large collaborative documents.
- Enhance version history and restore UX.
- Add richer AI diagram controls (layout presets and refinement actions).

<p>
  <img src="https://capsule-render.vercel.app/api?type=waving&height=60&section=header&text=&fontSize=0&color=0:6366f1,100:8b5cf6&animation=twinkling" alt="Animated divider introducing development notes section" />
</p>

## Development Notes

Some parts of this project were built with assistance from **Codex** during development.

<p>
  <img src="https://capsule-render.vercel.app/api?type=waving&height=60&section=header&text=&fontSize=0&color=0:64748b,100:334155&animation=twinkling" alt="Animated divider introducing license section" />
</p>

## License

Package metadata currently uses the **ISC** license.

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&height=120&section=footer&color=0:0ea5e9,100:8b5cf6&animation=fadeIn" alt="Animated footer wave for README closing" />

</div>
