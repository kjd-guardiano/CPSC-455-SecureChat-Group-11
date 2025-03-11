var socket = io.connect('wss://' + document.domain + ':' + location.port);
var name = '';
chatters = [];
socket.on('connect', function () {            
    console.log('Connected to the server');
});

socket.on('response', function (data) {
    console.log('Server says: ' + data[0]);
    var receiver1 = data[1];
    console.log(receiver1);
    var chatWindow = document.getElementById('chat-window-' + receiver1);
    if (chatWindow) {
        var messageDisplay = chatWindow.querySelector('.message-display');
        var messageElement = document.createElement('div');
        messageElement.textContent = data[0];
        messageDisplay.appendChild(messageElement);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

});




socket.on('send_user_list', function (data) {
    var users = Object.values(data);  // Extract the user names from the dictionary
    var receiverSelect = document.getElementById('receiver');

    // Remove all existing options
    receiverSelect.options.length = 0;
    
    // Add new options based on the users array
    users.forEach(function (user) {
        receiverSelect.add(new Option(user, user));

        // Check if the user already has a chat window open
        if (!document.getElementById('chat-window-' + user)) {
            // Create a new chat window for each user
            createChatWindow(user);
        }

        // Add to the list of chatters
        chatters.push(user);
    });

    // Hide all chat windows except the one currently selected in the dropdown
    hideAllChatWindows();
    var selectedReceiver = receiverSelect.value;
    if (selectedReceiver) {
        showChatWindow(selectedReceiver);
    }
    document.getElementById('receiver').addEventListener('change', function () {
        var selectedReceiver = this.value;
        
        // Hide all chat windows
        hideAllChatWindows();
        
        // Show the chat window of the selected receiver
        showChatWindow(selectedReceiver);
    });
});


function hideAllChatWindows() {
    var chatWindows = document.querySelectorAll('.chat-window');
    chatWindows.forEach(function (chatWindow) {
        chatWindow.style.display = 'none';
    });
}

// Function to show a specific chat window
function showChatWindow(user) {
    var chatWindow = document.getElementById('chat-window-' + user);
    if (chatWindow) {
        chatWindow.style.display = 'block';
    }
}





function createChatWindow(user) {
    // Create a new chat container div
    var chatWindow = document.createElement('div');
    chatWindow.classList.add('chat-window');
    chatWindow.id = 'chat-window-' + user;  // Unique ID for each chat window

    // Create a title for the chat window
    var chatTitle = document.createElement('div');
    chatTitle.classList.add('chat-title');
    chatTitle.textContent = "Chat with " + user;
    chatWindow.appendChild(chatTitle);

    // Create a message display area
    var messageDisplay = document.createElement('div');
    messageDisplay.classList.add('message-display');
    chatWindow.appendChild(messageDisplay);

    // Find the 'messageContainer' div and append the chat window to it
    var messageContainer = document.getElementById("receivedHeader");
    messageContainer.appendChild(chatWindow);
}



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

    // Add the message to the sender's chat window immediately
    var senderChatWindow = document.getElementById('chat-window-' + receiver);  // Assuming `name` is the sender's username
    if (senderChatWindow) {
        var messageDisplay = senderChatWindow.querySelector('.message-display');
        var messageElement = document.createElement('div');
        messageElement.textContent = 'You: ' + message;  // Prefix with "You" to indicate the sender
        messageDisplay.appendChild(messageElement);
    }

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