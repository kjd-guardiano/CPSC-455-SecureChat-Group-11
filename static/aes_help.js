let server_aes_key

function send_aes_key() {
    const passphrase = CryptoJS.lib.WordArray.random(256 / 8); // Generate a 256-bit key
    server_aes_key= passphrase
    encrypted_key = encrypt_key(passphrase)
    socket.emit('send_aes',encrypted_key)
}

function encrypt_aes_string(plain_text, aes_encryption_key) {
    const iv = CryptoJS.lib.WordArray.random(16);  // 128-bit IV

    const encrypted = CryptoJS.AES.encrypt(plain_text, aes_encryption_key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });

    // Combine IV and ciphertext with a delimiter (e.g., ":")
    return CryptoJS.enc.Base64.stringify(iv) + ':' + encrypted.toString();
}

function decrypt_aes_string(encrypted_string, aes_decryption_key) {
    const parts = encrypted_string.split(':');
    if (parts.length !== 2) {
        console.error("Invalid encrypted format (expected iv:ciphertext)");
        return null;
    }

    const iv = CryptoJS.enc.Base64.parse(parts[0]);
    const ciphertext = parts[1];

    const bytes = CryptoJS.AES.decrypt(ciphertext, aes_decryption_key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });

    return bytes.toString(CryptoJS.enc.Utf8);
}

function encrypt_aes_dict(msg_dict,aes_encryption_key) {
    for (let key in msg_dict) {
        if (msg_dict.hasOwnProperty(key)) {
            const value = msg_dict[key];

            // Encrypt the value using AES with the server's AES key
            const encrypted_value = CryptoJS.AES.encrypt(value, aes_encryption_key, {
                mode: CryptoJS.mode.ECB, 
                padding: CryptoJS.pad.Pkcs7
            }).toString();  // Convert the encrypted message to string

            // Store the encrypted value back in the dictionary
            msg_dict[key] = encrypted_value;
        }
    }
    
    return msg_dict;
}



function decrypt_aes_dict(msg_dict,aes_decryption_key){

    for (let key in msg_dict) {
        if (msg_dict.hasOwnProperty(key,aes_decryption_key)) {
            const encrypted_value = msg_dict[key];

            const bytes = CryptoJS.AES.decrypt(encrypted_value, aes_decryption_key, {
                mode: CryptoJS.mode.ECB, 
                padding: CryptoJS.pad.Pkcs7 
            });

        
            const decrypted_value = bytes.toString(CryptoJS.enc.Utf8); 
            msg_dict[key] = decrypted_value;
        }
    }
    
    return msg_dict;
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