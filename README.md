# Course Planner

A visual academic course design tool that allows curriculum designers to map units, pathways, learning outcomes, assessments, and teaching activities onto an interactive canvas.

Built as a Final Year Project at Monash University.

---

## Overview

The Course Planner provides two primary views:

- **Timeline Canvas** — arrange units spatially across semester and year positions, define prerequisite and corequisite relationships, and model multiple study pathways (Core, Major, Minor, Specialisation, Entry Point) simultaneously via an overlay mode.
- **Unit Internal Canvas** — drill into a single unit to map its learning outcomes, assessments, and teaching activities, including Bloom's Taxonomy classification and CLO alignment.

Additional views include a **Theme View** for grouping units by conceptual strand, and a **Home Page** for managing courses.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Zustand |
| Backend | Node.js, Express 5, TypeScript |
| Database | PostgreSQL (via Prisma ORM) |
| DB Hosting | Prisma Accelerate (or local PostgreSQL) |

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [PostgreSQL](https://www.postgresql.org/) (if running locally) **or** a [Prisma Accelerate](https://www.prisma.io/data-platform/accelerate) connection string
- npm

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/cameronh77/Course_Mapping_Tool.git
cd Course_Mapping_Tool
git checkout dev3
```

### 2. Configure the backend environment

Create a `.env` file inside the `backend/` directory:

```bash
cp backend/.env.example backend/.env   # if the example file exists, otherwise create manually
```

Add the following variables:

```env
# PostgreSQL connection string — choose one of the two formats below

# Option A: Prisma Accelerate (hosted)
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_API_KEY"

# Option B: Local PostgreSQL
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/course_planner"

# Optional — defaults to 3000 if not set
PORT=3000

# Optional — defaults to http://localhost:5173 if not set
CORS_ORIGIN=http://localhost:5173
```

Replace `USER`, `PASSWORD`, and `course_planner` with your local PostgreSQL credentials and desired database name.

### 3. Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 4. Run database migrations

From the `backend/` directory:

```bash
npx prisma migrate deploy
```

This applies all migrations in `backend/prisma/migrations/` to your database in order.

### 5. Generate the Prisma client

```bash
npx prisma generate
```

### 6. Seed the unit catalogue

The system ships with a catalogue of ~5,250 units sourced from the Monash University handbook. Load them into your database:

```bash
npm run prisma:seed
```

This is an upsert operation and is safe to run multiple times.

---

## Running the Application

Open two terminals.

**Terminal 1 — Backend:**

```bash
cd backend
npm run dev
```

The API will be available at `http://localhost:3000`.

**Terminal 2 — Frontend:**

```bash
cd frontend
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Project Structure

```
Course_Mapping_Tool/
├── backend/
│   ├── prisma/
│   │   ├── migrations/        # Full schema migration history
│   │   ├── data/
│   │   │   └── all_units.csv  # Monash unit catalogue (~5,250 units)
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── src/
│       ├── course/
│       ├── unit/
│       ├── course-unit/
│       ├── pathway/
│       ├── canvas-placeholder/
│       ├── unit-relationship/
│       ├── assessment/
│       ├── unit-learning-outcome/
│       ├── course-learning-outcome/
│       ├── teaching-activity/
│       ├── tag/
│       ├── theme-category/
│       └── server.ts
└── frontend/
    └── src/
        ├── components/
        ├── pages/
        ├── stores/            # Zustand state management
        ├── types/
        └── lib/
            └── axios.ts       # API base URL config
```

---

## Key Configuration Notes

- The frontend API base URL is hardcoded to `http://localhost:3000/api` in `frontend/src/lib/axios.ts`. If you run the backend on a different port, update this file.
- The backend CORS origin defaults to `http://localhost:5173`. Set `CORS_ORIGIN` in your `.env` to change it (multiple origins can be comma-separated).
- The `dev3` branch represents the version of the system evaluated in the accompanying research paper.

---

## Database Notes

- All schema changes are managed through Prisma migrations. Do not modify the database schema directly — add a new migration instead (`npx prisma migrate dev --name description`).
- The `backend/prisma/migrations/` directory contains the full history of schema changes from project inception, which can be used to trace the evolution of the data model.
- If using Prisma Accelerate, the `DATABASE_URL` must use the `prisma+postgres://` scheme. For a direct local connection, use the standard `postgresql://` scheme.

---

## Available Scripts

### Backend (`backend/`)

| Script | Description |
|---|---|
| `npm run dev` | Start backend with hot reload |
| `npm run start` | Start backend without hot reload |
| `npm run prisma:migrate` | Apply pending migrations (`prisma migrate deploy`) |
| `npm run prisma:seed` | Seed the unit catalogue |
| `npx prisma generate` | Regenerate the Prisma client after schema changes |
| `npx prisma studio` | Open Prisma Studio (database browser) |

### Frontend (`frontend/`)

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
