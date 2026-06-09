# Cloud Cost Optimizer

AI-Powered full-stack web application for monitoring, forecasting, and optimizing multi-cloud spending across AWS, Azure, and GCP.

## Features

- **Dashboard** — Real-time spend overview, multi-cloud comparison, daily trends, and service breakdown
- **Cost Analysis** — Filterable stacked area charts and detailed cost tables
- **Predictions** — ML forecasting with Linear Regression + Exponential Smoothing (30-day outlook)
- **Anomalies** — Isolation Forest-based anomaly detection with severity classification
- **Recommendations** — AI-generated optimization suggestions with estimated savings
- **Policy Manager** — Create and manage automated cost control policies
- **Simulation** — What-if analysis for resource configuration changes

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React, Tailwind CSS, Recharts, Axios, React Router, Lucide Icons |
| Backend | Python FastAPI, SQLAlchemy, SQLite |
| ML/AI | scikit-learn, pandas, numpy, statsmodels |

## Project Structure

```
cloud-cost-optimizer/
├── backend/
│   ├── main.py
│   ├── models.py
│   ├── database.py
│   ├── routers/
│   ├── ml/
│   ├── data/
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── components/
    │   ├── pages/
    │   └── api/
    └── package.json
```

## Prerequisites

- Python 3.10+
- Node.js 18+
- npm or yarn

## Setup Instructions

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

The API will start at **http://localhost:8000**. Interactive docs are available at **http://localhost:8000/docs**.

On first run, the app automatically:
- Creates the SQLite database (`cloud_costs.db`)
- Seeds 6 months of mock billing data for AWS, Azure, and GCP
- Populates sample optimization recommendations

### 2. Frontend

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

The app will start at **http://localhost:5173**.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/costs/summary` | Total spend per cloud this month |
| GET | `/api/costs/breakdown` | Daily costs by cloud + service |
| GET | `/api/costs/multicloud` | Side-by-side AWS vs Azure vs GCP |
| GET | `/api/predictions/forecast` | 30-day predicted costs |
| GET | `/api/anomalies/detect` | Detected cost anomalies |
| GET | `/api/recommendations/list` | AI recommendations with savings |
| POST | `/api/recommendations/apply` | Mark recommendation as applied |
| POST | `/api/policies/create` | Create a cost policy rule |
| GET | `/api/policies/list` | List all policies |
| POST | `/api/simulation/run` | Run resource change simulation |

## ML Models

- **Forecasting** — Combines scikit-learn `LinearRegression` (40%) with statsmodels `ExponentialSmoothing` (60%) for 30-day cost predictions with 95% confidence intervals
- **Anomaly Detection** — scikit-learn `IsolationForest` flags unusual daily spend per cloud/service with low/medium/high severity based on deviation percentage

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:8000` | Backend API URL for the frontend |

## License

MIT
