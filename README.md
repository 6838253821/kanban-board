# Flowboard — Full-stack Kanban Board

A responsive Kanban board with three columns (To Do, Doing, Done). Supports creating, editing, moving (drag & drop or arrows), and deleting tasks. Data persists in Supabase via a Python FastAPI backend.

## Tech stack
- Database: Supabase Postgres
- Backend: FastAPI (Python)
- Frontend: React + TypeScript + Vite
- Deployment: Google Cloud Run (backend) + Cloudflare Pages (frontend)

## 1. Supabase
1. Create a Supabase project at https://supabase.com/dashboard.
2. Open **SQL Editor** and execute `schema.sql` from this repository.
3. From project settings, copy the **Project URL** and **service_role / secret API key**. NEVER put the secret key into the frontend or into GitHub.

Note: This simple class project provides one shared board, not multi-user private boards. Keep the backend API restricted or add authentication before using sensitive information or public production usage. An exposed API permits anyone to modify cards.

## 2. Run the API locally
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
cp .env.example .env
```
Fill in `backend/.env`. To load its values locally, run (in `backend`):
```bash
set -a; source .env; set +a
uvicorn main:app --reload --port 8000
```
Visit http://localhost:8000/docs and http://localhost:8000/health.

## 3. Run the frontend locally
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
Open http://localhost:5173. For a local API set `VITE_API_URL=http://localhost:8000`.

## 4. Upload to GitHub
Create a **public repository** (e.g. `kanban-board`), then from the project root:
```bash
git init
git add .
git commit -m "Build full-stack Kanban board"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/kanban-board.git
git push -u origin main
```
Don't commit any `.env` values or server-side secret.

## 5. Deploy backend to Google Cloud Run
1. Install Google Cloud CLI; select a Google Cloud project with billing enabled.
2. In project `backend/` folder, run:
```bash
gcloud run deploy kanban-api --source . --region asia-southeast1 --allow-unauthenticated
```
3. Configure **SUPABASE_URL**, **SUPABASE_SERVICE_ROLE_KEY**, and **FRONTEND_ORIGINS** using Cloud Run environment settings (prefer Secret Manager for the secret key). Redeploy if necessary.
4. Copy the resulting public `https://...run.app` service URL. Confirm `/health` works.

Security: deploying `--allow-unauthenticated` exposes create/delete actions to the public. It is acceptable only for a disposable classroom demo with no sensitive data; add authentication and rate limits before broader use.

## 6. Deploy frontend to Cloudflare Pages
1. Open Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git.
2. Choose repository. Configure:
   - Root directory: `frontend`
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Environment variable: `VITE_API_URL` = Cloud Run URL (no trailing slash)
3. Deploy. Copy `https://YOUR_PROJECT.pages.dev` URL.
4. Return to Cloud Run and configure `FRONTEND_ORIGINS=https://YOUR_PROJECT.pages.dev` (can list comma-separated origins).
5. Test adding, moving and deleting cards on the live site.

## Submission
- **Question 1 — GitHub Link:** `https://github.com/YOUR_USERNAME/kanban-board`
- **Question 2 — Deployed Link (Frontend):** `https://YOUR_PROJECT.pages.dev`

These are examples, **not** active URLs. Replace with links actually created in your accounts.
