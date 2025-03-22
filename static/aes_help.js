let server_aes_key

function send_aes_key() {
    const passphrase = CryptoJS.lib.WordArray.random(256 / 8); // Generate a 256-bit key
    server_aes_key= passphrase
    encrypted_key = encrypt_key(passphrase)
    socket.emit('send_aes',encrypted_key)
}


function encrypt_aes(msg_dict) {
    for (let key in msg_dict) {
        if (msg_dict.hasOwnProperty(key)) {
            const value = msg_dict[key];

            // Encrypt the value using AES with the server's AES key
            const encrypted_value = CryptoJS.AES.encrypt(value, server_aes_key, {
                mode: CryptoJS.mode.ECB, 
                padding: CryptoJS.pad.Pkcs7
            }).toString();  // Convert the encrypted message to string

            // Store the encrypted value back in the dictionary
            msg_dict[key] = encrypted_value;
        }
    }
    
    return msg_dict;
}


function decrypt_aes(msg_dict){

    for (let key in msg_dict) {
        if (msg_dict.hasOwnProperty(key)) {
            const encrypted_value = msg_dict[key];

            const bytes = CryptoJS.AES.decrypt(encrypted_value, server_aes_key, {
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