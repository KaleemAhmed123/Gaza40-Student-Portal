# Gaza40Plus Frontend Architecture

This document summarizes the architectural patterns followed by the `Gaza40Plus` frontend repository.

---

## 1. Routing Pattern
The frontend utilizes the **Next.js App Router** architecture (located under `src/app/`).
* **File-System Based Routing**: Routes are declared implicitly through the folder hierarchy inside `src/app/` (e.g., `/admin`, `/chat`, `/login`).
* **Route Grouping & Segmenting**: The structure leverages segmented route folders, with entry pages defined in `page.tsx`.
* **Centralized Route Constants**: Standardized paths are managed cleanly via configuration helpers (e.g., `src/lib/routes.ts`).

---

## 2. Layout & Provider Structure
Page hierarchy and component wrapping follow Next.js layout patterns:
* **Nested Layouts**:
  * **Root Layout (`src/app/layout.tsx`)**: Controls global document HTML/body tags, configures internationalization/localization hooks, imports global CSS (`src/app/globals.css`), and mounts global React Context & Redux state providers.
  * **Nested layouts**: Route folders specify sub-layouts (e.g., setting up layout sidebars or dashboard navigation structures for specific user roles like `/mentor` or `/student`).
* **State & Connection Providers**: Global application contexts and store providers are injected at the layout level (e.g., `redux/providers.tsx` and `context/SocketContext.tsx`).

---

## 3. Component Organization
UI components are organized in a clean separation of concerns inside `src/components/`:
* **Design System Primitives (`src/components/ui/`)**: Contain leaf-node, stateless, or generic UI blocks (e.g., input components, dropdowns, specialized modals, and document/pdf viewers). These are highly reusable, customizable, and decouple logic from presentation.
* **Shared Elements (`src/components/shared/`)**: Contain layout-specific or cross-domain layout blocks (e.g., common sidebars, headers, and container structures) that are shared across page routes but are not part of the core primitive UI.

---

## 4. API & Adapter Layer
Backend communication and data retrieval follow a service-oriented client-side architecture:
* **Axios Instance Connection**: Managed centrally under `src/services/api/axiosInstance.ts` with custom settings for baseUrl, interceptors, and error handling.
* **Service Client Wrappers (`src/services/api/`)**: Domain-specific API services (e.g., `chatService.ts`, `notificationService.ts`) encapsulate raw endpoint paths and HTTP verbs, exposing clean async functions to features.
* **Data Adapters (`src/lib/apiAdapters.ts`)**: Serves as a mapping/transformation layer between backend payloads and client-side structures, ensuring changes in API schema do not directly break component expectations.

---

## 5. Shared Hooks & Local Logic
Stateful lifecycle behaviors and common functionalities are abstracted into custom React hooks:
* **Utility Custom Hooks (`src/hooks/`)**: House cross-cutting React logic such as translation helpers (`useTranslation.ts`) or query parameter selectors (`useUrlSelector.ts`).
* **Redux Hook Wrappers (`src/redux/hooks.ts`)**: Provide strongly-typed alternatives (`useAppDispatch`, `useAppSelector`) to standard Redux hooks, protecting components from runtime type-safety issues.
