# ScholarX Task Dashboard

A modern MERN task management dashboard with an Express API, MongoDB-ready models, and a React client.

## What you get

- Task CRUD, filtering, and status updates
- Auth scaffold with JWT-based login and registration
- Dashboard metrics for workload and progress
- Responsive UI with a split-pane workspace layout

## Project structure

- `client` - React dashboard built with Vite
- `server` - Express API with auth and task routes

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure the server environment:

```bash
copy server\.env.example server\.env
```

3. Start both apps in development:

```bash
npm run dev
```

The client runs on Vite and proxies API calls to the Express server.

## Demo access

The server seeds a demo account on startup:

- Email: `demo@scholarx.dev`
- Password: `Password123!`

Use the demo login on the dashboard to explore the app immediately.

## Build

```bash
npm run build
```

## Notes

MongoDB support is scaffolded through Mongoose models. The app also works out of the box with the in-memory data store so you can run it without setting up a database first.
