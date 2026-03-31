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

  const Admin = require('../src/models/doctorChanneling/Admin/Admin');

  const email = (process.argv[2] || 'admin@gmail.com').trim().toLowerCase();
  const password = process.argv[3] || 'admin@123';

  const admin = await Admin.findOne({ email }).select('+password');
  if (!admin) {
    console.log('Admin not found for email:', email);
    process.exit(0);
  }

  console.log('Admin found:');
  console.log({ id: admin._id.toString(), email: admin.email, role: admin.role, isActive: admin.isActive });

  if (admin.password) {
    const ok = await bcrypt.compare(password, admin.password);
    console.log('Password matches provided value?', ok);
  } else {
    console.log('No stored password found (maybe not selected)');
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
