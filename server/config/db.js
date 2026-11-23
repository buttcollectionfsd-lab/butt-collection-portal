/**
 * MongoDB Mongoose Connection & Auto-Seeder
 * Connects to MongoDB (Local or Atlas) and seeds the exact notebook records
 */
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const CartonLabel = require('../models/CartonLabel');
const Company = require('../models/Company');
const { readDb } = require('../db');

let isConnected = false;

async function connectDB(mongoUri) {
  const uri = mongoUri || process.env.MONGO_URI || 'mongodb://localhost:27017/butt_collection';
  
  console.log(`\nConnecting to MongoDB: ${uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}...`);

  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    isConnected = true;
    console.log('✅ MongoDB connected successfully!');

    // Auto-sync notebook records into MongoDB
    await seedOrSync();

    return true;
  } catch (err) {
    isConnected = false;
    console.warn(`⚠️ MongoDB connection notice: ${err.message}`);
    console.warn('ℹ️ Running smoothly on persistent local storage. When MongoDB Atlas is connected, it syncs automatically.\n');
    return false;
  }
}

async function seedOrSync() {
  try {
    const orderCount = await Order.countDocuments();
    if (orderCount === 0) {
      console.log('Seeding initial notebook records into MongoDB...');
      const localData = readDb();

      // Seed Company
      if (localData.company) {
        await Company.create(localData.company);
      }

      // Seed Orders
      if (localData.orders && localData.orders.length > 0) {
        const cleanedOrders = localData.orders.map(o => {
          const { id, ...rest } = o;
          return rest;
        });
        await Order.insertMany(cleanedOrders);
      }

      // Seed Payments
      if (localData.payments && localData.payments.length > 0) {
        const cleanedPayments = localData.payments.map(p => {
          const { id, ...rest } = p;
          return rest;
        });
        await Payment.insertMany(cleanedPayments);
      }

      // Seed Carton Labels
      if (localData.cartonLabels && localData.cartonLabels.length > 0) {
        const cleanedLabels = localData.cartonLabels.map(l => {
          const { id, ...rest } = l;
          return rest;
        });
        await CartonLabel.insertMany(cleanedLabels);
      }

      console.log('✅ MongoDB successfully populated with authentic notebook orders, payments & labels!');
    }
  } catch (err) {
    console.error('Error during MongoDB seeding:', err.message);
  }
}

function getIsConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

module.exports = {
  connectDB,
  getIsConnected,
  models: {
    Order,
    Payment,
    CartonLabel,
    Company
  }
};
