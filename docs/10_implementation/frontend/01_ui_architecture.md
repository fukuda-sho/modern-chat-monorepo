# Frontend UI Architecture & Design

## Screen Flow
1.  **Authentication**:
    -   `/auth/login`: User Login
    -   `/auth/signup`: User Registration
    -   *Redirect*: After successful auth -> `/` (Home/Chat)

2.  **Main Application (`/`)**:
    -   **Sidebar**: Displays list of Chat Rooms.
    -   **Main Content**:
        -   Empty State: "Select a room to start chatting"
        -   Chat Room: Messages list + Input area.

## Component Design (shadcn/ui)
We will utilize the following components from `shadcn/ui`:

-   **Button**: Actions (Login, Send, Join).
-   **Input / Textarea**: Forms and message input.
-   **Card**: Containers for login forms.
-   **Form**: Wrapper for React Hook Form integration.
-   **Avatar**: User profile display.
-   **ScrollArea**: Message list scrolling.
-   **Toast**: Notifications (Success/Error).
-   **Dialog**: Create new room modal (future).

## State Management
-   **Authentication**:
    -   Store: React Context or lightweight store (e.g., Zustand).
    -   Data: `user` object, `accessToken`.
    -   Persistence: `localStorage` (or cookies for Next.js middleware).
-   **Chat**:
    -   Store: Zustand (preferred for simplicity) or Context.
    -   Data: `rooms` list, `currentRoom`, `messages` for current room.

## Tech Stack
-   **Framework**: Next.js 14 (App Router)
-   **Styling**: Tailwind CSS
-   **Components**: shadcn/ui (Radix UI + Tailwind)
-   **Forms**: React Hook Form + Zod
-   **HTTP Client**: Axios
-   **Icons**: Lucide React
