# Architecture Guide: Learning Portal Platform

## 1. Selected Architecture Pattern

The application will be built using a **Scalable Monolith with an Edge-First architecture**. This pattern was chosen to balance development velocity with high performance and scalability, directly addressing the requirements in the PRD for a global, high-performance platform supporting 100K+ users.

-   **Monolithic Core (Next.js):** The core application logic, UI, and routing will be managed within a single Next.js 14 application. This simplifies development, state management, and initial deployment.
-   **Edge-First Functions:** Critical, low-latency operations like authentication, session management, and API requests will be deployed as Vercel and Supabase Edge Functions. This moves compute closer to users worldwide, ensuring sub-100ms response times.
-   **Decoupled Services:** Specialized functionalities are delegated to best-in-class third-party services (Clerk for auth, Mux for video, Supabase for database), which are integrated via APIs. This avoids reinventing the wheel and leverages expert solutions for complex problems.

This hybrid approach allows for rapid iteration like a traditional monolith while achieving the global performance and scalability characteristic of a distributed microservices architecture.

## 2. State Management

-   **Frontend State:** We will use a combination of **Zustand** for centralized global state and **TanStack Query (React Query)** for server state management, as specified in `tech_choices.md`.
    -   **Zustand:** Manages minimal, global UI state such as theme (dark/light mode) or mobile navigation visibility. Its small bundle size is critical for mobile performance.
    -   **TanStack Query:** Handles all server-side data fetching, caching, and synchronization. It provides optimistic updates for actions like course progress tracking and intelligent background data refetching, which is essential for the PWA's offline capabilities.
-   **Backend State:** The primary backend state (user data, course content) is managed by **Supabase (Postgres)**. For high-performance session management and caching of frequently accessed data, **Redis** will be used, as outlined in the tech choices.

## 3. Technical Stack

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend** | **Next.js 14 (React 18)** | SSR, SSG, and Edge Runtime for performance and SEO. |
| **UI Framework** | **Tailwind CSS + Headless UI** | Utility-first CSS for rapid, custom, and responsive design. |
| **Backend** | **Vercel/Supabase Edge Functions** | Low-latency, scalable, serverless compute for API logic. |
| **Database** | **Supabase (PostgreSQL)** | Scalable, reliable relational database with Row-Level Security. |
| **ORM** | **Prisma** | Type-safe database access for TypeScript backend. |
| **Authentication** | **Clerk** | Sub-100ms authentication, MFA, social logins, and session management. |
| **Authorization** | **CASL (Client/Server) + RLS (DB)** | Fine-grained, multi-layer permission control. |
| **Video Delivery**| **Mux** | Adaptive bitrate streaming and video analytics. |
| **Caching** | **Redis** | Session storage and caching of hot data. |
| **Deployment** | **Vercel** | Edge-first hosting, CI/CD, and analytics. |

## 4. Authentication & Authorization Flow

1.  **Registration/Login:** User signs up or logs in via a Clerk-provided UI component embedded in the Next.js app. Clerk handles social logins, MFA, and email verification.
2.  **Token Issuance:** Upon successful authentication, Clerk generates a short-lived JSON Web Token (JWT) and stores it securely in an `HttpOnly` cookie.
3.  **Request Authentication:** On subsequent requests to the backend, the JWT is sent automatically. A Vercel Edge Middleware validates the JWT using Clerk's public key. Invalid or expired tokens are rejected.
4.  **Authorization:**
    -   **Client-Side:** CASL rules are used to conditionally render UI elements based on the user's role (e.g., an "Edit Course" button is only shown to Instructors).
    -   **Server-Side:** The API endpoint (Edge Function) re-validates the user's permissions using CASL.
    -   **Database-Level:** All database queries are subject to Supabase's Row-Level Security (RLS) policies, ensuring a user can only access data they own or have explicit permission to view.

## 5. High-Level Route Design

-   **Frontend Routes (Next.js App Router):**
    -   `/`: Homepage
    -   `/courses`: Course catalog and search page.
    -   `/courses/[courseId]`: Course detail and content consumption page.
    -   `/dashboard`: Personalized dashboard for enrolled students.
    -   `/profile`: User profile management.
    -   `/instructor/*`: Instructor-specific views for course creation and management.
    -   `/admin/*`: Admin panel for user and platform management.
-   **Backend API Endpoints:**
    -   `/api/graphql`: A single GraphQL endpoint to handle all data queries and mutations, providing an efficient data-fetching layer for the frontend.
    -   `/api/auth/*`: Handled by Clerk's Next.js SDK for authentication callbacks.
    -   `/api/webhooks/*`: For receiving events from third-party services like Mux (video processing) or Stripe (payments).

## 6. API Design Philosophy

The project will use **GraphQL** as its primary API design philosophy.

-   **Efficiency:** A single GraphQL endpoint allows the frontend to request all the data it needs for a specific view in one round trip, which is critical for performance on the student dashboard and course pages.
-   **Real-Time:** GraphQL Subscriptions will be used to power real-time features like live chat and collaboration, as outlined in Phase 4 of the implementation plan.
-   **Type Safety:** A GraphQL schema provides a strongly-typed contract between the frontend and backend.
-   **Performance:** We will use the **DataLoader** pattern to solve the N+1 query problem and **Redis** for caching query results, ensuring the API remains fast under load.

## 7. Database Design Overview

The database will be **Supabase (Postgres)**. While the detailed schema will be designed by the Data Architect, the core entities are derived from the PRD:

-   `users`: Stores user profile information, linked to Clerk for authentication.
-   `roles`: Defines user roles (Student, Instructor, Admin).
-   `permissions`: Defines fine-grained permissions for actions.
-   `role_permissions`: Maps permissions to roles.
-   `courses`: The main table for course information.
-   `modules`, `lessons`, `activities`: Defines the hierarchical structure of a course.
-   `enrollments`: Maps users to the courses they are enrolled in.
-   `progress`: Tracks user progress through lessons and courses.

**SQLModel** will be used as the ORM for the initial Python-based prototyping and scripting, while **Prisma** will be used for the TypeScript-based edge functions to ensure end-to-end type safety.

## 8. Deployment & Infrastructure Overview

-   **Hosting:** The entire application will be deployed on **Vercel**. Vercel will handle the Next.js frontend, Edge Functions for the API, and CI/CD.
-   **Database:** **Supabase** will provide the managed Postgres database, database edge functions, and authentication-linked RLS.
-   **CI/CD:** The CI/CD pipeline is built into Vercel. Every `git push` will create a preview deployment. Merges to the `main` branch will trigger a production deployment. The pipeline will run linting, unit tests, and E2E tests before deploying.
-   **Video:** Video assets will be uploaded to **Mux**, which handles transcoding, storage, and adaptive streaming delivery.
-   **CDN:** Static assets and video content will be served via a global CDN (Vercel Edge Network and Mux's CDN) to ensure fast delivery worldwide.
