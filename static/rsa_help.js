let server_publickey;

socket.on('public_key', function (data) {
    console.log(data);
     server_publickey = data
});


function encrypt_login(login_info_dict) {
    const encryption = new JSEncrypt();
    encryption.setPublicKey(server_publickey);
    console.log('encrypting login info');

    encrypted_dict = {};
    
    for (let key in login_info_dict ){
        let encrypted_value = encryption.encrypt(login_info_dict[key]);
        encrypted_dict[key] = encrypted_value

    }
    console.log(encrypted_dict)
    return encrypted_dict
}   

function encrypt_key(aes_key){
    const encryptor = new JSEncrypt();
    encryptor.setPublicKey(server_publickey);

    const aesKeyBase64 = aes_key.toString(CryptoJS.enc.Base64);
    const encryptedAESKey = encryptor.encrypt(aesKeyBase64);
    return encryptedAESKey
}