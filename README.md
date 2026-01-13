# 🚀 AI For Business Report (AFBR) v2.0

A full-stack AI-powered business analytics platform that transforms raw data into actionable insights and automated reports using GPT-4.

![Python](https://img.shields.io/badge/Python-3.10+-blue?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=black)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)

---

## 📋 Overview

AFBR v2.0 is a production-ready business intelligence tool that:

- **Extracts** data from connected databases (Supabase/PostgreSQL)
- **Analyzes** patterns using machine learning and statistical methods
- **Generates** AI-powered insights using GPT-4
- **Produces** professional PDF reports for stakeholder distribution

---

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React         │────▶│   FastAPI       │────▶│   PostgreSQL    │
│   Frontend      │     │   Backend       │     │   (Supabase)    │
│   (Vercel)      │     │   (Render)      │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │   OpenAI API    │
                        │   (GPT-4)       │
                        └─────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- Docker & Docker Compose (optional)

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/dlifeofjay/AFBR-Version-2.git
cd AFBR-Version-2

# Create environment file
cp .env.example .env
# Edit .env with your credentials

# Run with Docker Compose
docker-compose up --build
```

### Option 2: Manual Setup

**Backend:**
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Install dependencies
pip install -r requirements.txt

# Run the server
python main.py
```

**Frontend:**
```bash
cd afbr-frontend
npm install
npm start
```

---

## 🔧 Configuration

Create a `.env` file in the root directory:

```env
DATABASE_URL=postgresql://user:password@host:5432/database
OPENAI_API_KEY=sk-your-api-key
SUPABASE_JWT_SECRET=your-jwt-secret
CORS_ORIGINS=http://localhost:3000
```

---

## 📁 Project Structure

```
AFBR-Version-2/
├── app/
│   ├── api/          # API endpoints
│   ├── core/         # Database & config
│   ├── models/       # SQLAlchemy models
│   ├── schemas/      # Pydantic schemas
│   └── services/     # Business logic & AI
├── afbr-frontend/    # React application
├── main.py           # FastAPI entry point
├── requirements.txt  # Python dependencies
├── Dockerfile        # Container configuration
└── docker-compose.yml
```

---

## 🌐 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API info |
| `/health` | GET | Health check |
| `/api/*` | - | Main API routes |
| `/docs` | GET | Swagger documentation |

---

## 🚀 Deployment

**Backend (Render):**
- Connected to GitHub for auto-deploy
- Environment variables configured in Render dashboard

**Frontend (Vercel):**
- Automatic deployment from `afbr-frontend` directory
- Production URL: `https://afbr-version-2.vercel.app`

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Tailwind CSS |
| Backend | FastAPI, Python |
| Database | PostgreSQL (Supabase) |
| AI | OpenAI GPT-4 |
| Deployment | Docker, Render, Vercel |

---

## 👨‍💻 Author

**Jubril Ifekoya**  
Data Scientist & ML Engineer  
[LinkedIn](https://linkedin.com/in/jubril-ifekoya) | [GitHub](https://github.com/dlifeofjay)

---

## 📄 License

This project is for demonstration and portfolio purposes.
