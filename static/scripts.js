var socket = io.connect('wss://' + document.domain + ':' + location.port);
var name = '';
socket.on('connect', function () {            
    console.log('Connected to the server');
});

socket.on('response', function (data) {
    console.log('Server says: ' + data[0]);
    document.getElementById('received').innerHTML += data[0] + "<br>";      //adds message to list
});

socket.on('send_user_list', function (data) {
    var users = Object.values(data);  // Extract the user names from the dictionary
    var receiverSelect = document.getElementById('receiver');

    // Remove all existing options
    receiverSelect.options.length = 0;
    // Add new options based on the users array
    users.forEach(function (user) {
        receiverSelect.add(new Option(user, user));
    });
});


//recieves the success or failure of login attempt
socket.on('login1', function (data) {
    if (data[0] === 1) {
        name = document.getElementById('username').value;

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
    document.getElementById('sent').innerHTML += message + "<br>";
    var receiver = document.getElementById('receiver').value;
    dict_message = { message: message, user: name, receiver: receiver }
    socket.emit('message',dict_message);         //sends the dictonary
}


function sign_up() {
    event.preventDefault();
    var username = document.getElementById('Sign_up_username').value;
    var password = document.getElementById('Sign_up_password').value;
    dict_userpass = { username: username, password: password }
    socket.emit('sign_up', dict_userpass);
}
//sends login info to server to verify
function login() {
    event.preventDefault();
    console.log(username, password);
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;
    dict_userpass = { username: username, password: password }
    headerToggle();
    socket.emit('authenticate',dict_userpass );
}

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