
received_log = [];
global_receiver = ''

socket.on('send_user_list', function (data) {
    console.log('SENDINGDDDD')
    var users = Object.values(data);  // Extract the user names from the dictionary
    var receiverSelect = document.getElementById('receiver');

    // Remove all existing options
    receiverSelect.options.length = 0;
    
    receiverSelect.add(new Option('', ''));
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
    
});

document.getElementById('receiver').addEventListener('change', function () {
    
    var selectedReceiver = this.value;
    global_receiver = selectedReceiver;
    if (!received_log.includes(selectedReceiver)){
        
        received_log.push(selectedReceiver)
        console.log(received_log)
        console.log(selectedReceiver)
        socket.emit('chat_log',{sender: name, receiver : selectedReceiver})
    }
    
    // Hide all chat windows
    hideAllChatWindows();
    
    // Show the chat window of the selected receiver
    showChatWindow(selectedReceiver);
});

   
socket.on('send_log', function (data1) {
    
    data1.reverse().forEach(item => {
        if (item["0"] == name){
            message = "you: " + item["2"]
            add_chat( global_receiver, message,1)
        }
        else{
            add_chat(global_receiver,item["0"]+": "+item["2"],1)
        }
      
    });
   
});





function add_chat(receiver,message,position){
    var chatWindow = document.getElementById('chat-window-' + receiver);
    if (chatWindow) {
        var messageDisplay = chatWindow.querySelector('.message-display');
        var messageElement = document.createElement('div');
        messageElement.textContent = message;
        messageDisplay.appendChild(messageElement);
        if (position === 1) {
            // Insert the message at the top
            messageDisplay.insertAdjacentElement('afterbegin', messageElement);
        } else {
            // Append the message at the bottom
            messageDisplay.appendChild(messageElement);
        }

        chatWindow.scrollTop = chatWindow.scrollHeight;
    }
}



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
