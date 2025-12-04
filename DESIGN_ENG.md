## 1. Architecture & Data Model

### 1.1. Overall Architecture

- **AppModule**
  - Uses `ConfigModule.forRoot({ isGlobal: true })` for environment variable management.
  - Uses `MongooseModule.forRoot(process.env.MONGODB_URI)` to connect to MongoDB Atlas.
  - Imports `TransactionsModule` to isolate the domain logic into a dedicated module.

- **TransactionsModule**
  - `TransactionsController`  
    - HTTP endpoints:
      - `POST /transactions`
      - `GET /transactions`
      - `GET /transactions/:id`
      - `PATCH /transactions/:id/stage`
    - Responsible only for HTTP-level routing, DTO usage, and response handling.
  - `TransactionsService`  
    - Creates transactions (`create`)
    - Fetches a single transaction (`getById`)
    - Lists transactions (`list`)
    - Updates transaction stage (`updateStage`)
    - Contains stage transition rules (`ALLOWED` state machine map)
    - Triggers commission calculation when the stage becomes `completed`.
  - `CommissionService`  
    - Encapsulates the logic for splitting the total service fee between the company and the agents.
    - Company share: 50%
    - Agents share: 50% → if there is a single agent they get the full 50%, if there are two they split it equally.
    - Keeping the commission policy in a separate service makes it easier to evolve independently.
  - `Transaction` Mongoose schema  
    - Represents the main domain document on the Mongo side.

- **Cross-Cutting Concerns**
  - `HttpExceptionFilter`
    - Catches all `HttpException` types.
    - Standardizes responses into `BaseResponse` format: `{ DATA, MESSAGE, STATUS_CODE, SUCCESS }`.
    - If the error comes from DTO validation and uses the prefixed convention, returns that message as-is; otherwise maps to a generic message using `ResponseMessages` enum.
  - `BaseResponse<T>`
    - Provides a single, consistent response body structure for all API outputs.
  - `ValidationMessages.enum` and `ResponseMessages.enum`
    - Centralize validation and error messages in a type-safe manner.
    - DTOs and services share the same message generation mechanism.

With this structure:
- Controllers remain thin and HTTP/DTO-focused.
- Business rules are concentrated in the service layer (`TransactionsService`, `CommissionService`).
- Cross-cutting aspects such as error formatting and message generation live in dedicated components.

### 1.2. MongoDB Data Model

#### Transaction Document

`Transaction` schema:

- `propertyId: ObjectId`
- `listingAgentId: ObjectId`
- `sellingAgentId: ObjectId`
- `totalServiceFee: number`
- `stage: 'agreement' | 'earnest_money' | 'title_deed' | 'completed'`
- `financialBreakdown: { company: number; agents: { agentId: ObjectId; amount: number; reason: string }[]; total: number } | null`
- `createdAt`, `updatedAt` (Mongoose `timestamps`)

**Stage Management**

- The `stage` field:
  - Is stored in the document.
  - Is also used by the `ALLOWED` map as a state machine to enforce valid transitions:
    - `agreement → earnest_money → title_deed → completed`
- When transitioning to `completed`:
  - `CommissionService.calculate(...)` is called.
  - The returned breakdown is stored in the `financialBreakdown` field.

**Financial Breakdown Approach (Embedded)**

- The financial breakdown is stored directly inside the `Transaction` document:
  - A single query can return both the transaction and “who earned how much”.
  - Reduces the need for additional joins/aggregations on the read path.

This model satisfies the case’s core requirements in a simple and readable way:
- Tracking the transaction lifecycle
- Implementing commission distribution
- Providing a clear, transparent financial view per transaction

### 1.3. Alternatives and Why They Were Not Chosen

#### Alternative 1: Separate `CommissionPayout` Collection

- Example model:
  - `CommissionPayout { transactionId, agentId, role, amount, companyShare? }`
- Pros:
  - More flexible for heavy reporting scenarios (e.g. pure agent-based reports).
  - Would fit better if commission records had a distinct lifecycle (cancellation, corrections, etc.).
- Cons:
  - Requires extra queries/aggregation to view the financial breakdown for a single transaction.
  - Adds complexity that is unnecessary for the scope and timeline of this case.
- Therefore, for simplicity and readability, the **embedded breakdown** approach was preferred.

#### Alternative 2: Do Not Store the Commission, Recalculate on Every Read

- Only `totalServiceFee`, `listingAgentId` and `sellingAgentId` would be stored.
- Every `GET /transactions/:id` would recalculate the commission.
- Pros:
  - No data migration required if commission rates change in the future.
- Cons:
  - Loses the exact rule set and outcome that was applied at the time the transaction was completed (weaker auditability).
  - Makes it harder to reason about “what actually happened” if discounts, campaigns or special agreements are introduced.
- For these reasons, persisting the computed breakdown on the transaction is safer from a traceability standpoint.

---

## 2. Most Challenging / Riskiest Part

### 2.1. Storing Financial Breakdown Inside the Transaction

- **Risk**
  - If the system grows and the number of transactions and reporting needs increase:
    - Transaction documents might become large.
    - Some report queries may require more careful indexing and performance optimization.
- **Risk Mitigation**
  - Commission logic is abstracted in `CommissionService`:
    - If we later decide to move the breakdown to a separate collection, we can do so by updating this service and the `financialBreakdown` field on the `Transaction` schema.
  - `financialBreakdown` is nullable, so phased migration is possible if we introduce a new storage model.

### 2.2. Enforcing a Strict State Machine for Stage Transitions

- **Risk**
  - In real life, rollback or manual correction scenarios might be necessary:
    - E.g. moving from `title_deed` back to `earnest_money`,
    - Or exceptional edits on a `completed` transaction.
  - The current `ALLOWED` map only supports forward transitions.
- **Risk Mitigation**
  - The case description focuses on an “ideal, trackable transaction flow”, so a simple forward-only state machine was chosen.
  - Because transition rules are centralized in `ALLOWED`:
    - It is easy to add rollback/cancel stages or allow special transitions later.
    - If needed, the map can be replaced by a configuration table or an external rule engine.

---

## 3. If Implemented in Real Life — What Next?

### 3.1. Auditing and History

- Why:
  - For real estate transactions, “who changed the stage to what and when” is critical from both legal and operational perspectives.
  - Currently only the latest state is stored.
- Potential Improvement:
  - Add a `TransactionHistory` document or an embedded `history` array on `Transaction`:
    - `{ stageFrom, stageTo, changedBy, changedAt, note }`
  - Record a history entry for every `updateStage` call automatically.

### 3.2. Authentication and Authorization (Auth & RBAC)

- Why:
  - In a real system there would be multiple roles: admin, agent, accounting, etc.
  - Each role may have different read/write permissions over transactions.
- Potential Improvement:
  - Introduce a NestJS `AuthModule` (e.g. JWT based).
  - Add role-based guards:
    - Some roles can only read.
    - Stage updates and commission visibility can be restricted to specific roles.

### 3.3. Configurable Rule Engine for Commission Policy

- Why:
  - Currently the rule is fixed: 50% company, 50% agents; if a single agent then 50%, if two agents then 25% + 25%.
  - In reality there may be campaigns, different property types, or custom agreements.
- Potential Improvement:
  - Make commission rules configurable:
    - For example, a `CommissionRule` collection or a small rule engine.
    - Determine rates based on property type, location, date range, etc.
  - `CommissionService` would read and apply these rules instead of using hard-coded constants.

### 3.4. Reporting and Dashboards

- Why:
  - Management typically needs:
    - Periodic revenue,
    - Agent performance,
    - Company vs. agents income ratios.
- Potential Improvement:
  - Add dedicated report endpoints (e.g. `/reports/...`).
  - Use projections, aggregation pipelines and appropriate indexes for report queries.

### 3.5. Operational Improvements

- Queue or event-driven architecture:
  - For high volume systems, make stage transitions and commission calculations asynchronous.
- Observability:
  - Structured logging,
  - Metrics (e.g. Prometheus / Grafana),
  - Health and readiness endpoints for production-grade monitoring.

