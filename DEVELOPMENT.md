# EazyWed Development Setup Guide

## Quick Start for Local Development

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Git

### 1. Clone and Setup

```bash
git clone https://github.com/MyProVerse/EAZYWED-MERN-App.git
cd EAZYWED-MERN-App
```

### 2. Backend Setup

```bash
cd backend
npm install
```

**Create `.env` file in backend directory:**
```env
MONGO_URI=mongodb://localhost:27017/eazywed
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Optional - for full functionality
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
TWILIO_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE=your-twilio-phone-number
GEMINI_API_KEY=your-gemini-api-key
```

**Start backend:**
```bash
npm run dev
```
Backend runs on: http://localhost:5000

### 3. Frontend Setup

```bash
cd ../eazywed
npm install
```

**Create `.env` file in eazywed directory:**
```env
VITE_API_URL=http://localhost:5000
VITE_NODE_ENV=development
GEMINI_API_KEY=your-gemini-api-key
```

**Start frontend:**
```bash
npm run dev
```
Frontend runs on: http://localhost:5173

### 4. Database Setup

If using local MongoDB:
```bash
mongod
```

The application will automatically connect to MongoDB and create the required collections.

### 5. Verify Setup

1. Open http://localhost:5173 in your browser
2. You should see the EazyWed homepage
3. Backend API should be accessible at http://localhost:5000

### Features Available in Development

✅ **Core Features** (No external APIs required):
- User registration/login
- Service browsing
- Vendor management
- Basic booking system
- Admin dashboard

⚠️ **Premium Features** (Requires API keys):
- Image uploads (Cloudinary)
- SMS/WhatsApp notifications (Twilio)
- AI Chatbot (Gemini AI)

### Troubleshooting

**Common Issues:**

1. **MongoDB Connection Error:**
   - Ensure MongoDB is running
   - Check MONGO_URI in .env file

2. **Port Already in Use:**
   - Change PORT in backend/.env
   - Update VITE_API_URL in frontend/.env

3. **Module Not Found:**
   - Run `npm install` in both directories
   - Delete node_modules and package-lock.json, then reinstall

4. **CORS Errors:**
   - Ensure FRONTEND_URL in backend/.env matches frontend URL
   - Check if both servers are running

### Development Notes

- Hot reload is enabled for both frontend and backend
- Backend uses nodemon for automatic restart
- Frontend uses Vite for fast development builds
- All changes are automatically reflected without manual restart

Happy coding! 🚀