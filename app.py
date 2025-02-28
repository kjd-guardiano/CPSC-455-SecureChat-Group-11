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

app = Flask(__name__)
app.config['SECRET_KEY'] = 'dummy_secret_key'

#rate limiting link access default settings
access_limiter = Limiter(get_remote_address,
                         app=app,
                         default_limits=['200 per day', '20 per hour'],
                         storage_uri="memory://")


#socket setup
socketio = SocketIO(app)

users = clients.clients()   #class that stores info on all clients

@app.route('/') 
@access_limiter.limit("10 per hour")
def index():
    return render_template('index.html')

@socketio.on('connect')
def handle_connect():
    print('Client sid:',request.sid, ' connected!')

#authenticates the user given username/password
@socketio.on('authenticate')
def authenticate(login_info):
    username = login_info.get('username')
    password = login_info.get('password')
    login_sucess = -1
    #calls the actual fucntion that authenticates 
    if authentication.pword_check(username,password):
        login_sucess = 1
        print(username,' successfully logged in!')
        users.set_status(username, request.sid)                      #using class now
    socketio.emit('login1',login_sucess,to=request.sid)


@socketio.on('message')
#@message_limiter.limit("10 per minute")
def handle_message(data):
    username = data.get('user')
    receiver = data.get('receiver')
    
    if not users.check_limits(username):
         socketio.emit('response', "Rate-limited! You need to slow down!", to=request.sid)
    else:

        message = data.get('message')    #sets message from dictionary
        message1 = f"Message: '{message}'\nSent by User: {username}" #formats message

        print(message1)

        if not users.check_status(receiver):
            error_msg = f"{receiver} is not online"
            socketio.emit('response', error_msg, to=request.sid)

        else:
            socketio.emit('response', message1, to =users.retrieve_sid(receiver))      #sends back the message as a single string
  

       


@socketio.on('disconnect')
def disconnect():
    users.disconnect(request.sid)

if __name__ == '__main__':
  cert = ('security/securechat.crt','security/seckey.key')
  socketio.run(app, debug=True, ssl_context=cert)
