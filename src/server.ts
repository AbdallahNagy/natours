import dotenv from 'dotenv';
dotenv.config({ path: './config.env' });

import mongoose from 'mongoose';
import app from './app';

const connectionString = process.env.LOCAL_CONNECTION_STRING;
const port = process.env.PORT || 3000;

if (!connectionString) {
  console.error(
    'LOCAL_CONNECTION_STRING is not defined in environment variables'
  );
  process.exit(1);
}

mongoose
  .connect(connectionString)
  .then(() => {
    console.log('database connected successfully');
  })
  .catch(err => {
    console.error('database connection error:', err);
  });

const server = app.listen(port, () => {
  console.log(`app running on port ${port}...`);
});

process.on('uncaughtException', (err: any) => {
  console.log(err.name, err.message);
  console.log('shutting down...');
  server.close(() => {
    process.exit(1);
  });
});
