Absolutely! Here’s a clear, detailed **non-Docker** README for your Blogzone app, tailored to your backend running on port 3000 and MongoDB Atlas usage:

---

# Blogzone

Blogzone is a simple blog application with a backend API built using Node.js and MongoDB Atlas.

## Prerequisites

Before you start, ensure you have the following installed:

* [Node.js](https://nodejs.org/) (v16 or later recommended)
* npm (comes with Node.js)
* A MongoDB Atlas cluster (or local MongoDB instance)
* Git (optional, to clone the repo)

## Installation and Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/teddy5456/Blogzone.git
   cd Blogzone/blogzone-backend
   ```

2. **Install backend dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the `blogzone-backend` folder with the necessary MongoDB connection string and other variables.

   Example `.env`:

   ```
   MONGO_URI=your_mongodb_atlas_connection_string
   PORT=3000
   JWT_SECRET=your_jwt_secret_key
   ```

   > Make sure to replace the values with your actual MongoDB URI and secret key.

4. **Run the backend server**

   ```bash
   node server.js
   ```

5. **Access the backend API**

   Open your browser or API client and visit:

   ```
   http://localhost:3000
   ```

   Your backend server will be running and connected to MongoDB Atlas.

## Notes

* The backend listens on port **3000** by default.
* MongoDB Atlas must be properly set up and accessible for the app to work.
* The frontend is a static folder served separately or via any static server.

---

If you want me to add instructions for the frontend or running the whole app with Docker later, just ask!
