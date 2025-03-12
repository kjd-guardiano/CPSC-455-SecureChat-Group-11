var socket = io.connect('wss://' + document.domain + ':' + location.port);
var name = '';
chatters = [];

socket.on('connect', function () {            
    console.log('Connected to the server');
});

socket.on('response', function (data) {
    console.log('Server says: ' + data[0]);
    var receiver1 = data[1];
    if (receiver1 == global_receiver) {
    console.log(receiver1);
    add_chat('receive',receiver1,data[0])
    }
});




//recieves the success or failure of login attempt
socket.on('login1', function (data) {
    if (data[0] === 1) {
        name = document.getElementById('username').value;
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
    if (!receiver){
        return
    }
    chat_window_msg = 'you: ' + message
   add_chat('send',receiver,chat_window_msg)

    
    // Create message dictionary and emit it to the server
    dict_message = { message: message, user: name, receiver: receiver };
    socket.emit('message', dict_message);  // Sends the dictionary with the message
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