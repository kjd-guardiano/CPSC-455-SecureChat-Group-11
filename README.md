# SecureChat User Guide
This readme is a user guide for CPSC 455 Project 1, "SecureChat". Please refer to the following documentation for instructions on how to use this application.

Please note that this is, at the time of writing, a **proof-of-concept**, and may be subject to change later on. 

## Features
### Real-Time Messaging
Users connect to each other via web-client access. Messages appear instantly for all appropriate connected clients, as users must choose who to send their messages to.

### Secure Connection
All connections occur via WebSocket Secure over HTTPS.

### User Authentication
Basic authentication occurs via a username and password. Passwords are not stored on the server. As a proof-of-concept, there are only four possible usernames/passwords to use. See Usage for testing.

### Rate Limiting
Rate-limiting occurs both for initial connections (accessing the server) and messaging. Messages are not sent to their target destination when rate-limiting is enabled, shown on both console and as a message directly to the rate-limited user.

### Connection Handling
Joining and disconnecting are handled via the opening/closing of the web browser used to access the application. To ensure reconnection on interruption, refresh the page on the web browser of choice.

##  Usage
To run the server application, open your terminal of choice (Terminal, Command Prompt, etc.) and navigate to the folder containing the application on the terminal. Then, run it as a Python application (**python3 app.py**). The terminal will provide feedback that the server is active, and provide a HTTPS link.

To run as a client, enter the link provided by the server terminal into a web browser of your choice (Firefox, Google Chrome, etc.). This will bring you to a log-in screen. Currently, there are four available users to test via this proof-of-concept application, shown below:

Format: __Username__				__Password__

Billy								123456

Sally								654321

Joe									55555

Jill								3333

When sending messages, type into the provided text box and hit send. The webpage will show both messages sent by the currently logged-in user and any messages received. Note that users that are not online will not have messages sent to them, and the server will send a message explaining that the user could not receive the message, as they are offline. Only online users can be sent messages.
