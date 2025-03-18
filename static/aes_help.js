let server_aes_key

function send_aes_key() {
    const passphrase = CryptoJS.lib.WordArray.random(256 / 8); // Generate a 256-bit key
    console.log(passphrase)
    console.log("Generated AES Key:", passphrase.toString(CryptoJS.enc.Base64));
    server_aes_key= passphrase
    encrypted_key = encrypt_key(passphrase)
    socket.emit('send_aes',encrypted_key)
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
    console.log(msg_dict)
    return msg_dict;
}