# SecureChat User Guide
This readme is a user guide for CPSC 455 Project 1, "SecureChat". Please refer to the following documentation for instructions on how to use this application.

## Features
### Real-Time Messaging
Users connect to each other via web-client access. Messages appear instantly for all appropriate connected clients, as users must choose who to send their messages to. Users will also be shown if the chosen user they want to talk to is online (green and not greyed-out username) or offline (red and greyed-out username).

#### Basic Text Formatting
Users can add underlined, bolded, and italicized text to their messages. In order to do so:

For *italicized text*, surround the text in single asterisks (*). Example: \*text\* = *text*

For **bolded text**, surround the text in double asterisks (**). Example: \*\*text\*\* = **text**

For <ins>underlined text</ins>, surround the text in underscores (_). Example: \_text\_ = <ins>text</ins>
#### Emoji Support
Users can now add emojis to their messages from a pre-determined list located on the right of the browser window.

### Secure Connection
All connections occur via WebSocket Secure over HTTPS, with certificates for the website handled via Render.

### Secure Messaging with AES & Encrypted Key Storage
Each user is assigned a Diffie-Hellman key pair. The private key is encrypted using an AES key derived from the user’s password, plus a random salt and IV. The encrypted private key, public key, salt, and IV are all stored in Firebase.

On login, the private key is decrypted client-side. For messaging, a shared secret is generated using Diffie-Hellman, and messages are encrypted with AES using that secret. Firebase rules prevent deletion or modification of stored keys, ensuring data integrity.

### User Authentication
Basic authentication occurs via a username and password. Passwords are not stored directly on the server. In order to create an account, enter a username and password to the Sign Up form at the bottom of the landing page and click the sign-up button. From there, you can use the same login combination to log in. Protections for authentication also exist, such as brute force protection, end-to-end encryption, and chat logs that can be reviewed. Passwords are also stored through hashing + salting, for security.

### Rate Limiting
Rate-limiting occurs both for initial connections (accessing the server) and messaging. Messages are not sent to their target destination when rate-limiting is enabled, shown as a message directly to the rate-limited user in the relevant chat.

### Connection Handling
Joining and disconnecting are handled via the opening/closing of the web browser used to access the application, as well as the log-out button in the top-right of the application when logged in as a user. To ensure reconnection on interruption, refresh the page on the web browser of choice.

##  Usage
To access this application, go to [https://cpsc-455-securechat-group-11.onrender.com/](https://cpsc-455-securechat-group-11.onrender.com/). This will bring you to a log-in screen, where you can then sign-up using a username/password of choice. Afterwards, the user can log in via the same combination and chat with any existing users on the site, provided they are online.

When sending messages, click the message box, type your message, and hit enter. The webpage will show both messages sent by the currently logged-in user and any messages received by the selected user. Users will be shown as either offline, as they are not available on the server and therefore will not receive any messages sent at that current point in time, or online, at which point you will be able to synchronously communicate with one another.

When uploading files, select a user in the dropdown menu, click the "Browse" button in the Upload section of the application, then choose a file from your computer. Files can only be 32MB or lower. Afterwards, click the "Upload" button on the website. This will upload the file to the server.

When downloading a file, type in the exact name of the file in the Download section of the application, then hit "Download". These files are scanned for malware before being forwarded to the user, who is then prompted to install based on their browser of choice's handling of files from websites.
