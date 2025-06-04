require('dotenv').config();
const http = require('http');
const { connectToDatabase, closeConnection } = require('./db');
const { handleRequest } = require('./router');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await connectToDatabase();

    const server = http.createServer((req, res) => {
      handleRequest(req, res);
    });

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Handle clean shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received. Shutting down gracefully...');
      await closeConnection();
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      console.log('SIGINT received (Ctrl+C). Shutting down...');
      await closeConnection();
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
