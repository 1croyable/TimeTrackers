# TimeTrackers

A simple personal time tracker built with Vue 3, TypeScript, and Vuetify. Organize tasks, set goals, and see where your time goes.

## Features

- Create and edit tasks with daily and weekly goals.
- Choose a task, then start, pause, or stop a focus session.
- Review daily, weekly, and monthly summaries and recent sessions.
- View weekly activity charts and time spent on each task.
- Export and import JSON backups from Settings.

## Run locally

Install Node.js with npm, then run from the project root:

```sh
cd client
npm install
npm run dev
```

Open http://127.0.0.1:5173 in the browser.

## Data storage

Tasks, sessions, and the active timer are saved in your browser's localStorage under `timetrack-v1`. No account or backend is required.

Data stays in that browser and site address. Clearing site data removes it, and `localhost` and `127.0.0.1` have separate storage. Use JSON export to keep a backup or move your records to another browser.