from flask import Flask, render_template, request
from flask_socketio import SocketIO
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import asyncio
import math
import time
from contextlib import asynccontextmanager
from ratelimits import *
import authentication
import clients
from security import rsa_crypto

app = Flask(__name__)
app.config['SECRET_KEY'] = 'dummy_secret_key'

#rate limiting link access default settings
access_limiter = Limiter(get_remote_address,
                         app=app,
                         default_limits=['200 per day', '20 per hour'],
                         storage_uri="memory://")


#socket setup
socketio = SocketIO(app, ping_interval=20, ping_timeout=60, logger=True, engineio_logger=True)

users = clients.clients()   #class that stores info on all clients
rsa_helper = rsa_crypto.rsa_help()

@app.route('/') 
def index():
    
    return render_template('index.html')

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
    username = data.get('user')
    receiver = data.get('receiver')
    
    if not users.check_limits(username, "msg"):
         dict_rate_error = {0:"Rate-limited! You need to slow down!",1:receiver}
         #TODO encrypt dict values
         socketio.emit('response',dict_rate_error , to=request.sid)
    else:

        message = data.get('message')    #sets message from dictionary
        if not(message==''):
            message1 = f"{username}: {message}" #formats message; changed for chat style conformity
            print(message1)
            
        if not users.check_status(receiver):
            error_msg = f"{receiver} is not online"
            dict_error_msg = {0:error_msg,1:receiver}
            #TODO encrypt dict values
            socketio.emit('response', dict_error_msg, to=request.sid)

        else:
            users.store_chat(username,receiver,message)
            dict_message = {0:message1,1:username}
            #TODO encrypt dict values
            socketio.emit('response',dict_message , to =users.retrieve_sid(receiver))      #sends back the message as a single string
  

       


@socketio.on('disconnect')
def disconnect():
    users.disconnect(request.sid)

if __name__ == '__main__':
  cert = ('security/securechat.crt','security/seckey.key')
  socketio.run(app, debug=True, ssl_context=cert, host='0.0.0.0')
