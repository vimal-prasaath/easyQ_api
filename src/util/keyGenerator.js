import crypto from 'crypto';

// Generate a 32-byte (256-bit) random key
const encryptionKey = crypto.randomBytes(32).toString('hex');

