# Real-Time Chat Backend

A sophisticated real-time messaging server built with Express.js and Socket.IO, featuring intelligent message compression and seamless offline message handling.

## Architecture Overview

This backend serves as the communication hub for a real-time chat application. The architecture combines traditional HTTP endpoints for user authentication with WebSocket connections for instant messaging. Key features include:

- Real-time bidirectional communication via Socket.IO
- JWT-based authentication system
- Intelligent Huffman compression for message optimization
- Offline message persistence
- User presence tracking

## Core Components

### HTTP Layer (Express.js)
Handles user registration, authentication, and other traditional REST operations. CORS is configured to allow cross-origin requests from the frontend deployment.

### WebSocket Layer (Socket.IO)
Manages persistent connections for real-time messaging. Each user maintains an individual socket connection to the server, enabling asynchronous communication patterns.

### Database (MongoDB + Mongoose)
Stores user profiles, message history, and metadata. The schema supports both real-time features and persistent storage requirements.

## Authentication System

The authentication flow works as follows:

1. **Registration/Login**: Users receive JWT tokens upon successful authentication
2. **Token Validation**: Middleware verifies tokens on protected routes and socket connections
3. **Status Tracking**: User online status and last-seen timestamps are maintained automatically

The auth middleware acts as a security layer, validating JWT tokens and ensuring user existence before granting access to protected resources.

## Socket Connection Architecture

### Individual Connection Model

Each user establishes their own socket connection to the server independently. This means:

- Users don't need to coordinate online times to communicate
- Connections are established when users load the application
- The server maintains individual socket objects for each active user

### Connection Lifecycle

```
User opens app → JWT verification → Socket connection established → User marked online
User closes app → Socket disconnection → User marked offline with timestamp
```

### Message Flow

When a user sends a message:

1. Message travels from sender's browser to server via their socket connection
2. Server stores message in database (ensures persistence)
3. Server searches for receiver's active socket connection
4. If receiver is online: message delivered immediately
5. If receiver is offline: message waits in database for future retrieval

## Message Compression System

The backend implements intelligent Huffman compression:

### Compression Logic
- Text messages over 50 bytes are compressed
- File attachments over 1KB are compressed
- Smaller content remains uncompressed (overhead not worth it)

### Transparency
Compression is completely transparent to users:
- Messages compressed for storage/transmission efficiency
- Always decompressed before delivery to clients
- Compression ratios logged for monitoring

## Message Persistence & Offline Handling

Messages are always stored in the database regardless of recipient online status. When users come online:

1. They can request conversation history via `getMessageHistory`
2. Server retrieves messages and decompresses if needed
3. All messages (including offline ones) are delivered seamlessly

This creates an asynchronous communication system where message delivery is guaranteed regardless of user availability.

## Key Socket Events

### Connection Events
- `connection`: New user socket established
- `disconnect`: User socket closed, status updated

### Messaging Events
- `privateMessage`: Handle incoming messages
- `getMessageHistory`: Retrieve conversation history

## Error Handling

The system includes comprehensive error handling:

- Socket disconnections managed gracefully
- Database operations wrapped in try-catch blocks
- JWT verification includes multiple validation steps
- Connection failures logged for debugging

## Database Schema

### Users
- Username and hashed passwords
- Online status and last-seen timestamps
- Authentication tokens

### Messages
- Sender and receiver information
- Message content and timestamps
- Compression status and file metadata
- Conversation threading

## Security Features

- JWT token authentication
- Password hashing
- CORS configuration for secure cross-origin requests
- Socket connection authentication middleware
- Protected routes and events

## Performance Optimizations

- Intelligent compression reduces storage and bandwidth usage
- Efficient socket connection lookup algorithms
- Database indexing for message retrieval
- Connection pooling for database operations

---

This architecture provides a robust foundation for real-time messaging applications, balancing performance, reliability, and user experience. The combination of individual socket connections, intelligent compression, and comprehensive offline support creates a seamless chat experience regardless of user connectivity patterns.