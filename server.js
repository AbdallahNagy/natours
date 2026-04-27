const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

const mongoose = require('mongoose');
const app = require('./app');

mongoose.connect(process.env.LOCAL_CONNECTION_STRING)
  .then(() => {
    console.log('database connected successfully');
  })
  .catch(err => {
    console.error('database connection error:', err);
  });


app.listen(process.env.PORT, () => {
  console.log(`app running on port ${process.env.PORT}...`);
});