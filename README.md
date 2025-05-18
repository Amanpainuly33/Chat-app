# Real-Time Chat Application

A modern real-time chat application built with React, Node.js, Socket.IO, and MongoDB.

## Features

- Real-time messaging using Socket.IO
- User authentication with JWT
- Online/offline user status
- Message history
- Private messaging between users
- Modern WhatsApp-like UI

## Tech Stack

### Frontend
- React
- Socket.IO Client
- Axios
- TailwindCSS

### Backend
- Node.js
- Express
- Socket.IO
- MongoDB
- JWT Authentication

## Getting Started

### Prerequisites
- Node.js
- MongoDB
- Git

### Installation

1. Clone the repository
```bash
git clone https://github.com/amanapinuly33/chat-app.git
cd chat-app
```

2. Install Frontend Dependencies
```bash
cd frontend
npm install
```

3. Install Backend Dependencies
```bash
cd ../backend
npm install
```

4. Set up Environment Variables

Backend (.env):
```
MONGODB_URI=your_mongodb_uri
PORT=3001
JWT_SECRET=your_jwt_secret
```

5. Run the Application

Backend:
```bash
cd backend
npm start
```

Frontend:
```bash
cd frontend
npm run dev
```

## Deployment

The application is deployed using Vercel:
- Frontend: [Add your frontend URL here]
- Backend: [Add your backend URL here]

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/) 