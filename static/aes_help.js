let server_aes_key

function send_aes_key() {
    const passphrase = CryptoJS.lib.WordArray.random(256 / 8); // Generate a 256-bit key
    server_aes_key= passphrase
    encrypted_key = encrypt_key(passphrase)
    socket.emit('send_aes',encrypted_key)
}

function encrypt_aes_string(plain_text, aes_encryption_key) {
    const encrypted = CryptoJS.AES.encrypt(plain_text, aes_encryption_key, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    });

    return encrypted.toString();  // ciphertext as base64
}


function decrypt_aes_string(encrypted_string, aes_decryption_key) {
    const bytes = CryptoJS.AES.decrypt(encrypted_string, aes_decryption_key, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    });

    return bytes.toString(CryptoJS.enc.Utf8);
}


function decryptData(encryptedFileB64) {
    // Decode the base64-encoded encrypted file using crypto-js
    const encryptedData = CryptoJS.enc.Base64.parse(encryptedFileB64);  // Decode from Base64
    const aesKey = server_aes_key;  // Assuming aesKey is available globally

    // Decrypt the data using AES-ECB mode (no IV)
    const decryptedData = CryptoJS.AES.decrypt(
        { ciphertext: encryptedData },
        aesKey,
        { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
    );

    // Check if decryption was successful (decrypted data has byte length)
    if (decryptedData.sigBytes > 0) {
        // Convert the decrypted data into a byte array (Uint8Array)
        const decryptedBytes = new Uint8Array(decryptedData.sigBytes);
        for (let i = 0; i < decryptedData.sigBytes; i++) {
            decryptedBytes[i] = decryptedData.words[i >>> 2] >>> (24 - (i % 4) * 8) & 0xff;
        }

        return decryptedBytes;  // Return the decrypted bytes as a Uint8Array
    } else {
        return null;  // Return null if decryption failed
    }
}