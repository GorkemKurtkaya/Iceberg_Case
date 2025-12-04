## Description

Backend service for managing real estate transactions, their lifecycle, and commission distribution between the agency and agents.  
Built with NestJS, TypeScript, and MongoDB Atlas.

## Live API URL

- **Base URL**: `https://icebergcase-production.up.railway.app/`  

## API Documentation

- Postman collection: `https://documenter.getpostman.com/view/33385054/2sB3dPR9ur`

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

- `GET /`  
  Simple HTML landing page describing the API, stages and commission rules.

- `GET /health`  
  Health check endpoint.  
  Returns a small HTML badge showing API status and MongoDB connection status.

- `POST /transactions`  
  Create a new transaction.  
  **Body:**
  - `propertyId: string (MongoId, required)`
  - `listingAgentId: string (MongoId, required)`
  - `sellingAgentId: string (MongoId, required)`
  - `totalServiceFee: number (required)`

- `GET /transactions`  
  List all transactions (sorted by `createdAt` descending).

- `GET /transactions/:id`  
  Get a single transaction by id.  
  If the transaction is `completed`, the `financialBreakdown` field includes:
  - `company` share
  - `agents[]` with `agentId`, `amount`, `reason`
  - `total`

- `PATCH /transactions/:id/stage`  
  Change the stage of a transaction.  
  **Body:**
  - `stage: 'agreement' | 'earnest_money' | 'title_deed' | 'completed'`  
  Stage transitions are validated (`agreement → earnest_money → title_deed → completed`).  
  When the new stage is `completed`, commission is calculated and stored on the transaction.
