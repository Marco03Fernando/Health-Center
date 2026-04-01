require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!MONGO) {
  console.error('No MONGO_URI found in environment');
  process.exit(2);
}

async function run() {
  await mongoose.connect(MONGO, { dbName: process.env.MONGO_DB_NAME });
  console.log('Connected');

  const User = require('../src/models/doctorChanneling/user.model');

  const email = (process.argv[2] || 'admin@gmail.com').trim().toLowerCase();
  const password = process.argv[3] || 'admin@123';

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    console.log('User not found for email:', email);
    process.exit(0);
  }

  console.log('User found:');
  console.log({ id: user._id.toString(), email: user.email, role: user.role, isActive: user.isActive });

  if (user.password) {
    const ok = await bcrypt.compare(password, user.password);
    console.log('Password matches provided value?', ok);
  } else {
    console.log('No stored password found (maybe not selected)');
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
