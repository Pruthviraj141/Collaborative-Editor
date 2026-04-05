# WriterFlow

WriterFlow is a collaborative document editor built for teams that want writing, diagramming, and real-time editing in one place. It combines a Tiptap-based writing experience with Excalidraw blocks, Yjs sync, and AI-assisted diagram generation.

## Live Demo

**Production URL:** https://pruthvi.tech

The app is live and actively deployed.

## What this project does

WriterFlow is designed to reduce context-switching during drafting and planning. Instead of moving between a text editor, whiteboard tool, and chat thread, teams can:

- write and structure documents,
- add or generate diagrams inline,
- collaborate with live cursors and presence,
- and keep everything persisted in a single workflow.

## Features

- **Real-time collaboration:** multi-user editing with live presence and collaborative cursors.
- **Rich text editing:** headings, lists, code blocks, quotes, and formatting controls.
- **Inline diagrams:** Excalidraw canvas blocks inside documents.
- **AI diagram generation:** convert natural language prompts into structured diagram elements.
- **Authentication and protected routes:** user sessions and access control for document actions.
- **Document workflow:** create, list, open, edit, save, share links, and PDF export.
- **Responsive UI with motion:** animated hero/landing interactions, smooth transitions, and a polished editing experience.

## Animations and UI direction

The current interface already uses motion and transition effects across landing and editor surfaces to keep interactions clear and modern. There is room to push this further with:

- more micro-interactions for toolbar/document actions,
- smoother section-to-section transitions,
- and richer visual feedback for collaboration states.

## Tech Stack

### Frontend
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Radix UI primitives

### Editor and Collaboration
- Tiptap
- Yjs
- Hocuspocus (provider + dedicated collaboration server)
- Excalidraw

### Backend and Data
- Next.js route handlers for API endpoints
- Supabase (Auth + Postgres)
- Zod validation
- jose (JWT handling for collaboration tokens)

### AI
- Groq Chat Completions API (configured model support for diagram generation)

### Deployment / Infrastructure
- Docker and Docker Compose
- Nginx reverse proxy
- AWS EC2

## Project Structure

```text
app/                      Next.js pages, layouts, and API route handlers
components/               UI, landing, editor, auth, and diagram components
hooks/                    Collaboration, editor state, and document hooks
lib/                      Auth, env, db access, diagram/collab utilities
collaboration-server/     Hocuspocus WebSocket collaboration backend
supabase/migrations/      Database schema and RLS migrations
nginx/                    Reverse proxy and SSL configuration
scripts/                  Deployment/server setup helpers
```

## Local Setup

If you want to run it locally:

1. Install dependencies

  - `npm ci`
  - `npm --prefix collaboration-server ci`

2. Set environment files

  - copy `.env.example` → `.env.local`
  - copy `collaboration-server/.env.example` → `collaboration-server/.env`

3. Run both services

  - `npm run dev`
  - `npm run collab:dev`

4. Open `http://localhost:3000`

## Deployment

Production is deployed on **AWS EC2** with a containerized setup:

- Next.js application container
- dedicated collaboration server container (Hocuspocus/Yjs)
- Nginx in front for routing and TLS termination

Deployment-related files are included in this repository (`Dockerfile`, `docker-compose.yml`, `nginx/`, and CI workflow assets).

## Future Improvements

- Expand animation consistency across dashboard and editor states.
- Add deeper performance optimizations for large collaborative documents.
- Improve version/history UX and restore experience.
- Extend AI diagram controls (style presets, layout modes, refinements).

## Development Notes

Some parts of this project were built with assistance from **Codex** during development.

## License

Package metadata currently uses the **ISC** license.
