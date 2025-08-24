# 💒 EazyWed - Complete Wedding Services Platform

![EazyWed Logo](https://via.placeholder.com/200x80/FF6B6B/FFFFFF?text=EazyWed)

## 📋 Project Disclaimer

**EazyWed** is an educational and experimental project developed for learning and development purposes only. This application is inspired by [Shadiyana](https://shadiyana.pk/) and has been created to explore and practice MERN stack development technologies.

**Important Notes:**
- This project is **NOT** live or in production
- Developed purely for **educational and experimental purposes**
- While inspired by Shadiyana's concept, this implementation includes unique features and enhancements
- **Not intended for commercial use** - created solely for development practice and skill demonstration
- Some UI elements and features may share similarities with existing platforms, but this project represents original development work
- Built with modern MERN stack technologies to showcase full-stack development capabilities

**Enhanced Features Added:**
- 🤖 **AI-Powered Chatbot** - Intelligent customer support using Gemini AI
- 🎨 **Advanced Photo Editor** - Built-in image editing capabilities using Fabric.js
- 📊 **Separate Dashboards** - Dedicated interfaces for customers, vendors, and administrators
- 💳 **Custom Wedding Card Designer** - Interactive card creation tool
- 📱 **WhatsApp Integration** - Direct vendor communication
- 🔍 **Smart Recommendation Engine** - Personalized service suggestions

---

**EazyWed** is a comprehensive MERN stack platform that connects wedding service vendors with couples planning their special day. The platform offers a seamless experience for browsing services, managing bookings, creating custom wedding cards, and much more.

## 🚀 Features

### 👰 For Couples
- **Browse Services**: Explore wedding venues, photographers, makeup artists, decorators, and more
- **Smart Search & Filters**: Find services by location, price range, category, and availability
- **Service Details**: View comprehensive information, pricing packages, and vendor profiles
- **Custom Wedding Cards**: Design and order personalized wedding invitations using the built-in editor
- **Booking Management**: Book services, track booking status, and manage appointments
- **Reviews & Ratings**: Read and write reviews for services and vendors
- **WhatsApp Integration**: Direct communication with vendors via WhatsApp
- **Recommendation Engine**: Get personalized recommendations based on preferences
- **Estimate Calculator**: Calculate total wedding costs with multiple services

### 🏢 For Vendors
- **Vendor Dashboard**: Comprehensive analytics and insights
- **Service Management**: Create, update, and manage wedding services
- **Wedding Card Templates**: Design and sell custom wedding card templates
- **Booking Management**: Track and manage customer bookings
- **Profile Management**: Maintain vendor profile with social media links
- **Revenue Tracking**: Monitor earnings and booking statistics
- **Customer Communication**: Integrated WhatsApp communication
- **Multi-category Support**: Offer services across different wedding categories

### 👨‍💼 For Administrators
- **Admin Dashboard**: Monitor platform activity and statistics
- **Vendor Management**: Approve/reject vendor registrations and services
- **Content Moderation**: Review and moderate services, cards, and reviews
- **User Management**: Manage user accounts and handle disputes
- **Platform Analytics**: Comprehensive insights into platform usage

## 🛠 Technology Stack

### Frontend (React.js)
- **React 19.0.0** - Modern React with latest features
- **React Router DOM** - Client-side routing
- **Vite** - Fast build tool and development server
- **Bootstrap 5.3.3** - Responsive UI framework
- **React Bootstrap** - Bootstrap components for React
- **Fabric.js** - Canvas library for wedding card editor
- **Axios** - HTTP client for API calls
- **React Hook Form** - Form handling and validation
- **React Toastify** - Elegant notifications
- **React Icons** - Icon library
- **React Leaflet** - Interactive maps
- **Recharts** - Charts and analytics
- **Cloudinary** - Image management
- **JS Cookie** - Cookie management
- **JWT Decode** - JWT token handling

### Backend (Node.js/Express)
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - Authentication and authorization
- **Bcrypt** - Password hashing
- **Cloudinary** - Image and video management
- **Twilio** - SMS and WhatsApp messaging
- **Express Rate Limit** - API rate limiting
- **Express Validator** - Input validation
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing
- **Multer** - File upload handling
- **Node Cron** - Scheduled tasks
- **Morgan** - HTTP request logging

## 📋 Prerequisites

Before running this application, make sure you have the following installed:
- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB** (local or cloud instance)
- **Git**

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/MyProVerse/EAZYWED-MERN-App.git
cd EAZYWED-MERN-App
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
```env
# Database
MONGO_URI=mongodb://localhost:27017/eazywed
# or for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/eazywed

# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Twilio Configuration (for SMS/WhatsApp)
TWILIO_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE=your-twilio-phone-number

# Email Configuration (optional)
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-email-app-password
```

### 3. Frontend Setup
```bash
cd ../eazywed
npm install
```

Create a `.env` file in the frontend directory:
```env
VITE_API_URL=http://localhost:5000
```

### 4. Start the Application

#### Start Backend Server
```bash
cd backend
npm run dev
```
Backend will run on `http://localhost:5000`

#### Start Frontend Server
```bash
cd eazywed
npm run dev
```
Frontend will run on `http://localhost:5173`

## 📁 Project Structure

```
EAZYWED-MERN-App/
├── backend/                    # Backend API
│   ├── config/                # Configuration files
│   │   ├── db.js             # Database connection
│   │   └── env.js            # Environment variables
│   ├── controllers/          # Route handlers
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── cardTemplateController.js
│   │   ├── dashboardController.js
│   │   ├── publicController.js
│   │   ├── userController.js
│   │   ├── vendorController.js
│   │   └── vendorServiceController.js
│   ├── middleware/           # Custom middleware
│   │   ├── auth.js          # Authentication middleware
│   │   ├── cardNormalizer.js
│   │   ├── logger.js
│   │   ├── serviceNormalizer.js
│   │   └── vendorNormalizer.js
│   ├── models/              # Database models
│   │   ├── Admin.js
│   │   ├── BlockedUsers.js
│   │   ├── Booking.js
│   │   ├── CardTemplate.js
│   │   ├── ContactMessage.js
│   │   ├── Estimation.js
│   │   ├── OTP.js
│   │   ├── Recommendation.js
│   │   ├── Review.js
│   │   ├── Service.js
│   │   └── User.js
│   ├── routes/              # API routes
│   │   ├── admin.js
│   │   ├── auth.js
│   │   ├── dashboard.js
│   │   ├── public.js
│   │   ├── user.js
│   │   ├── vendor.js
│   │   └── vendorDashboard.js
│   ├── utils/               # Utility functions
│   │   ├── cloudinary.js    # Image upload configuration
│   │   ├── recommendationEngine.js
│   │   ├── twilio.js        # SMS/WhatsApp configuration
│   │   └── whatsapp.js
│   ├── uploads/             # File upload directory
│   ├── package.json
│   └── server.js           # Main server file
├── eazywed/                # Frontend React app
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── AddService.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminLogin.jsx
│   │   │   ├── CardEditor.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Loading.jsx
│   │   │   ├── SignIn.jsx
│   │   │   ├── SignUp.jsx
│   │   │   ├── VendorDashboard.jsx
│   │   │   ├── VendorLogin.jsx
│   │   │   ├── VendorSignup.jsx
│   │   │   └── WeddingCardForm.jsx
│   │   ├── context/        # React context providers
│   │   │   ├── AuthContext.jsx
│   │   │   └── EstimateContext.jsx
│   │   ├── pages/          # Page components
│   │   │   ├── common/     # Shared components
│   │   │   ├── AboutUs.jsx
│   │   │   ├── Chatbot.jsx
│   │   │   ├── ContactUs.jsx
│   │   │   ├── Deals.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── Listings.jsx
│   │   │   └── ServiceDetails.jsx
│   │   ├── services/       # API service functions
│   │   │   └── api.js
│   │   ├── styles/         # CSS styles
│   │   ├── utils/          # Utility functions
│   │   ├── App.jsx         # Main App component
│   │   ├── main.jsx        # Entry point
│   │   └── routes.jsx      # Routing configuration
│   ├── public/             # Public assets
│   ├── package.json
│   └── vite.config.js      # Vite configuration
├── .gitignore              # Git ignore file
└── README.md               # This file
```

## 🔧 API Endpoints

### Authentication Routes
- `POST /auth/signup` - User registration
- `POST /auth/signin` - User login
- `POST /auth/logout` - User logout
- `POST /auth/request-otp` - Request OTP for password reset
- `POST /auth/verify-otp` - Verify OTP
- `POST /auth/reset-password` - Reset password

### Public Routes
- `GET /api/public/services/:category` - Get services by category
- `GET /api/public/service/:id` - Get service details
- `GET /api/public/cards/:type` - Get cards by type
- `GET /api/public/card/:id` - Get card details
- `GET /api/public/search` - Search services
- `GET /api/public/filters` - Get filter options
- `GET /api/public/recommendations` - Get recommendations

### User Routes
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile
- `GET /users/bookings` - Get user bookings
- `POST /users/book-service` - Book a service
- `POST /users/book-card` - Book a card

### Vendor Routes
- `POST /vendor/signup` - Vendor registration
- `POST /vendor/login` - Vendor login
- `GET /vendor/dashboard/stats` - Get vendor statistics
- `GET /vendor/dashboard/services` - Get vendor services
- `POST /vendor/dashboard/services` - Create new service
- `PUT /vendor/dashboard/services/:id` - Update service
- `DELETE /vendor/dashboard/services/:id` - Delete service

### Admin Routes
- `POST /admins/login` - Admin login
- `GET /admins/dashboard/stats` - Get admin statistics
- `GET /admins/vendors/pending` - Get pending vendor requests
- `PUT /admins/vendors/:id/approve` - Approve vendor
- `PUT /admins/vendors/:id/reject` - Reject vendor

## 🎨 Key Features Explained

### Wedding Card Editor
The application includes a sophisticated wedding card editor built with Fabric.js that allows users to:
- Design custom wedding invitations
- Add and edit text with various fonts and colors
- Upload and position images
- Apply filters and effects
- Save designs for later editing
- Generate print-ready files

### Smart Recommendation Engine
- Machine learning-based recommendations
- Considers user preferences, location, budget
- Analyzes booking patterns and ratings
- Provides personalized vendor suggestions

### WhatsApp Integration
- Direct vendor communication
- Automated booking confirmations
- Order status updates
- Customer support integration

### Advanced Search & Filtering
- Location-based search
- Price range filtering
- Category-specific filters
- Availability checking
- Rating and review filters

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - Bcrypt for secure password storage
- **Rate Limiting** - Prevent API abuse
- **Input Validation** - Server-side validation with express-validator
- **CORS Configuration** - Controlled cross-origin requests
- **Helmet.js** - Security headers
- **File Upload Validation** - Secure file handling

## 📱 Responsive Design

The application is fully responsive and works seamlessly across:
- Desktop computers
- Tablets
- Mobile phones
- Various screen sizes and orientations

## 🧪 Testing

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd eazywed
npm test
```

## 🚀 Deployment

### Backend Deployment (Heroku/Railway/DigitalOcean)
1. Set up production environment variables
2. Configure MongoDB Atlas for production database
3. Set up Cloudinary for image storage
4. Configure Twilio for SMS/WhatsApp services
5. Deploy using your preferred platform

### Frontend Deployment (Vercel/Netlify)
1. Build the frontend: `npm run build`
2. Set production API URL in environment variables
3. Deploy to your preferred hosting platform

### Environment Variables for Production
Make sure to set all required environment variables in your hosting platform:
- Database connection strings
- API keys for third-party services
- JWT secrets
- CORS origins

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style
- Write meaningful commit messages
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

**Educational Use Disclaimer:** This project is created for educational and development practice purposes only. It is inspired by existing platforms but represents original development work. Not intended for commercial use or production deployment.

## 👥 Authors

- **MyProVerse** - *Lead Developer* - [GitHub](https://github.com/MyProVerse)
- **Ali Zaman** - *Project Owner* - Email: alizaman6780@gmail.com

## 🙏 Acknowledgments

- MongoDB for the excellent database solution
- Cloudinary for image management services
- Twilio for SMS and WhatsApp integration
- The React and Node.js communities for amazing tools and libraries

## 📞 Support

If you encounter any issues or have questions:
- Create an issue on GitHub
- Contact: alizaman6780@gmail.com
- Check the [Wiki](https://github.com/MyProVerse/EAZYWED-MERN-App/wiki) for detailed documentation

## 🗺 Roadmap

- [ ] Mobile app development (React Native)
- [ ] Payment gateway integration
- [ ] Real-time chat system
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] AI-powered vendor matching
- [ ] Video consultation features
- [ ] Social media integration

---

**EazyWed** - Making wedding planning easier, one service at a time! 💒✨