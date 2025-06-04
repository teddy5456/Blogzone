
---

````markdown
# 📰 Blogzone

**Blogzone** is a full-stack blog platform with a Node.js backend and a pure HTML/CSS frontend. It supports user registration, login, blog creation, and role-based dashboards. Data is stored in MongoDB and secured using JWT-based authentication.

---

## 🚀 Features

- ✍️ Users can write and publish blogs
- 🔐 Secure authentication using JWT tokens
- 👥 Separate dashboards for admins and users
- 📂 MongoDB for data storage
- 🎨 Static HTML/CSS frontend

---

## 💻 Requirements

- [Node.js](https://nodejs.org/) (v16 or newer)
- [MongoDB](https://www.mongodb.com/try/download/community) (running locally or using MongoDB Atlas)

---

## 📦 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/teddy5456/Blogzone.git
cd Blogzone
````

### 2. Install Backend Dependencies

```bash
cd blogzone-backend
npm install
```

---

## 🏃 Running the App

### 1. Start MongoDB

Make sure your MongoDB server is running in the background:

```bash
mongod
```

### 2. Start the Backend Server

```bash
cd blogzone-backend
npm start
```

Once running, the terminal should show:

```
Server is running on port 5000
Connected to MongoDB
```

### 3. Open the Frontend

Open the `.html` files located in the root of the project with your browser:

* `index.html` – Homepage
* `login.html` – Login screen
* `dashboard.html` – User/Admin dashboard
* Other HTML files for registration, blog creation, etc.

No need for a web server — the HTML files are static.

---

## 📂 Project Structure

```
Blogzone/
├── blogzone-backend/      # Node.js backend
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   └── server.js
├── styles/                # CSS styles
├── assets/                # Static images/assets
├── index.html             # Main landing page
├── login.html             # Login page
├── dashboard.html         # User/Admin dashboard
└── other .html files      # Blog and profile pages
```

---

## 🧪 Sample API Endpoints

| Method | Endpoint        | Description              |
| ------ | --------------- | ------------------------ |
| POST   | `/api/register` | Register a new user      |
| POST   | `/api/login`    | Log in and receive a JWT |
| GET    | `/api/blogs`    | Fetch all blog posts     |
| POST   | `/api/blogs`    | Create a new blog post   |

Authorization is required for certain routes (JWT Bearer token in headers).

---

## 📝 Notes

* CORS is already enabled in the backend for frontend/backend integration.
* You can customize user roles and permissions in the backend.
* If using MongoDB Atlas, update the connection string in `server.js`.

---

## 📜 License

MIT License — feel free to use, modify, and share.

```

---

