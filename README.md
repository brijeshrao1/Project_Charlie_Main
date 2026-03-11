<!-- PROJECT CHARLIE MAIN README -->
<p align="center">
  <img src="https://img.shields.io/badge/React-18.0-blue?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/Python-3.10-green?style=for-the-badge&logo=python" />
  <img src="https://img.shields.io/badge/FastAPI-2.3-black?style=for-the-badge&logo=fastapi" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" />
</p>

<h1 align="center">🌌 Project Charlie Main</h1>

<p align="center">
  <em>An intelligent multi-service application blending React, Python, and NLP — crafted for innovation, precision, and scale.</em>
</p>

<p align="center">
  <a href="#-overview">Overview</a> •
  <a href="#-repository-structure">Structure</a> •
  <a href="#-installation--setup">Installation</a> •
  <a href="#-configuration">Configuration</a> •
  <a href="#-troubleshooting">Troubleshooting</a> •
  <a href="#-maintainer">Maintainer</a>
</p>

---

## 🧭 Overview

**Project Charlie Main** is a modular **full-stack ecosystem** combining the power of modern web and AI technologies:

- ⚛️ **Frontend:** React-based UI (`frontend/`)
- 🐍 **Backend:** Python-based server providing APIs and static hosting (`Server/`)
- 🧠 **NLP Service:** Flask-powered microservice for natural language processing (`NLP/`)

Each component is designed for **scalability**, **separation of concerns**, and **easy local or production deployment**.

---

## 🧩 Repository Structure

```
Project_Charlie_Main/
├── frontend/
│   ├── client/         # React development source
│   ├── build/          # Production build
│   └── src/            # Components & assets
│
├── Server/             # Python backend server
├── NLP/                # Flask NLP microservice
│
├── main.py             # Orchestrator / demo entry point
│
├── uploads/            # Uploaded data
├── static/             # Static assets
├── User/               # User-related data
├── validation/         # Validation scripts & rules
└── ...
```

---

## ⚙️ Prerequisites

Before you start, ensure you have these installed:

- 🟢 **Node.js** ≥ 14  
- 🐍 **Python** ≥ 3.8  
- 🐳 **Docker** *(optional)*  
- 🔧 **Git**

---

## 🚀 Installation & Setup

### 🧠 Option 1: One-Click Setup (Recommended)

Use the ready-made `.bat` scripts for instant setup:

| Script | Description |
|--------|--------------|
| `install_nlp.bat` | Installs dependencies & runs the NLP Flask microservice |
| `install_backend.bat` | Sets up Python env & launches the Server backend |
| `install_frontend.bat` | Installs React packages & starts the frontend |

> 💡 **Order matters!**  
> Run them in this sequence:
> 1️⃣ `install_nlp.bat`  
> 2️⃣ `install_backend.bat`  
> 3️⃣ `install_frontend.bat`

Once all are running, visit 👉 **[http://localhost:3000](http://localhost:3000)** to experience the app.

---

### ⚡ Option 2: Manual Setup (For Devs Who Like Control)

#### 1️⃣ Clone the Repository
```bash
git clone <repo-url>
cd Project_Charlie_Main
```

#### 2️⃣ Frontend (React)
```bash
cd frontend/client
npm install
npm start
# OR for production build:
npm run build
```

The build will appear in `frontend/build/`.

#### 3️⃣ Backend (Python)
```bash
cd ../../Server
python -m venv .venv
.venv\Scripts\activate
pip install -r Requirements.txt
python Main.py
```

#### 4️⃣ NLP Microservice (Flask)
```bash
cd ../NLP
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

---

## 🌐 Default Ports

| Component | Port | URL |
|------------|------|------|
| Frontend (React) | 3000 | http://localhost:3000 |
| Backend (Server) | 8000 *(or custom)* | http://localhost:8000 |
| NLP (Flask) | 5000 | http://localhost:5000 |

> 🛠 If you change ports, update your `package.json` proxy or backend CORS settings.

---

## 🧮 Configuration

Use environment variables or a `.env` file for local development.

Example:
```
SECRET_KEY=your_secret_key
DATABASE_URL=mysql://user:pass@localhost:3306/charlie_db
NLP_SERVICE_URL=http://127.0.0.1:5000
```

---

## 🔐 Clerk Authentication (Frontend + Backend)

This project uses Clerk for user authentication. The frontend requests a Clerk-issued JWT and sends it in the `Authorization: Bearer <token>` header to the backend. The backend validates the JWT using Clerk's JWKS endpoint.

Frontend (React) configuration (`frontend/charlie_client/.env` or `.env.local`):

```
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key
# JWT template configured in Clerk dashboard (defaults used by this project)
REACT_APP_CLERK_JWT_TEMPLATE=backend
```

Backend (Server) configuration (`Server/.env`):

```
CLERK_JWT_REQUIRED=true
CLERK_ISSUER=https://your-instance-name.clerk.accounts.dev
# Optional, set if your JWT template sets an `aud` claim
CLERK_AUDIENCE=backend
# Optional override for JWKS URL
# CLERK_JWKS_URL=
```

**Server-side Clerk management (production grade)**

- Set `CLERK_API_KEY` in `Server/.env` (server secret) to enable administrative user management endpoints.
- Set `APP_ENV=production` in production to enable fail-fast env validation checks.
- The backend exposes admin endpoints (require `admin` role):
  - `GET /api/admin/clerk/users` — list users
  - `GET /api/admin/clerk/users/{user_id}` — get user
  - `PATCH /api/admin/clerk/users/{user_id}` — update allowed fields (`public_metadata`, `private_metadata`, `first_name`, `last_name`, `email_addresses`)

Usage notes:
- The backend validates Clerk JWTs using the configured `CLERK_ISSUER` and caches validated tokens for performance.
- Ensure your Clerk JWT template provides role information (e.g., `roles` claim) or map roles into `public_metadata` so the backend's `require_roles()` dependency can enforce access.
- For production, restrict `ALLOWED_ORIGINS`, enable HTTPS, and store `CLERK_API_KEY` in a secrets manager rather than in plain `.env` files.

How it works:
- Frontend uses the Clerk React SDK to sign in users and obtain a JWT (`getToken()`).
- The frontend API client (`frontend/charlie_client/src/services/api.js`) attaches the JWT to outgoing `/api` requests.
- The backend validates incoming tokens using `PyJWT` and `PyJWKClient` (see `Server/Main.py`).

Notes & recommendations:
- In development, the project ships with permissive CORS (allow all origins). Lock this down for production.
- Never commit secret keys or `.env` files to source control.
- Use HTTPS in production and configure allowed origins in Clerk app settings.


---

## 🛠️ Troubleshooting

| Issue | Cause | Solution |
|-------|--------|-----------|
| `npm install` fails | Corrupted cache | Delete `node_modules` + `package-lock.json`, rerun install |
| Python import errors | Venv not activated | Run `.venv\Scripts\activate` |
| Port conflicts | Another service running | Kill port or update settings |
| CORS errors | Mismatched origins | Enable CORS in backend |
| Missing env vars | `.env` not loaded | Check paths & environment |

---

## 🔒 Security Best Practices

- Never commit `.env` or credentials.  
- Use environment variables for secrets.  
- Deploy frontend over HTTPS.  
- Use reverse proxy (e.g., Nginx) for production.  
- Prefer Docker for clean deployment.

---

## 🧭 Development Notes

- 🎯 Frontend entry: `frontend/client/src/index.js`  
- ⚙️ Backend entry: `Server/Main.py`  
- 🧠 NLP entry: `NLP/app.py`  
- To rebuild frontend:  
  ```bash
  cd frontend/client && npm run build
  ```

---

## 🧰 Roadmap / Future Enhancements

- [ ] Add `.env.example` for config reference  
- [ ] Dockerize all modules (with docker-compose)  
- [ ] Add CI/CD workflow using GitHub Actions  
- [ ] Implement API documentation via Swagger  
- [ ] Introduce end-to-end test suites  
- [ ] Add dark mode UI for frontend 😎

---

## 🧑‍💻 Maintainer

**👤 Venkat (venkataramanTB)**  
> _Dreamer. Engineer. Creator._  
> Blending logic and lyricism into every line of code.  

<p align="left">
  <a href="https://github.com/venkataramanTB">
    <img src="https://img.shields.io/badge/GitHub-venkataramanTB-black?style=flat&logo=github" />
  </a>
  <a href="mailto:venkataraman@example.com">
    <img src="https://img.shields.io/badge/Email-Contact-blue?style=flat&logo=gmail" />
  </a>
</p>

---

## 🧠 Philosophy

> "_Code is not just logic — it's poetry in precision.  
> Every module, every method, tells a story of creation._"

---

## 📜 License

This project is licensed under the **MIT License**.  
Please check the repository’s `LICENSE` file for full details.  
Respect the license when reusing or distributing this code.

---

<p align="center">
  <img src="https://img.shields.io/badge/Built%20with%20❤️%20by-Venkat-red?style=for-the-badge" />
</p>

<p align="center">
  <em>“Project Charlie Main — where every line of code whispers a purpose.”</em>
</p>
