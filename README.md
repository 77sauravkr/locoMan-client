# LocoMan Client

LocoMan is an AI travel guide you can type or talk to.
Server: https://github.com/77sauravkr/Locoman-server

React, Vite, Tailwind CSS.

## Features

Streaming replies with Markdown, voice questions with spoken answers, saved chats
(rename, delete), dark mode, mobile layout.

## Run locally

Start the server first (see its README), then:

```bash
npm install
npm run dev     # http://localhost:5182
```

`npm run lint`, `npm test` and `npm run build` are what CI runs.

## Deploy (Vercel)

`vercel.json` forwards `/api/*` to the server, so the browser sees one origin and the login
cookie works. If the server URL changes, edit the `destination` there.
No environment variables are needed. Never add API keys to this project: anything the
client reads is public.
