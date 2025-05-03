send_receiver_shared_key = {}
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


socket.on('online_check', function (data1) {
    const nameEl = document.getElementById('receiver-name');
    const statusEl = document.getElementById('receiver-status');
    const containerEl = document.querySelector('.receiver-window1'); // <-- fixed

    nameEl.textContent = data1['receiver'];

    if (!data1['online']) {
        statusEl.textContent = ' – Offline';
        statusEl.style.fontSize = '0.9rem';
        statusEl.style.color = '#ff5555';
        containerEl.style.opacity = '0.3';
        containerEl.style.boxShadow = 'none'; // remove shadow
    } else {
        statusEl.textContent = ' – Online';
        statusEl.style.fontSize = '0.9rem';
        statusEl.style.color = '#7CFC00';
        containerEl.style.opacity = '1';
        containerEl.style.boxShadow = '0 4px 10px rgba(121, 121, 121, 0.18)';
    }
});


document.getElementById('receiver').addEventListener('change', function () {
     
    var selectedReceiver = this.value;
    if (!(selectedReceiver in send_receiver_shared_key)){
        send_receiver_shared_key[selectedReceiver]= deriveSharedAESKey(name,user_pass11,selectedReceiver)
    }

    const nameEl = document.getElementById('receiver-name');
    nameEl.textContent = selectedReceiver;
    global_receiver = selectedReceiver;
    socket.emit('is-online', { sender: name, receiver: selectedReceiver });
    
   
    

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
    data1.forEach(item => {
        item["2"] = decrypt_aes_string(item["2"], send_receiver_shared_key[global_receiver]);
    });

    // Display chat messages in reverse order
    data1.reverse().forEach(item => {
        if (item["0"] == name) {
            const message = "you: " + item["2"];
            add_chat('send', global_receiver, message, 1);
        } else {
            add_chat('receive', global_receiver, item["0"] + ": " + item["2"], 1);
        }
    });
});



function add_chat(type, receiver, message, position, error = null) {
    var chatWindow = document.getElementById('chat-window-' + receiver);
    if (chatWindow) {
        var messageDisplay = chatWindow.querySelector('.message-display');

        // Create message container
        var messageElement = document.createElement('text');
        messageElement.classList.add('message');

        // Create and set message text
        var messageText = document.createElement('text');
        messageText.classList.add('message-text');
        
        // Apply styles if error is set
        if (error) {
            
            messageText.style.color = 'red';
            messageText.style.fontSize = '0.8em';
        }

        messageText.innerHTML = formatText(message);
        messageElement.appendChild(messageText);

        // Normal message styling
        if (!error) {
            if (type === 'send') {
                messageElement.classList.add('sent-message');
            } else {
                messageElement.classList.add('received-message');
            }
        }

        // Insert at top or bottom
        if (position === 1) {
            messageDisplay.insertAdjacentElement('afterbegin', messageElement);
        } else {
            messageDisplay.appendChild(messageElement);
        }

        // Scroll to bottom
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

    // Create a message display area
    var messageDisplay = document.createElement('div');
    messageDisplay.classList.add('message-display');
    chatWindow.appendChild(messageDisplay);

    // Find the 'messageContainer' div and append the chat window to it
    var messageContainer = document.getElementById("receivedHeader");
    messageContainer.appendChild(chatWindow);
}
