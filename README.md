# 🏪 Inventra - Inventory Management System

A modern, full-stack inventory management system built with React, Node.js, and MongoDB.

## 🚀 Features

- **Role-Based Access Control**: Admin, Manager, Clerk, and Auditor roles
- **Real-Time Stock Tracking**: Monitor inventory levels in real-time
- **Automated Notifications**: Get alerts for low stock and important events
- **Comprehensive Reporting**: Generate reports and analytics
- **Beautiful UI**: Orange-themed modern interface with animations
- **Secure Authentication**: JWT-based authentication system

## 🛠️ Tech Stack

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion (animations)
- Vite
- Lucide Icons

### Backend
- Node.js
- Express.js
- MongoDB (Atlas)
- JWT Authentication
- Bcrypt

## 📦 Installation

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- npm or yarn

### Clone the repository
```bash
git clone <your-repo-url>
cd inventra-nexus-main
```

### Install dependencies

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd backend
npm install
cd ..
```

### Environment Setup

**Backend (.env in backend folder):**
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/inventra
JWT_SECRET=your-secret-key-here
FRONTEND_URL=http://localhost:8080
```

**Frontend:**
```env
VITE_API_URL=http://localhost:5000/api
```

### Run the application

**Backend:**
```bash
cd backend
node src/server.js
```

**Frontend:**
```bash
npm run dev
```

Visit http://localhost:8080

## 🌐 Deployment

See [RENDER_DEPLOY.md](./RENDER_DEPLOY.md) for detailed deployment instructions on Render.

Quick steps:
1. Push code to GitHub
2. Deploy backend as Web Service on Render
3. Deploy frontend as Static Site on Render
4. Configure environment variables
5. Done!

## 👤 Default Admin Account

```
Email: admin@inventra.com
Password: (set during initial setup)
```

## 📝 Project Structure

```
inventra-nexus-main/
├── src/                    # Frontend source
│   ├── components/        # React components
│   ├── pages/            # Page components
│   ├── contexts/         # Context providers
│   └── lib/              # Utilities
├── backend/               # Backend source
│   ├── src/
│   │   ├── controllers/  # Route controllers
│   │   ├── models/       # Database models
│   │   ├── routes/       # API routes
│   │   └── server.js     # Main server file
│   └── package.json
└── package.json           # Frontend dependencies
```

## 📄 License

© 2025 Inventra | Designed by Ganesh Dandekar
