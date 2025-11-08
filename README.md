# Chat Application

A real-time chat application built with React and Node.js, featuring user authentication and live messaging.

🔗 **Live Demo**: [https://chat-application-vm.vercel.app](https://chat-application-vm.vercel.app)

## Features

- User authentication (signup/login)
- Real-time messaging with Socket.IO
- Responsive UI with Tailwind CSS
- Secure JWT-based authentication
- MongoDB database

## Tech Stack

**Frontend:**
- React 19
- Vite
- Tailwind CSS
- Socket.IO Client
- React Router
- Axios

**Backend:**
- Node.js
- Express
- Socket.IO
- MongoDB with Mongoose
- JWT Authentication
- Bcrypt

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB database
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd <project-folder>
```

2. Install frontend dependencies
```bash
cd frontend
npm install
```

3. Install backend dependencies
```bash
cd backend
npm install
```

### Configuration

1. Create `.env` file in the `backend` folder:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

2. Create `.env` file in the `frontend` folder:
```env
VITE_API_URL=http://localhost:5000
```

### Running Locally

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. Start the frontend development server:
```bash
cd frontend
npm run dev
```

The application will be available at `http://localhost:5173`

## Deployment

- **Frontend**: Deployed on Vercel
- **Backend**: Deployed on Railway

## License

MIT
