require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const email = process.argv[2];
  if (!email) { console.log('usage: node promote.js <email>'); process.exit(1); }
  const u = await User.findOneAndUpdate({ email }, { role: 'admin' }, { new: true });
  console.log(u ? `promoted ${u.email} -> ${u.role}` : 'user not found');
  process.exit(0);
})();