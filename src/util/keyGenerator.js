import crypto from 'crypto';

// Generate a 32-byte (256-bit) random key
const encryptionKey = crypto.randomBytes(32).toString('hex');

console.log('Generated ENCRYPTION_KEY_FORGE:', encryptionKey);
console.log('Length of key (characters):', encryptionKey.length); // Should be 64 characters (32 bytes * 2 hex chars/byte)