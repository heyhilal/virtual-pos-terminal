# 💳 Virtual POS Terminal

A Virtual POS application built with **.NET 8 Web API** and **Angular**, developed during my internship. The project follows **Clean Architecture** principles and includes secure payment processing, idempotent requests, transaction management, and modern backend practices.

---

## ✨ Features

- 💳 Payment Processing
- ❌ Payment Cancellation
- 🔁 Idempotent Payment Requests (Redis)
- 📄 Transaction Management
- 📊 Payment Status Tracking (Success / Failed)
- 🛡️ Secure Logging (Card Number Masking)
- 🔄 Retry & Circuit Breaker with Polly
- ✅ Input Validation (Luhn Algorithm & FluentValidation)
- 🌐 RESTful API
- ⚡ CQRS + MediatR
- 🏛️ Clean Architecture
- 📦 Global Exception Middleware (RFC7807 Problem Details)
- 💾 PostgreSQL Integration
- 💳 Saved Cards (LocalStorage)
- 📍 Saved Addresses (LocalStorage)
- 🎟️ Coupon Support
- 🚚 Shipping Options
- 🎨 Angular Material Payment UI

---

## 🛠 Tech Stack

### Backend

- .NET 8 Web API
- ASP.NET Core
- Entity Framework Core
- PostgreSQL
- Npgsql
- MediatR
- CQRS
- Redis
- Polly
- Serilog
- FluentValidation

### Frontend

- Angular
- TypeScript
- Angular Material

### Database

- PostgreSQL

### Tools

- Docker (OrbStack)
- DBeaver
- Git

---

## 🧱 Architecture

The project is designed using **Clean Architecture**.

```
API
 │
 ▼
Application
 │
 ▼
Domain
 ▲
 │
Infrastructure
```

- **API** → Receives HTTP requests and routes them.
- **Application** → Contains business logic and use cases.
- **Domain** → Core business rules and entities.
- **Infrastructure** → Database, Redis, logging and external integrations.

---

## 🔄 Payment Flow

1. User submits payment information from Angular.
2. Card information is validated (Luhn Algorithm).
3. MediatR dispatches the request to the appropriate Command Handler.
4. Payment is processed.
5. Transaction is stored in PostgreSQL.
6. Payment status is recorded.
7. Sensitive data is masked before logging.
8. Redis prevents duplicate payment requests.
9. The payment result is returned to the client.

---

## ⚙️ Run Project

### Backend

```bash
cd CorePay.API
dotnet run
```

### Frontend

```bash
cd frontend
npm install
ng serve
```

---

## 👩‍💻 Developer

**Hilal Aslan**

---

## 📄 Note

This project was developed during my internship to gain hands-on experience with **Clean Architecture, CQRS, MediatR, Redis, Polly, Serilog, PostgreSQL, and Angular** while building a modern payment processing system.
