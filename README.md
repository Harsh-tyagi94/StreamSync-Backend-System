# 🎬 StreamSync Backend System

A scalable backend API for a video streaming platform — built using **Node.js**, **Express**, and **MongoDB**, supporting secure media uploads, user authentication, and efficient content delivery.

![Node.js](https://img.shields.io/badge/Node.js-18.x-green?logo=node.js)
![Express](https://img.shields.io/badge/Express-5.x-black?logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-8.x-brightgreen?logo=mongodb)
![JWT](https://img.shields.io/badge/Auth-JWT-orange?logo=jsonwebtokens)
![Cloudinary](https://img.shields.io/badge/Storage-Cloudinary-blue)
![Multer](https://img.shields.io/badge/Upload-Multer-red)

---

## 🚀 Features

- 🔐 **JWT Authentication** and cookie-based session handling
- 📦 **RESTful APIs** for video uploads, user management, and admin controls
- 📹 **Media Uploads** with `Multer` and secure delivery via `Cloudinary`
- 🔎 **Pagination & Aggregation** for scalable data access
- 🧑‍🤝‍🧑 **Role-Based Access Control** for users and admins
- 🛡️ **Hashed Passwords** using `bcrypt` for secure credential storage

---

## 🛠️ Tech Stack

| Tech         | Purpose                            |
|--------------|------------------------------------|
| Node.js      | JavaScript runtime                 |
| Express.js   | Web server and API routing         |
| MongoDB      | NoSQL database for storing users & videos |
| Multer       | File upload middleware             |
| Cloudinary   | Cloud media storage and CDN        |
| JWT          | Authentication & route protection  |
| bcrypt       | Password hashing                   |
| cookie-parser| Secure cookie management           |

---

## 📁 Project Structure


### 1. Clone the Repository

```bash
git clone https://github.com/Harsh-tyagi94/streamsync-backend.git
cd streamsync-backend

npm install

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

npm run dev

