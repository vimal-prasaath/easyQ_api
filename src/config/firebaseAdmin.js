import admin from "firebase-admin";
import { createRequire } from "module";
import dotenv from "dotenv";
import { readFileSync } from "fs"; // <--- THIS IS CRUCIAL: Import Node.js File System module

dotenv.config(); // <--- Make sure this is called at the very top of the file

const require = createRequire(import.meta.url);

let serviceAccount;
try {
  const serviceAccountPath = process.env.SERVICE_ACCOUNT_PATH;

  if (!serviceAccountPath) {
    throw new Error(
      "SERVICE_ACCOUNT_PATH environment variable is not set. Please set it to the path of your Firebase service account JSON file."
    );
  }

  // IMPORTANT: Read the file directly, then parse its content as JSON
  const fileContent = readFileSync(serviceAccountPath, "utf8");
  serviceAccount = JSON.parse(fileContent);
} catch (error) {
  console.error(
    "Critical Error: Failed to load or parse Firebase service account key from file:",
    error.message
  );
  // If the key cannot be loaded, the app cannot function correctly, so it's best to exit.
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.STORAGE_BUCKET_NAME,
  });
}

export default admin;
