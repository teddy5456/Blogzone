function handleErrors(res, error) {
    console.error(error);
    
    if (error.name === 'ValidationError') {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        message: 'Validation error',
        errors: error.errors 
      }));
    } else if (error.code === 11000) {
      res.writeHead(409, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        message: 'Duplicate key error',
        field: Object.keys(error.keyPattern)[0]
      }));
    } else {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        message: 'Internal server error',
        error: error.message 
      }));
    }
  }
  
  module.exports = { handleErrors };