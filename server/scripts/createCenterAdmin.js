require('dotenv').config();
const mongoose = require('mongoose');

const MONGO = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!MONGO) { console.error('No MONGO_URI found in environment'); process.exit(2); }

async function run() {
  await mongoose.connect(MONGO, { dbName: process.env.MONGO_DB_NAME });
  console.log('Connected to MongoDB');

  const Admin = require('../src/models/doctorChanneling/Admin/Admin');

  const centerId = process.argv[2];
  const email    = (process.argv[3] || 'centeradmin@gmail.com').trim().toLowerCase();
  const password = process.argv[4] || 'center@123';
  const name     = process.argv[5] || 'Center Admin';

  if (!centerId) { console.error('Usage: node createCenterAdmin.js <centerId> [email] [password] [name]'); process.exit(1); }

  const existing = await Admin.findOne({ email });
  if (existing) {
    // Update existing record with centerId + role
    existing.role     = 'admin';
    existing.centerId = new mongoose.Types.ObjectId(centerId);
    existing.isActive = true;
    await existing.save();
    console.log('Updated existing admin:');
    console.log({ id: existing._id.toString(), email: existing.email, role: existing.role, centerId: existing.centerId.toString() });
  } else {
    const admin = await Admin.create({ name, email, password, role: 'admin', centerId: new mongoose.Types.ObjectId(centerId), isActive: true });
    console.log('Center admin created:');
    console.log({ id: admin._id.toString(), email: admin.email, role: admin.role, centerId: admin.centerId.toString() });
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
