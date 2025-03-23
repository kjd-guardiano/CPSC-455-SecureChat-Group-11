# SecureChat User Guide
This readme is a user guide for CPSC 455 Project 1, "SecureChat". Please refer to the following documentation for instructions on how to use this application.

## Features
### Real-Time Messaging
Users connect to each other via web-client access. Messages appear instantly for all appropriate connected clients, as users must choose who to send their messages to.
#### Basic Text Formatting
Users can add underlined, bolded, and italicized text to their messages. In order to do so:

For *italicized text*, surround the text in single asterisks (*). Example: \*text\* = *text*

For **bolded text**, surround the text in double asterisks (**). Example: \*\*text\*\* = **text**

For <ins>underlined text</ins>, surround the text in underscores (_). Example: \_text\_ = <ins>text</ins>
#### Emoji Support
Users can now add emojis to their messages from a pre-determined list located on the right of the browser window.

### Secure Connection
All connections occur via WebSocket Secure over HTTPS.

### User Authentication
Basic authentication occurs via a username and password. Passwords are not stored on the server. In order to create an account, enter a username and password to the Sign Up form at the bottom of the landing page and click the sign-up button. From there, you can use the same login combination to log in. Protections for authentication also exist, such as brute force protection, end-to-end encryption, and chat logs that can be reviewed. Passwords are also stored on the server through hashing + salting, for security.

### Rate Limiting
Rate-limiting occurs both for initial connections (accessing the server) and messaging. Messages are not sent to their target destination when rate-limiting is enabled, shown on both console and as a message directly to the rate-limited user.

### Connection Handling
Joining and disconnecting are handled via the opening/closing of the web browser used to access the application. To ensure reconnection on interruption, refresh the page on the web browser of choice.

##  Usage
To run the server application, open your terminal of choice (Terminal, Command Prompt, etc.) and navigate to the folder containing the application on the terminal. Then, run it as a Python application (**python3 app.py**, **python app.py**). The terminal will provide feedback that the server is active, and provide a HTTPS link for both localhost and LAN. In order to communicate between multiple devices, utilize the second LAN link provided by the terminal.

In the event you do not have the Python dependencies to run the application, use the command **pip install -r requirements.txt** to download the necessary libraries.

To run as a client, enter the link provided by the server terminal into Mozilla Firefox. Currently, browser support only exists for Firefox, and the application will not be able to be accessed on LAN networks on browsers such as Microsoft Edge or Google Chrome. This will bring you to a log-in screen. 

When sending messages, type into the provided text box and hit send. The webpage will show both messages sent by the currently logged-in user and any messages received by the selected user. Note that users that are not online will not have messages sent to them, and the server will send a message explaining that the user could not receive the message, as they are offline. Only online users can be sent messages. Messages that remain as logs on the server can be reviewed at any point in time when logged on while the server remains active.
