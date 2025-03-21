
received_log = [];
global_receiver = ''

socket.on('send_user_list', function (data) {
    var users = Object.values(data);
    var receiverSelect = document.getElementById('receiver');

    var blankOptionExists = [...receiverSelect.options].some(o => o.value === '');
    if (!blankOptionExists) {
        receiverSelect.add(new Option('', ''));
    }
    users.forEach(user => {
        
        var userExists = [...receiverSelect.options].some(o => o.value === user);
        if (!userExists) {
            receiverSelect.add(new Option(user, user));
        }

        if (!document.getElementById('chat-window-' + user)) {
            createChatWindow(user);
        }

        if (!chatters.includes(user)) {
            chatters.push(user);
        }
    });

    [...receiverSelect.options].forEach(option => {
        if (option.value !== '' && !users.includes(option.value)) {
            receiverSelect.remove(option.index);
        }
    });

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
    for (let i in data1){
        data1[i] = decrypt_aes(data1[i]);
    }
    
    data1.reverse().forEach(item => {
        if (item["0"] == name){
            message = "you: " + item["2"]
            add_chat('send', global_receiver, message,1)
        }
        else{
            add_chat('receive',global_receiver,item["0"]+": "+item["2"],1)
        }
      
    });
   
});





function add_chat(type,receiver, message, position) {
    var chatWindow = document.getElementById('chat-window-' + receiver);
    if (chatWindow) {
        var messageDisplay = chatWindow.querySelector('.message-display');
        
        // Create message container div
        var messageElement = document.createElement('text');
        messageElement.classList.add('message');

        // Create message text element
        var messageText = document.createElement('text');
        messageText.classList.add('message-text');
        messageText.innerHTML = formatText(message);

        // Check if the message is sent by the user or received
        if (type === 'send') {  // Sent message
            messageElement.classList.add('sent-message');
        } else {  // Received message
            messageElement.classList.add('received-message');
        }

        // Append message text to the message container
        messageElement.appendChild(messageText);

        // Insert the message at the top if position is 1
        if (position === 1) {
            messageDisplay.insertAdjacentElement('afterbegin', messageElement);
        } else {
            messageDisplay.appendChild(messageElement);
        }

        // Scroll the chat window to the bottom
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
