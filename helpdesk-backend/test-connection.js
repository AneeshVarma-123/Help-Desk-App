const mongoose = require('mongoose');
require('dotenv').config();

console.log('Testing MongoDB Connection...');
console.log('URI:', process.env.MONGODB_URI); // Check if URI is loaded

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000
})
.then(() => {
  console.log('✅ MongoDB Connected Successfully!');
  process.exit(0);
})
.catch(err => {
  console.log('❌ Connection Failed!');
  console.log('Error:', err.message);
  process.exit(1);
});