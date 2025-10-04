const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://helpdesk-frontend-er9myuzgt-aneesh-varmas-projects.vercel.app/', // Add your Vercel URL
    'https://your-custom-domain.com' // If you have one
  ],
  credentials: true
}));
app.use(express.json());

// MongoDB Connection
// MongoDB Connection
app.get('/', (req, res) => {
  res.json({ 
    message: 'Help Desk API is running!',
    status: 'active',
    endpoints: {
      auth: '/api/auth',
      tickets: '/api/tickets'
    }
  });
});

// Routes


mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/helpdesk', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
  socketTimeoutMS: 45000,
})
.then(() => console.log('✅ MongoDB Connected Successfully'))
.catch(err => {
  console.log('❌ MongoDB Connection Error:', err.message);
  process.exit(1);
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tickets', require('./routes/tickets'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));