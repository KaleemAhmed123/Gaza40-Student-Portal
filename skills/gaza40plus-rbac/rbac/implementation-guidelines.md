# Gaza40Plus RBAC Implementation Guidelines

This document outlines the engineering principles and implementation rules for developers introducing or modifying code affecting authorization, role checking, or resource scoping on the Gaza40Plus platform.

---

## 1. Centralization & Reuse of Security Logic

* **Keep Authorization Centralized**: House all role evaluations, permission structures, and helper guards in centralized modules. Do not write custom role checks directly inside inline controller logic.
* **Avoid Duplicating Permission Checks**: Reuse standard authorization routines (e.g., sharing a single ownership validator or assignment middleware) across different feature modules. Code duplication leads to inconsistent enforcement.
* **Declarative Guards**: Bind role constraints to endpoints at the routing or middleware layers declaratively to ensure that the code self-documents its access constraints.

---

## 2. Backend Enforcement as the Absolute Boundary

* **Perform Authorization in Backend Services or Middleware**: All security checkpoints must sit at the server layer where requests are parsed, before database transactions occur.
* **Never Rely Solely on Frontend Checks**: UI controls (such as hidden tabs, conditional buttons, and router redirects) are strictly visual enhancements. Do not trust payload values, roles, or session attributes transmitted purely by client-side state without backend verification.
* **Mandatory Review for New Endpoints**: Every new API endpoint introduced to the platform must undergo an authorization review. Developers must explicitly document which role(s), ownership, and regional constraints govern the endpoint.

---

## 3. Database Scoping & Relationship Verification

* **Filter Queries at the Database Level**: Do not fetch all records and filter them in-memory in application servers. Instead, embed ownership (`userId`) and regional (`regionId`) scopes directly into database query constraints.
* **Validate Relationship Assignment First**: Before pulling any protected resource details, verify the binding (e.g., student-to-mentor assignment) to fail early and prevent unauthorized queries.

---

## 4. Governance & Security Change Management

* **Document Review for New Assets**: Every new document type, attachment category, or file upload flow introduced requires an access review. Ensure they are mapped to the access matrix before coding.
* **Keep Security Documentation Synchronized**: Every new role or privilege adjustment requires updating the system-wide RBAC documentation (including `roles.md` and `document-access.md`). Code changes modifying authorization schemes must not be merged until documentation reflects the new policies.
