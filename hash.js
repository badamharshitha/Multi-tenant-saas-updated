const bcrypt = require('bcrypt');

async function generate() {
  console.log("SuperAdmin:", await bcrypt.hash("Admin@123", 10));
  console.log("DemoAdmin:", await bcrypt.hash("Demo@123", 10));
  console.log("User:", await bcrypt.hash("User@123", 10));
}

generate();
