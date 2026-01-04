import bcrypt from "bcryptjs"

async function testPassword() {
  const password = "SuperAdmin123!"

  // Test the existing hash
  const existingHash = "$2b$12$LQv3c1yqBwEHxv03kpDOCOHgn.1L5YduQXqvCwuBpMGprifbgJ/FG"
  const isValidExisting = await bcrypt.compare(password, existingHash)
  console.log("Existing hash validation:", isValidExisting)

  // Generate a fresh hash
  const freshHash = await bcrypt.hash(password, 12)
  console.log("Fresh hash:", freshHash)

  // Test the fresh hash
  const isValidFresh = await bcrypt.compare(password, freshHash)
  console.log("Fresh hash validation:", isValidFresh)

  // Test with different rounds
  const hash10 = await bcrypt.hash(password, 10)
  console.log("Hash with 10 rounds:", hash10)
  const isValid10 = await bcrypt.compare(password, hash10)
  console.log("10 rounds validation:", isValid10)
}

testPassword().catch(console.error)
