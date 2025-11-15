const mongoose = require('mongoose');
const chalk = require('chalk');

mongoose.set('strictQuery', false);

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/queuectl';
    
    if (mongoose.connection.readyState === 0) {
      // Added a timeout to prevent infinite hanging
      await mongoose.connect(mongoURI, {
        serverSelectionTimeoutMS: 5000 
      });
    }
  } catch (err) {
    console.error(chalk.red('-----------------------------------'));
    console.error(chalk.red('MongoDB Connection Error:'));
    console.error(chalk.red(err.message));
    console.error(chalk.yellow('Hint: Is your IP address whitelisted in MongoDB Atlas?'));
    console.error(chalk.red('-----------------------------------'));
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  } catch (err) {
    console.error(chalk.red(`MongoDB Disconnection Error: ${err.message}`));
  }
};

module.exports = { connectDB, disconnectDB };