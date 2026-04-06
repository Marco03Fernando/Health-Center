require('dotenv').config();
const mongoose = require('mongoose');

const MONGO = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!MONGO) { console.error('No MONGO_URI found in environment'); process.exit(2); }

const email    = (process.argv[2] || 'pharmacy@healthcenter.com').trim().toLowerCase();
const password = process.argv[3] || 'pharmacy@123';
const fullName = process.argv[4] || 'Pharmacist';
const phone    = process.argv[5] || '0771234567';

async function run() {
  await mongoose.connect(MONGO);
  console.log('Connected to MongoDB');

  const User = require('../src/models/doctorChanneling/user.model');

  const existing = await User.findOne({ email });
  if (existing) {
    existing.fullName = fullName;
    existing.phone    = phone;
    existing.role     = 'pharmacy';
    existing.isActive = true;
    existing.password = password; // pre-save hook re-hashes
    await existing.save();
    console.log('\n✔  Updated existing pharmacist account:');
  } else {
    await User.create({ fullName, phone, email, password, role: 'pharmacy', isActive: true, mustChangePassword: false });
    console.log('\n✔  Pharmacist account created:');
  }

  console.log('─────────────────────────────────────────');
  console.log('  Portal URL : http://localhost:8080/pharmacy/login');
  console.log(`  Email      : ${email}`);
  console.log(`  Password   : ${password}`);
  console.log('─────────────────────────────────────────\n');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
