var socket = io.connect('wss://' + document.domain + ':' + location.port);

var user_pass11 = ''
var name = '';
chatters = [];

socket.on('connect', function () {            
    console.log('Connected to the server');
});

socket.on('response', function (data) {
    decrypted = decrypt_aes_dict(data,server_aes_key)
    const type = decrypted[0]
    var message = decrypted[2];
    const sender = decrypted[1];

    if (sender != global_receiver){
        return
    }

    if (type === "encrypted"){
        if (!(sender in send_receiver_shared_key)){
            send_receiver_shared_key[sender]= deriveSharedAESKey(name,user_pass11,sender)
        }
         message = decrypt_aes_string(message, send_receiver_shared_key[sender]);
         message1 = sender + ": " + message
        add_chat('receive', sender, message1);
    }
   else{
        add_chat('receive', sender, message, 0, true);
   
}
});

//VT scan status return function
socket.on('scan_status', (data) => {
    if (data.status === 'unsafe') {
        alert(`File flagged as unsafe: ${data.malicious} malicious reports found.`);
    }
    else if (data.status === 'too_large') {
        alert(`This file is too large.`);
    }
    else if (data.status === 'scan_failed') {
        alert(`Upload failed, please try again.`);
    }

});

//recieves the success or failure of login attempt
socket.on('login1', function (data) {
    if (data[0] === 1) {
        name = document.getElementById('username').value;
        send_aes_key();
        headerToggle();
        // Display the username
        document.getElementById('userDisplay').innerText = 'Logged in as: ' + name;
        document.getElementById('messageContainer').style.display = 'block';
        document.getElementById('login_form').style.display = "none";
        document.getElementById('sign_up_form').style.display = "none";
        
    }  else if (data[0] === -1) {
        const el = document.getElementById('log_in_text');
    
        // Check if error message already exists
        if (!document.getElementById('login-error')) {
            const errorSpan = document.createElement('span');
            errorSpan.id = 'login-error';
            errorSpan.style.color = 'red';
            errorSpan.style.fontSize = 'smaller';
            errorSpan.textContent = ' - Login invalid';
    
            el.appendChild(errorSpan);
    
            setTimeout(() => {
                errorSpan.remove();
            }, 5000);
        }
    
        console.log("Login failed");
    }
});

socket.on('signup', function (data) {
    const el = document.getElementById('sign_up_text'); // Make sure this element exists
    //todo
    // Remove old message if it's still there
    const oldMsg = document.getElementById('signup-msg');
    if (oldMsg) oldMsg.remove();

    let color;
    let message;

    if (data[0] === 1) {
        storeEncryptedDHKey(name, user_pass11);
        color = 'lightgreen';
        message = '- Signup successful';
    } else {
        color = 'red';
        message = '- Username taken';
    }

    el.innerHTML += ` <span id="signup-msg" style="color:${color}; font-size:smaller;">${message}</span>`;

    setTimeout(() => {
        const msg = document.getElementById('signup-msg');
        if (msg) msg.remove();
    }, 5000);
});

function sendMessage() {
    var message = document.getElementById('message').value;
    var receiver = document.getElementById('receiver').value;
    if (!message){
        return
    }
    if (message.trim().length === 0){
        return
    }
    chat_window_msg = 'you: ' + message
   add_chat('send',receiver,chat_window_msg)

   
    // Create message dictionary and emit it to the server
    dict_message = {
        
        message: encrypt_aes_string(message, send_receiver_shared_key[global_receiver]),
        user: name,
        receiver: receiver
    };
   
    dict_message = encrypt_aes_dict(dict_message,server_aes_key)
    console.log(dict_message)
    //AES ENCRYPTION
    socket.emit('message', dict_message);  // Sends the dictionary with the message
}



function sign_up() {

    event.preventDefault();
    var username = document.getElementById('Sign_up_username').value;
    name = username;
    var password = document.getElementById('Sign_up_password').value;
    user_pass11 = password;
    dict_userpass = { username: username, password: password }
    encrypted = encrypt_login(dict_userpass)
    socket.emit('sign_up', encrypted);
}
//sends login info to server to verify
function login() {
    event.preventDefault();
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;
    user_pass11 = password;
    dict_userpass = { username: username, password: password }
    encrypted =encrypt_login(dict_userpass)
    socket.emit('authenticate',encrypted );
}

// for swapping from 
function headerToggle() {
    var loginHeader = document.getElementById('loginContainer');
    if (loginHeader.style.display === "none"){
        loginHeader.style.display = "block";
    }
    else {
        loginHeader.style.display = "none";
    }
    var signupHeader = document.getElementById('signupContainer');
    if (signupHeader.style.display === "none"){
        signupHeader.style.display = "block";
    }
    else {
        signupHeader.style.display = "none";
    }
}

// Adjusts the height of a text area based on its content
function adjustHeight(el){
    el.style.height = (el.scrollHeight > el.clientHeight) ? (el.scrollHeight)+"px" : "40px";
}

// Reads and encrypts a file, then sends it to the server
function uploadFile() {
    const file = document.getElementById('fileInput').files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const fileData = new Uint8Array(event.target.result); // Read as Uint8Array (binary data)

            // Convert the ArrayBuffer to a CryptoJS WordArray
            const wordArray = CryptoJS.lib.WordArray.create(fileData);

            // Encrypt the file data using AES in ECB mode
            const encryptedData = CryptoJS.AES.encrypt(wordArray, server_aes_key, {
                mode: CryptoJS.mode.ECB,
                padding: CryptoJS.pad.Pkcs7
            });

            // Convert the encrypted data to base64 string
            const encryptedBase64 = encryptedData.toString(CryptoJS.format.Base64);

            if (global_receiver) {
                // Emit the encrypted file to the server
                socket.emit('upload_file', {
                    filename: file.name,
                    file_data: encryptedBase64,
                    receiver: global_receiver
                });
            }
        };
        reader.readAsArrayBuffer(file); // Read file as binary data
    }
}

// Adds a received filename to the file list
function addFileToList(filename) {
    const li = document.createElement('li');
    li.textContent = filename;
    document.getElementById('fileList').appendChild(li);
}

// Requests a file download from the server based on filename input
function downloadFile() {
    const filename = document.getElementById('filenameInput').value;
    
    if (!filename) {
        alert("Please enter a filename.");
        return;
    }

    // Emit request to download the file from server
    socket.emit('download_file', { filename: filename });

    // Listen for file not found
    socket.on('file_not_found', function(data) {
        alert(`File not found: ${data.filename}`);
    });
}

// Handles receiving and decrypting an encrypted file, then triggers download
socket.on('file_download', function(data) {
    console.log("Received encrypted data:", data.file_data);
    const encryptedFile = data.file_data;
    const filename = data.filename;
    
    // Call the decryption function
    const decryptedBytes = decryptData(encryptedFile);

    if (decryptedBytes) {
        const blob = new Blob([decryptedBytes], { type: 'application/octet-stream' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    } else {
        console.error('Decryption failed.');
    }
});

// Handles server confirmation that a file was received
socket.on('file_received', function(data) {
    addFileToList(data.filename);
});


// formatting
function formatText(text) {
    //bold
    text = text.replace(/\*\*(.*?)\*\*/g, '<span class="bold">$1</span>');
    //italics
    text = text.replace(/\*(.*?)\*/g, '<span class="italic">$1</span>');
    //underline
    text = text.replace(/_(.*?)_/g, '<span class="underline">$1</span>');
    return text;
}
