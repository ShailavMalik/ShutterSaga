# 📸 ShutterSaga

A modern photo gallery application with secure authentication and Azure Blob Storage integration.

## 🌐 Live Demo

- **Frontend**: [https://shuttersaga.shailavmalik.me](https://shuttersaga.shailavmalik.me)
- **Backend API**: [https://shuttersaga-backend-eqfegxebavdwdqgf.centralindia-01.azurewebsites.net](https://shuttersaga-backend-eqfegxebavdwdqgf.centralindia-01.azurewebsites.net)

## Features

- 🔐 **Secure Authentication** - JWT-based login with bcrypt password hashing
- ☁️ **Cloud Storage** - Photos stored in Azure Blob Storage (organized by user)
- 🖼️ **Gallery View** - Beautiful grid layout with lightbox preview
- 🎯 **Photo Navigation** - Keyboard and button navigation in lightbox
- 📱 **Responsive Design** - Works great on desktop and mobile
- 🛡️ **Production Ready** - Rate limiting, CORS, security headers
- 📁 **User Directories** - Each user's photos stored in their own folder

## Tech Stack

### Backend

- **Runtime**: Node.js 18+
- **Framework**: Express.js 5
- **Database**: MongoDB with Mongoose 9
- **Storage**: Azure Blob Storage
- **Auth**: JWT + bcryptjs
- **Security**: Helmet, CORS, Rate Limiting

### Frontend

- **Framework**: React 19
- **Routing**: React Router DOM 7
- **HTTP Client**: Axios
- **Build Tool**: Vite 7

## Quick Start

### Prerequisites

- Node.js 18 or higher
- MongoDB database (local or Atlas)
- Azure Storage account

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/shuttersaga.git
   cd shuttersaga
   ```

2. **Install all dependencies**

   ```bash
   npm run install:all
   ```

3. **Configure environment variables**

   Copy the example files and fill in your values:

   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```

4. **Start development servers**

   ```bash
   npm run dev
   ```

   This starts both frontend (http://localhost:5173) and backend (http://localhost:5000)

## Environment Variables

### Server (`server/.env`)

| Variable                          | Description                          | Required           |
| --------------------------------- | ------------------------------------ | ------------------ |
| `NODE_ENV`                        | Environment (development/production) | Yes                |
| `PORT`                            | Server port                          | No (default: 5000) |
| `MONGODB_URI`                     | MongoDB connection string            | Yes                |
| `JWT_SECRET`                      | Secret key for JWT tokens            | Yes                |
| `AZURE_STORAGE_CONNECTION_STRING` | Azure Storage connection             | Yes                |
| `AZURE_STORAGE_CONTAINER_NAME`    | Blob container name                  | Yes                |
| `ALLOWED_ORIGINS`                 | Comma-separated CORS origins         | No                 |

### Client (`client/.env`)

| Variable       | Description     | Required           |
| -------------- | --------------- | ------------------ |
| `VITE_API_URL` | Backend API URL | No (default: /api) |

## Scripts

### Root Directory

| Command               | Description                                 |
| --------------------- | ------------------------------------------- |
| `npm run dev`         | Start both client and server in development |
| `npm run build`       | Build client for production                 |
| `npm run start`       | Start server only                           |
| `npm run start:prod`  | Start server in production mode             |
| `npm run install:all` | Install all dependencies                    |

### Client

| Command           | Description              |
| ----------------- | ------------------------ |
| `npm run dev`     | Start Vite dev server    |
| `npm run build`   | Build for production     |
| `npm run preview` | Preview production build |

### Server

| Command       | Description                     |
| ------------- | ------------------------------- |
| `npm run dev` | Start with nodemon (hot reload) |
| `npm start`   | Start production server         |

## API Endpoints

### Authentication

| Method | Endpoint             | Description           |
| ------ | -------------------- | --------------------- |
| POST   | `/api/auth/register` | Create new account    |
| POST   | `/api/auth/login`    | Login and get token   |
| GET    | `/api/auth/me`       | Get current user info |

### Photos

| Method | Endpoint             | Description           |
| ------ | -------------------- | --------------------- |
| GET    | `/api/photos`        | Get all user's photos |
| GET    | `/api/photos/:id`    | Get single photo      |
| POST   | `/api/photos/upload` | Upload new photo      |
| DELETE | `/api/photos/:id`    | Delete a photo        |

## Production Deployment

### Build the Client

```bash
npm run build
```

This creates optimized files in `client/dist/`.

### Deploy Options

#### Option 1: Traditional Hosting

1. Build the client: `npm run build`
2. Serve `client/dist/` with nginx or similar
3. Run server with `npm run start:prod`
4. Use a process manager like PM2

#### Option 2: Platform as a Service

**Render/Railway/Fly.io:**

- Deploy server with `npm run start:prod`
- Deploy client as static site from `client/dist/`

**Vercel (Frontend) + Railway (Backend):**

1. Deploy client folder to Vercel
2. Deploy server folder to Railway
3. Update `VITE_API_URL` to point to Railway URL

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong, unique `JWT_SECRET`
- [ ] Configure `ALLOWED_ORIGINS` for your domains
- [ ] Enable HTTPS
- [ ] Set up MongoDB Atlas with proper security
- [ ] Configure Azure Blob Storage with appropriate access
- [ ] Set up monitoring and logging
- [ ] Configure automatic backups

## Security Features

- **Helmet.js** - Sets security HTTP headers
- **Rate Limiting** - Prevents brute force attacks
- **CORS** - Restricts cross-origin requests
- **JWT Expiration** - Tokens expire after 7 days
- **Password Hashing** - bcrypt with salt rounds
- **Input Validation** - Sanitized user inputs
- **File Type Validation** - Only allows image uploads

## Project Structure

```
shuttersaga/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # React context (auth)
│   │   ├── pages/          # Page components
│   │   └── services/       # API service
│   └── vite.config.js
├── server/                 # Express backend
│   ├── DB/                 # Database connection
│   ├── middleware/         # Express middleware
│   ├── models/             # Mongoose models
│   ├── routes/             # API routes
│   └── utils/              # Utility functions
└── package.json            # Root scripts
```

## License

MIT License - feel free to use this project for learning or production.
