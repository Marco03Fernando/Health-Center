require('dotenv').config();
const mongoose = require('mongoose');

const MONGO = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!MONGO) { console.error('No MONGO_URI found in environment'); process.exit(2); }

const email    = (process.argv[2] || 'labtech@healthcenter.com').trim().toLowerCase();
const password = process.argv[3] || 'labtech@123';
const name     = process.argv[4] || 'Lab Technician';
const centerId = process.argv[5] || null;

async function run() {
  await mongoose.connect(MONGO);
  console.log('Connected to MongoDB');

  const Admin = require('../src/models/doctorChanneling/Admin/Admin');

  const existing = await Admin.findOne({ email });
  if (existing) {
    existing.name     = name;
    existing.role     = 'lab-tech';
    existing.isActive = true;
    if (centerId) existing.centerId = new mongoose.Types.ObjectId(centerId);
    // Re-hash password on save (pre-save hook handles it)
    existing.password = password;
    await existing.save();
    console.log('\n✔  Updated existing lab tech account:');
  } else {
    await Admin.create({
      name,
      email,
      password,
      role: 'lab-tech',
      centerId: centerId ? new mongoose.Types.ObjectId(centerId) : null,
      isActive: true,
    });
    console.log('\n✔  Lab tech account created:');
  }

  console.log('─────────────────────────────');
  console.log('  URL       : http://localhost:5173/lab-tech/login');
  console.log(`  Email     : ${email}`);
  console.log(`  Password  : ${password}`);
  console.log('─────────────────────────────\n');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
