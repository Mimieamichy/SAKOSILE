# Sakosile

Sakosile is a SaaS university project tracking and documentation platform built to support academic institutions, postgraduate offices, and research departments. This repository contains a TypeScript-based backend API and a React + Vite frontend application designed to manage student projects, defence scheduling, score sheets, notifications, analytics, checklists, readiness forms, and institution-level records.

## 📌 Project Overview

Sakosile helps university staff, students, and administrators manage postgraduate and undergraduate project workflows in a centralized platform. The system supports:


- User authentication and role-based access control
- Student project registration, tracking, and supervision
- Defence scheduling and score sheet management
- Notifications and audit logging
- Department, faculty, school, and institution management
- Readiness forms and checklist workflows
- Analytics dashboarding and administrative controls
- File uploads and static project document serving

## 🧱 Repository Structure

- `backend/` – Express API server written in TypeScript
- `frontend/` – React + Vite applicaion with TypeScript and Tailwind CSS
- `uploads/` – Static storage for uploaded files
- `projects/` – Project-related files and document storage

### Backend structure

- `backend/server.ts` – Entry point that initializes database connection and starts the server
- `backend/src/app.ts` – Express app configuration, middleware, routes, and cron job setup
- `backend/src/config/database.ts` – MongoDB connection configuration
- `backend/src/routes/` – API route definitions
- `backend/src/controllers/` – Request handlers and route logic
- `backend/src/models/` – Mongoose schema definitions
- `backend/src/services/` – Business logic and reusable services
- `backend/src/middlewares/` – Authentication, validation, upload handling, and permission enforcement

### Frontend structure

- `frontend/src/main.tsx` – React application bootstrap with authentication provider
- `frontend/src/App.tsx` – Main app shell and route handling
- `frontend/src/pages/` – Application pages for users, admin, faculty, students, and more
- `frontend/src/components/` – Shared UI components and page sections
- `frontend/src/lib/` – API service wrappers and utility helpers
- `frontend/src/store/` – Local state management hooks and stores
- `frontend/src/config/` – Frontend configuration, including environment usage

## 🚀 Tech Stack

### Backend

- Node.js + Express
- TypeScript
- MongoDB + Mongoose
- JWT authentication
- Helmet, rate limiting, CORS, and security middleware
- Multer file uploads
- Node cron for daily scheduled tasks
- Morgan request logging
- Nodemailer for email utilities

### Frontend

- React + TypeScript
- Vite
- Tailwind CSS
- React Router DOM
- React Hook Form
- React Query
- Axios
- Zod and form validation libraries
- Radix UI components
- Recharts for charting

## ⚙️ Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/<your-org>/FULafia-Electronic-Tracking-and-documentation-system.git
cd FULafia-Electronic-Tracking-and-documentation-system
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/` with at least the following values:

```env
MONGO_URI=mongodb://localhost:27017/etds
PORT=5000
NODE_ENV=development
```

### 3. Frontend setup

```bash
cd ../frontend
npm install
```

Create a `.env` file in `frontend/` with the backend API URL:

```env
VITE_BACKEND_URL=http://localhost:5000/api
```

### 4. Run both apps

Start the backend server:

```bash
cd backend
npm run dev
```

Start the frontend app:

```bash
cd frontend
npm run dev
```

Then open the Vite frontend URL shown in the terminal, typically `http://localhost:5173`.

## 🧪 Build and Production

Build the frontend:

```bash
cd frontend
npm run build
```

Build the backend:

```bash
cd backend
npm run build
```

Start the production backend server:

```bash
cd backend
npm start
```

> Note: If you change the frontend port or host, update `backend/src/app.ts` `allowedOrigins` and `frontend/.env` accordingly.

## 🔧 Environment Variables

### Backend

- `MONGO_URI` – MongoDB connection string
- `PORT` – Port for Express server (defaults to `5000`)
- `NODE_ENV` – `development` or `production`

### Frontend

- `VITE_BACKEND_URL` – URL of the backend API, e.g. `http://localhost:5000/api`

## 🧩 Features

### Core modules

- Authentication and user management
- Student onboarding and project assignment
- Lecturer and supervisor dashboards
- Department, faculty, institution, and school management
- Defence scheduling and score sheet generation
- Notification center and email triggering
- Analytics and dashboard reporting
- Checklist workflows and readiness forms
- Audit logs and PG admin utilities

### Backend details

- Protects auth routes with request rate limiting
- Uses secure headers via Helmet
- Supports static serving for uploaded files via `/uploads`
- Runs a daily cron job to check stale projects

### Frontend details

- Uses a global `AuthProvider` for session state
- Consumes `VITE_BACKEND_URL` for all API requests
- Includes role-specific dashboards for admin, student, lecturer, faculty, and PG admin
- Built using Vite for fast development

## 📂 Notes

- The backend stores uploaded files under `uploads/` and serves them through the `/uploads` route.
- The `projects/` folder is included for project resource data and may contain generated assets.
- If using Docker or a different deployment environment, ensure `MONGO_URI` and `VITE_BACKEND_URL` are configured correctly.

## 🪪 Useful Commands

### Backend

- `npm run dev` — start backend in development with `ts-node-dev`
- `npm run build` — compile backend TypeScript to `dist`
- `npm start` — run compiled backend

### Frontend

- `npm run dev` — start Vite development server
- `npm run build` — build production frontend
- `npm run preview` — preview built frontend locally

## 📬 Contact

For project support, issue tracking, or deployment questions, add a contact section here with your team or maintainer details.

---

Thank you for using Sakosile! If you want, I can also add a `backend/.env.example` and `frontend/.env.example` file for easier onboarding.
