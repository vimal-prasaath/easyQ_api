import forge from 'node-forge';
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';
import dotenv from 'dotenv';
const secretKeyHex = process.env.ENCRYPTION_KEY_FORGE || "aa748821e840054a19d3ced7ef0d3f13eae83b3309b6ee9eaa14e5e53048cb38";
dotenv.config()
if (!secretKeyHex || secretKeyHex.length !== 64) {
}
let secretKey = null;
try {
    if (!secretKeyHex || secretKeyHex.length !== 64) {
        throw new EasyQError(
            'ConfigurationError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            'CRITICAL ERROR: ENCRYPTION_KEY_FORGE is missing or not a 32-byte (64-character hex) key.'
        );
    }
    secretKey = forge.util.hexToBytes(secretKeyHex);
} catch (error) {
    console.error(error.message);
    // In a production environment, you might want to consider exiting the process
    // or marking the service as unhealthy if the encryption key is critical and invalid.
}
export const encryptBufferForge = (buffer) => {
    if (!secretKey) {
        throw new EasyQError(
            'EncryptionKeyError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            'Encryption key not properly initialized. Cannot encrypt.'
        );
    }
    if (!buffer || !Buffer.isBuffer(buffer)) {
        throw new EasyQError(
            'ValidationError',
            httpStatusCode.BAD_REQUEST,
            true,
            'Input for encryption must be a Buffer.'
        );
    }

    try {
        const iv = forge.random.getBytesSync(16);

        const cipher = forge.cipher.createCipher('AES-CBC', secretKey);
        cipher.start({ iv: iv });
        cipher.update(forge.util.createBuffer(buffer.toString('binary')));
        cipher.finish();

        const encryptedData = cipher.output.toHex();
        const ivHex = forge.util.bytesToHex(iv);

        return { iv: ivHex, encryptedData: encryptedData };
    } catch (error) {
        throw new EasyQError(
            'EncryptionFailedError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `File encryption failed: ${error.message}`
        );
    }
};

export const decryptBufferForge = (encryptedDataHex, ivHex) => {
    if (!secretKey) {
        throw new EasyQError(
            'EncryptionKeyError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            'Decryption key not properly initialized. Cannot decrypt.'
        );
    }
    if (!encryptedDataHex || typeof encryptedDataHex !== 'string' || !ivHex || typeof ivHex !== 'string') {
        throw new EasyQError(
            'ValidationError',
            httpStatusCode.BAD_REQUEST,
            true,
            'Encrypted data and IV must be provided as hex strings for decryption.'
        );
    }

    try {
        const iv = forge.util.hexToBytes(ivHex);
        const encryptedData = forge.util.hexToBytes(encryptedDataHex);
        const decipher = forge.cipher.createDecipher('AES-CBC', secretKey);
        decipher.start({ iv: iv });
        decipher.update(forge.util.createBuffer(encryptedData));
        const result = decipher.finish();

        if (!result) {
            throw new EasyQError(
                'DecryptionFailedError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Decryption failed. Check encrypted data and IV. (Possible tampered or incorrect data).'
            );
        }

        return Buffer.from(decipher.output.getBytes(), 'binary');
    } catch (error) {

        if (error instanceof EasyQError) {
            throw error;
        }
        throw new EasyQError(
            'DecryptionError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Error during file decryption process: ${error.message}`
        );
    }
};


