var socket = io.connect('wss://' + document.domain + ':' + location.port);
var name = '';

socket.on('connect', function () {
    console.log('Connected to the server');
});

socket.on('response', function (data) {
    console.log('Server says: ' + data);
    document.getElementById('received').innerHTML += data + "<br>";      // Adds message to list
});

socket.on('send_user_list', function (data) {
    var users = data;  // Extract the user list from the message
    var receiverSelect = document.getElementById('receiver');
    
    // Remove all existing options
    receiverSelect.options.length = 0;

    // Add the default "Select a name..." option
    receiverSelect.add(new Option('Select a name...', ''));

    // Add new options based on the users array
    users.forEach(function (user) {
        receiverSelect.add(new Option(user, user));
    });
});

// Receives the success or failure of login attempt
socket.on('login1', function (data) {
    if (data === 1) {
        name = document.getElementById('username').value;

        // Display the username
        document.getElementById('userDisplay').innerText = 'Logged in as: ' + name;
        document.getElementById('messageContainer').style.display = 'block';
        document.getElementById('login_form').style.display = "none";
    } else if (data === -1) {
        console.log("Login failed");
    }
});

function sendMessage() {
    var message = document.getElementById('message').value;
    document.getElementById('sent').innerHTML += message + "<br>";
    var receiver = document.getElementById('receiver').value;
    socket.emit('message', { message: message, user: name, receiver: receiver });  // Sends the dictionary
}

// Sends login info to server to verify
function login() {
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;
    socket.emit('authenticate', { username: username, password: password });
}
