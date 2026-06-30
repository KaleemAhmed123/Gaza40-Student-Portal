# Gaza40Plus Engineering & Development Principles

This document defines the core engineering principles that all future code modifications, features, and refactoring efforts must adhere to. These principles ensure consistency, maintainability, security, and velocity across the codebase.

---

## 1. Code Reuse & Modularity

### Prioritize Reuse Over Creation
Before creating new services, hooks, utility functions, or UI components, verify if an equivalent or similar implementation already exists.
* **Reuse first**: Leverage existing UI components (`components/ui/*`) and custom hooks.
* **Extend rather than duplicate**: Extend the capabilities of existing components or utility functions with configuration options (e.g., props or parameters) rather than writing duplicate parallel implementations.
* **Avoid unnecessary files**: Do not create new source or config files if the logic can naturally reside within existing structures without breaking boundaries.

### Module Consolidation
* **Extension over parallel creation**: If a new feature closely resembles an existing domain or module, prefer adding endpoints/methods to that existing module rather than spawning a separate, overlapping module.

---

## 2. Separation of Concerns & Architecture

### Backend as the Source of Truth
* **Business Logic belongs in the Backend**: The frontend should remain thin and focused. Heavy data processing, domain rules, constraints, calculation workflows, and state persistence must be driven by backend services.
* **Backend Authorization is Absolute**: Frontend visibility controls (e.g., hiding buttons or menus) are purely for user experience. True security and authorization checks must be enforced at the API boundary on the backend.
* **Role-Based Access Control (RBAC)**: Actively evaluate user roles (e.g., student, mentor, admin) and RBAC rules whenever implementing endpoints or restricting resources.

### Presentation-Driven Frontend
* **UI Focus**: Keep React components primarily focused on presentation, styling, and direct user interaction.
* **Logic abstraction**: Extract state transitions and data mutations into custom hooks or state slices rather than embedding complex async flows or API parsing directly in component rendering trees.

### Dry Validation Boundaries
* **No Validation Duplication**: Establish single boundaries for data validation (e.g., request schema validations on the backend route boundary and typing structures on the frontend). Do not replicate identical validation algorithms in multiple layers; instead, rely on centralized schemas or shared models where possible.

---

## 3. Change Management & Safety

### Compatibility & Safety
* **Preserve Backward Compatibility**: When modifying database schemas, API contracts, or public helper signatures, ensure existing consumers do not break. Use optional parameters, defaults, and multi-phase migrations.
* **Evaluate Regression Risks**: Before modifying shared utility modules or core UI components, analyze the impact on all importing files. Even minor tweaks to shared modules can introduce regressions elsewhere in the application.

### Incrementalism & Refactoring
* **Incremental Changes**: Favor small, reviewable commits and pull requests over large-scale rewrites.
* **Architectural Review**: Before proposing or executing large refactors, document and explain the architectural impact, risks, and benefits to the team.

---

## 4. Code Quality & Standards

### Type Safety
* **TypeScript Integrity**: Maintain strict type safety across both frontend and backend. Avoid using `any` type casts, and proactively define robust interfaces, parameters, and return types.

### Code Consistency
* **Naming Conventions**: Follow the established conventions of the codebase (e.g., PascalCase for React components, camelCase for variables/functions, dot-separated extensions like `<module>.<layer>.ts` for backend structure, etc.).
