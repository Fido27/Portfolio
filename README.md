This is a [Next.js](https://nextjs.org) project with a FastAPI backend.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Appwrite + FastAPI setup

1) Create a `.env` file at the project root with:

```
# Appwrite (FastAPI)
APPWRITE_ENDPOINT=
APPWRITE_PROJECT=
APPWRITE_API_KEY=
APPWRITE_DATABASE_ID=
APPWRITE_COLLECTION_ID=

# Frontend
NEXT_PUBLIC_API_BASE=http://localhost:8000
```

2) Python server (one-time):

```
python -m venv venv
. venv/bin/activate
pip install -r requirements.txt
```

3) Start both servers:

```
uvicorn app.api.main:app --reload --port 8000
npm run dev
```
