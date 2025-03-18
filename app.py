from flask import Flask, render_template, request, send_from_directory
from flask_socketio import SocketIO
from flask_limiter import Limiter
from ftplib import FTP
from flask_limiter.util import get_remote_address
from contextlib import asynccontextmanager
from ratelimits import *
from security import rsa_crypto,aes_crypto
import asyncio, math, time, authentication, clients, os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'dummy_secret_key'

#rate limiting link access default settings
access_limiter = Limiter(get_remote_address,
                         app=app,
                         default_limits=['200 per day', '20 per hour'],
                         storage_uri="memory://")


#Directory for file storage
upload_folder = './SecureChat_Upload'
#Directory check, creating new folder if the previously specified does not exist.
if not os.path.exists(upload_folder):
    os.makedirs(upload_folder)

#socket setup
socketio = SocketIO(app, ping_interval=20, ping_timeout=60, logger=True, engineio_logger=True)

users = clients.clients()   #class that stores info on all clients
rsa_helper = rsa_crypto.rsa_help()
aes_helper = aes_crypto.aes_help()

#for serving uploaded files on request
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(upload_folder, filename)

@app.route('/') 
def index():
    
    return render_template('index.html')

#event for file uploading
@socketio.on('upload_file')
def handle_upload(data):
    file_name = data['filename']
    file_data = data['file_data']

    # Save the file to the server's file system
    file_path = os.path.join(upload_folder, file_name)
    
    # Open the file and write the binary data to it
    try:
        with open(file_path, 'wb') as f:
            f.write(file_data)

        # Emit the file information to the receiving client (file name)
        socketio.emit('file_received', {'filename': file_name}, to=request.sid)
    except Exception as e:
        print(f"Error during file upload: {e}")
        socketio.emit('file_error', {'message': 'File upload failed'}, to=request.sid)


#event for file downloading
@socketio.on('download_file')
def handle_download(data):
    file_name = data['filename']
    file_path = os.path.join(upload_folder, file_name)
    #session ID for specific user requesting the download
    
    if os.path.exists(file_path):
        # Send the file download event back to the requesting client
        socketio.emit('file_download', {'filename': file_name}, to=request.sid)
    else:
        # If the file doesn't exist, notify the client
        socketio.emit('file_not_found', {'filename': file_name}, to=request.sid)

@socketio.on('connect')
def handle_connect():
    
    print('Client sid:',request.sid, ' connected!')
    server_pubkey = rsa_helper.return_public()
    socketio.emit('public_key',server_pubkey,to=request.sid)

@socketio.on('sign_up')
def authenticate(login_info):
    decrypted_dict = rsa_helper.decrypt_login(login_info)
    username = decrypted_dict['username']
    password = decrypted_dict['password']
    dict_sign_up_success = {0: -1}
    if authentication.sign_up(username,password):
        dict_sign_up_success[0] = 1
        print(username,' successfully signed up!')
        users.add_user(username)
        
        #TODO encrypt dict values
    socketio.emit('signup',dict_sign_up_success,to=request.sid)


#authenticates the user given username/password
@socketio.on('authenticate')
def authenticate(login_info):
    decrypted_dict = rsa_helper.decrypt_login(login_info)
    username = decrypted_dict['username']
    password = decrypted_dict['password']
    if username:
        dict_login_sucess = {0:-1}
        if users.check_limits(username, "login"):
            #calls the actual fucntion that authenticates 
            if authentication.pword_check(username,password):
                login_sucess = 1
                print(username,' successfully logged in!')
                user_names = users.retrieve_user_dict()   
                #TODO encrypt dict values                    
                socketio.emit('send_user_list', user_names)
                users.set_status(username, request.sid)                      #using class now
                dict_login_sucess = {0:login_sucess}
                #TODO encrypt dict values
            socketio.emit('login1',dict_login_sucess,to=request.sid)
        else:
            print("Please check your username or try again later.")
    else:
        print("No username provided!")


@socketio.on('message')
def handle_message(data):
    decrypt_dict = aes_helper.decrypt_aes(data,users.get_user(request.sid))
    #DECRYPTION AES
    username = decrypt_dict.get('user')
    receiver = decrypt_dict.get('receiver')
    
    if not users.check_limits(username, "msg"):
         dict_rate_error = {0:"Rate-limited! You need to slow down!",1:receiver}
         encrypted = aes_helper.encrypt_aes(dict_rate_error,username)
         #ENCRYPTION AES
         socketio.emit('response',encrypted , to=request.sid)
    else:

        message = decrypt_dict.get('message')    #sets message from dictionary
        if not(message==''):
            message1 = f"{username}: {message}" #formats message; changed for chat style conformity
            print(message1)
            
        if not users.check_status(receiver):
            error_msg = f"{receiver} is not online"
            dict_error_msg = {0:error_msg,1:receiver}
            encrypted = aes_helper.encrypt_aes(dict_error_msg,username)
            #ENCRYPTION AES
            socketio.emit('response', dict_error_msg, to=request.sid)

        else:
            users.store_chat(username,receiver,message)
            dict_message = {0:message1,1:username}
            encrypted = aes_helper.encrypt_aes(dict_message,receiver)
            #ENCRYPTION AES
            socketio.emit('response',encrypted , to =users.retrieve_sid(receiver))      #sends back the message as a single string
  

@socketio.on('chat_log')
def send_log(data):
    sender = data.get('sender')
    receiver = data.get('receiver')
    logs = users.get_chat_log(sender,receiver)
    for i in logs:
        i=aes_helper.encrypt_aes(i,sender)
    #ENCRYPTION AES
    socketio.emit('send_log',logs,to=request.sid)

@socketio.on('send_aes')
def receive_aes(data):
    key = rsa_helper.decrypt_aes(data)
    aes_helper.set_key(key,users.get_user(request.sid))

@socketio.on('disconnect')
def disconnect():
    users.disconnect(request.sid)

if __name__ == '__main__':
  cert = ('security/securechat.crt','security/seckey.key')
  socketio.run(app, debug=True, ssl_context=cert, host='0.0.0.0')
