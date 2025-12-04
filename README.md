## Description

Backend service for managing real estate transactions, their lifecycle, and commission distribution between the agency and agents.  
Built with NestJS, TypeScript, and MongoDB Atlas.

## Live API URL

- **Base URL**: `https://<your-deployment-url>`  
  Replace this with your actual deployed URL (e.g. Render/Railway/Fly.io).

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file in the project root:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster-host>/iceberg_case?retryWrites=true&w=majority
PORT=3000
```

- **MONGODB_URI**: MongoDB Atlas connection string.
- **PORT**: HTTP port for the NestJS app (defaults to 3000 if not set).

## Running the Project

### Local development

```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`.

### Production build

```bash
npm run build
npm run start:prod
```

## Running Tests

### Unit tests

```bash
npm run test
```

This runs:
- Commission calculation tests (`CommissionService`)
- Transaction service tests (`TransactionsService`, stage transitions and business rules)

### e2e tests (optional)

```bash
npm run test:e2e
```

## Main Endpoints (Summary)

- `POST /transactions` – Create a transaction.
- `GET /transactions` – List transactions.
- `GET /transactions/:id` – Get a transaction with financial breakdown (if completed).
- `PATCH /transactions/:id/stage` – Change transaction stage (`agreement`, `earnest_money`, `title_deed`, `completed`).  
  On `completed`, commission is calculated and stored.
