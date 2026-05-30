# Architecture Decision Records (ADRs)

This folder captures **why** key decisions were made, so future contributors don't have to re-litigate them. Each ADR is short and immutable once accepted; superseded decisions get a new ADR that references the old one.

## Format
Each ADR: Context → Decision → Consequences → Status.

## Index

| ID | Decision | Status |
|---|---|---|
| [0001](0001-backend-spring-authorization-server.md) | Backend: Spring Boot + Spring Authorization Server | Accepted |
| [0002](0002-database-postgresql.md) | Database: PostgreSQL only (abstracted for future engines) | Accepted |
| [0003](0003-tenant-isolation.md) | Tenant isolation: layered (app-layer + PostgreSQL RLS) | Accepted |
| [0004](0004-frontend-nextjs.md) | Frontend: Next.js + TypeScript | Accepted |
| [0005](0005-rbac-with-policy-layer.md) | RBAC now, ABAC/ReBAC-ready via PolicyEvaluator | Accepted |
