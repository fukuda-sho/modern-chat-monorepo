# WebSocket Gateway Specification

## Overview
This document outlines the implementation of the real-time chat features using NestJS Gateway (Socket.io).

## Architecture
- **ChatGateway**: Handles WebSocket connections and events.
- **ChatModule**: Encapsulates chat-related logic.
- **ChatService**: Manages message persistence and business logic.
- **WsJwtGuard**: Ensures only authenticated users can connect and send messages.

## Connection & Authentication

### Flow
1.  **Client Handshake**: The client initiates a connection passing the JWT.
    -   Method: `socket.io` auth object or query parameter.
    -   Example: `io('http://localhost:3001', { auth: { token: 'Bearer <token>' } })`
2.  **Server Validation**:
    -   `OnGatewayConnection` hook intercepts the connection.
    -   Extracts the token from the handshake `auth` object or headers.
    -   Verifies signature and expiration using `JwtService`.
    -   If valid: Attaches `user` object to the socket instance (`client.data.user`).
    -   If invalid: Disconnects the socket immediately (`client.disconnect()`).

## Data Persistence & Consistency

### DB Saving Timing
- Messages are saved to the database **synchronously** upon receiving the `sendMessage` event, *before* broadcasting to other users.
- This ensures that all messages received by clients are persisted. If the save fails, the message is not broadcasted, and an error is returned to the sender.

### Consistency Assurance
- **Prisma Transactions**: If future logic involves multiple DB operations (e.g., updating last read pointer + saving message), `prisma.$transaction` will be used.
- **Error Handling**: Use `try-catch` blocks. On DB error, emit an `error` event to the sender so they can retry.

## Events

### Client -> Server

| Event Name | Payload | Description |
| :--- | :--- | :--- |
| `joinRoom` | `{ roomId: number }` | Request to join a specific chat room channel. |
| `leaveRoom` | `{ roomId: number }` | Request to leave a chat room channel. |
| `sendMessage` | `{ roomId: number, content: string }` | Send a text message to a room. |

### Server -> Client

| Event Name | Payload | Description |
| :--- | :--- | :--- |
| `newMessage` | `Message` object (with user relations) | Broadcasted to all users in the room when a new message is successfully saved. |
| `joinedRoom` | `{ roomId: number }` | Confirmation sent to the user who joined. |
| `leftRoom` | `{ roomId: number }` | Confirmation sent to the user who left. |
| `error` | `{ message: string }` | Sent to the specific client if an operation fails. |

## CORS Settings
- **Origin**: `http://localhost:3000` (or process.env.FRONTEND_URL)
- **Credentials**: `true`
