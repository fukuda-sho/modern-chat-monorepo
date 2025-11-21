# Frontend Chat Integration Specification

## Overview
This document outlines the integration of the WebSocket client in the frontend, focusing on the `useChatSocket` hook and message handling.

## Socket Management (`useChatSocket`)

### Responsibilities
- Establish connection with JWT.
- Handle connection events (connect, disconnect, error).
- Expose methods to emit events (join, leave, sendMessage).
- Listen for server events and update `ChatStore`.

### Interface
```typescript
interface UseChatSocketReturn {
  isConnected: boolean;
  joinRoom: (roomId: number) => void;
  leaveRoom: (roomId: number) => void;
  sendMessage: (roomId: number, content: string) => void;
}
```

### Connection Logic
- **Trigger**: When `AuthStore.token` is present.
- **Cleanup**: Disconnect on unmount or logout.
- **Reconnection**: Socket.io client handles this automatically, but we should monitor `connect_error` for auth failures.

## Message Lifecycle

1.  **Send**:
    - User types in `ChatInput`.
    - Calls `sendMessage`.
    - **Optimistic UI**: (Optional) Append message locally with "pending" status? -> *Decision: Keep simple for now, wait for server broadcast.*

2.  **Receive (`newMessage`)**:
    - Socket listener triggers.
    - Updates `ChatStore.messages`.
    - UI re-renders.

## UX Features

### Auto-scroll
- **Component**: `MessageList`
- **Logic**:
    - Ref to the bottom element.
    - `useEffect` on `messages` change -> `bottomRef.current.scrollIntoView({ behavior: 'smooth' })`.

### Error Handling
- **Auth Error**: If socket connection fails due to invalid token, trigger `logout` and redirect to login.
- **Network Error**: Show toast notification "Reconnecting...".
