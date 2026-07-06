💳 Virtual POS Terminal
A modern Virtual POS (Payment System) built with .NET 8 Web API and Angular.
The project simulates payment processing with a clean layered architecture, PostgreSQL database, and structured backend design principles.


🚀 Project Overview
This project is a backend-focused virtual payment system that handles payment requests, validates input, processes transactions, and returns structured API responses.
It is designed as a scalable RESTful API with a modern frontend interface.


✨ Features
Payment request processing
DTO-based request/response structure
Input validation (FluentValidation)
Global exception handling middleware
RESTful API architecture
Angular-based payment form UI
PostgreSQL database integration
Clean and scalable project structure


🛠 Tech Stack
Backend
.NET 8 (LTS)
ASP.NET Core Web API
Entity Framework Core 8
Npgsql (PostgreSQL provider)
FluentValidation
Custom Middleware (Global Exception Handling)
Frontend
Angular
TypeScript
HTML5 / SCSS
Database
PostgreSQL
Dev Tools
Git & GitHub
Docker (planned / optional)
DBeaver


🧱 Architecture
The project follows a layered architecture approach:
API Layer (Controllers)
Application Layer (DTOs, Services, Validation)
Infrastructure Layer (Database, External Services)
⚙️ Getting Started
Clone the repository
git clone https://github.com/heyhilal/virtual-pos-terminal.git
Backend setup
cd CorePay.API
dotnet restore
dotnet run
Frontend setup
cd frontend
npm install
ng serve


🗄 Database
PostgreSQL is used as the main database.
Connection string is configured in:
appsettings.json


📌 API Design
The API returns structured responses:
{
  "success": true,
  "message": "Payment processed successfully",
  "data": {}
}


👩‍💻 Developer
Hilal Aslan