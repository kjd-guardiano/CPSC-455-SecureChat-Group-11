var socket = io.connect('wss://' + document.domain + ':' + location.port);
var name = '';
chatters = [];

socket.on('connect', function () {            
    console.log('Connected to the server');
});

socket.on('response', function (data) {
    decrypted_dict = decrypt_aes(data)
    console.log('HIIIII',decrypted_dict)
    console.log('Server says: ' + decrypted_dict[0]);
    var receiver1 = decrypted_dict[1];
    if (receiver1 == global_receiver) {
    console.log(receiver1);
    add_chat('receive',receiver1,decrypted_dict[0])
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
        
    } else if (data[0] === -1) {
        console.log("Login failed");
    }
});


function sendMessage() {
    var message = document.getElementById('message').value;
    var receiver = document.getElementById('receiver').value;
    if (!message){
        return
    }
    chat_window_msg = 'you: ' + message
   add_chat('send',receiver,chat_window_msg)

    
    // Create message dictionary and emit it to the server
    dict_message = { message: message, user: name, receiver: receiver };
    encrypted_dict = encrypt_aes(dict_message)
    //AES ENCRYPTION
    socket.emit('message', encrypted_dict);  // Sends the dictionary with the message
}



function sign_up() {
    event.preventDefault();
    var username = document.getElementById('Sign_up_username').value;
    var password = document.getElementById('Sign_up_password').value;
    dict_userpass = { username: username, password: password }
    encrypted = encrypt_login(dict_userpass)
    socket.emit('sign_up', encrypted);
}
//sends login info to server to verify
function login() {
    event.preventDefault();
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;
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

function adjustHeight(el){
    el.style.height = (el.scrollHeight > el.clientHeight) ? (el.scrollHeight)+"px" : "40px";
}

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
                console.log(encryptedBase64)
                // Emit the encrypted file to the server (send only encrypted data, not the key)
                socket.emit('upload_file', {
                    filename: file.name,
                    file_data: encryptedBase64, // encrypted file data as base64 string
                    receiver: global_receiver
                });
            }
        };
        reader.readAsArrayBuffer(file); // Read file as binary data
    }
}

//checks for file uploading
socket.on('file_received', function(data) {
    //alert(`File uploaded: ${data.filename}`);    preventing universal alert for now.
    addFileToList(data.filename);
});

// Download File function
function downloadFile() {
    const filename = document.getElementById('filenameInput').value;
    
    if (!filename) {
        alert("Please enter a filename.");
        return;
    }
    
    // Emit request to download the file from server
    socket.emit('download_file', { filename:filename });

   

    // Listen for file not found
    socket.on('file_not_found', function(data) {
        alert(`File not found: ${data.filename}`);
    });
}

function addFileToList(filename) {
    const li = document.createElement('li');
    li.textContent = filename;
    document.getElementById('fileList').appendChild(li);
}




// Example usage: Assuming `data.file_data` is the base64-encoded encrypted file data and `data.filename` is the file name.
socket.on('file_download', function(data) {
    console.log("Received encrypted data:", data.file_data);
    const encryptedFile = data.file_data;  // Encrypted binary data
    const filename = data.filename;
    
    // Call the decryption function
    const decryptedBytes = decryptData(encryptedFile);  // Decrypt the data

    if (decryptedBytes) {
        // Create a Blob from the decrypted bytes
        const blob = new Blob([decryptedBytes], { type: 'application/octet-stream' });

        // Create a download link and trigger the download
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;  // Specify the desired file name here
        link.click();  // Trigger the download
    } else {
        console.error('Decryption failed.');
    }
});




