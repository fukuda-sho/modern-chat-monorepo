# [ADR-003] Real-time Protocol (Socket.io)

## Status
Accepted

## Context
A core feature of the application is real-time messaging. We need a reliable, low-latency method to push updates from the server to clients and handle bi-directional communication.

### Alternatives Considered
- **Raw WebSocket (ws):** The standard protocol. Lightweight but requires manual handling of reconnection, heartbeats, and room logic.
- **Server-Sent Events (SSE):** Good for one-way (Server -> Client) updates but lacks native bi-directional support (Client must use HTTP POST for sending).
- **Long Polling:** Legacy technique, inefficient and high latency.

## Decision
We have decided to use **Socket.io**.

Socket.io is a library that builds on top of WebSocket, providing critical features out-of-the-box that are essential for a chat application, specifically "Rooms" and automatic reconnection logic.

## Consequences

- **Good:**
    - **Rooms & Namespaces:** Native support for grouping sockets (e.g., `join('room_1')`) drastically simplifies the implementation of chat rooms.
    - **Reliability:** Automatic reconnection and fallback mechanisms (to HTTP long-polling if WS fails) ensure a stable user experience.
    - **Developer Experience:** Simple API for emitting and listening to events (`socket.emit`, `socket.on`) on both client and server.

- **Bad:**
    - **Overhead:** Slightly heavier protocol overhead compared to raw WebSockets due to its custom packet structure.
    - **Coupling:** Requires the Socket.io client library on the frontend; cannot use a standard raw WebSocket client easily.
