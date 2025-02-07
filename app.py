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

app = Flask(__name__)
app.config['SECRET_KEY'] = 'dummy_secret_key'

#rate limiting link access default settings
access_limiter = Limiter(get_remote_address,
                         app=app,
                         default_limits=['200 per day', '20 per hour'],
                         storage_uri="memory://")

rate_limiter = SocketIO_Limiter(1/20, 20)
#socket setup
socketio = SocketIO(app)

clients = {
            'Billy':(False,0), #Username: (whether or not they are logged in, sid)
            'Sally':(False,0)
           }

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
        clients[username] = (True,request.sid)
    socketio.emit('login1',login_sucess,to=request.sid)


@socketio.on('message')
#@message_limiter.limit("10 per minute")
def handle_message(data):
    if(rate_limiter.allow_request()):
        sessionID = request.sid
        confirm = 0
        person = ''

        #really scuffed but sends to other user
        for username, client in clients.items():
            if client[1] != sessionID:
                confirm = client[1]
            if client[1] == sessionID:
                person = username
        
            

        message = data  
        userID = person     
        message1 = f"Message: '{message}'\nSent by User: {userID}" #formats message

        print(message1)
        socketio.emit('response', message1, to=confirm)      #sends back the message as a single string
    else:

        socketio.emit('response', "Rate-limited! You need to slow down!", to=request.sid)


@socketio.on('disconnect')
def disconnect():
    sid = request.sid
    for i in clients:
        if i[1] == sid:
            i[1] = 0
            i[0] = False

if __name__ == '__main__':
  socketio.run(app, debug=True)
