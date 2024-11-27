# VTREATU - Doctor Appointment Booking System

## Overview
VTREATU is a **MERN-based doctor appointment system** designed to manage appointments, user profiles, and payment transactions. The application supports three user roles: **user**, **doctor**, and **admin**.

## Technologies Used
- **Frontend**: JavaScript, React, TailwindCSS, Vite
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Payment Gateway**: Razorpay
- **File Storage**: Cloudinary
- **Authentication**: JWT, Multer for image uploads

## Features

### Role-Specific Dashboards
- **User**:
  - Book and cancel appointments
  - Edit profile details
  
- **Doctor**:
  - Manage availability and fees
  - View earnings and patient statistics
  - Handle appointment requests and cancellations

- **Admin**:
  - Oversee doctor availability and patient-doctor statistics
  - Manage system-wide settings

### Additional Features
- Integrated Razorpay payment gateway for secure online payments
- Profile management with image uploads using Multer and Cloudinary
- Dynamic and responsive design with React Router, React Toastify, and TailwindCSS
- Secured backend APIs with JWT authentication
- Optimized frontend performance using Vite and Mongoose
- Modular architecture for better testability and scalability

## Prerequisites
- Node.js version > 20.0
- MongoDB
- Razorpay account
- Cloudinary account

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/vishdev-git/vtreatu-MERN.git
cd vtreatu-MERN
```

### 2. Set Up Environment Variables
Create `.env` files in the **backend**, **frontend**, and **admin** directories with:
- JWT secret
- Razorpay credentials
- Admin credentials
- Backend URL
- Cloudinary configuration
- MongoDB URI

### 3. Install Dependencies
```bash
# Frontend
cd frontend
npm install

# Admin Panel
cd ../admin
npm install

# Backend
cd ../backend
npm install
```

### 4. Start the Application
```bash
# Backend
cd backend
npm start

# Frontend
cd ../frontend
npm run dev

# Admin Panel
cd ../admin
npm run dev
```

## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License
Distributed under the MIT License.

## Contact
Viswanath R - viswa20.2001@gmail.com