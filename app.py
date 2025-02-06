from flask import Flask, render_template, request
from flask_socketio import SocketIO
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

import authentication

app = Flask(__name__)
app.config['SECRET_KEY'] = 'dummy_secret_key'

#rate limiting link access default settings
access_limiter = Limiter(get_remote_address,
                         app=app,
                         default_limits=['2000 per day', '2000 per hour'],
                         storage_uri="memory://")
# [TODO] add message limiting later (need to figure out order for message limiter var creation?)
#message_limiter = Limiter(handle_message,  # type: ignore
#                          app=app,
#                          default_limits=['500 per day', '50 per hour'],
#                          storage_uri="memory://")
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


@socketio.on('authenticate')
def authenticate(login_info):
    username = login_info.get('username')
    password = login_info.get('password')
    login_sucess = -1
    if authentication.pword_check(username,password):
        login_sucess = 1
        print(username,' successfully logged in!')
        clients[username] = (True,request.sid)
    socketio.emit('login1',login_sucess)


@socketio.on('message')
#@message_limiter.limit("10 per minute")
def handle_message(data):
    sessionID = request.sid
    confirm = 0
    person = ''
    for i in clients:
        if i[2] != sessionID:
            confirm = i[2]
    
    for i in clients:
        if i[2] == sessionID:
            person = i[0]
            
        

    message = data.get('message')    #sets message from dictionary
    userID = person     #sets userid from dictionary
    message1 = f"Message: '{message}'\nSent by User: {userID}" #formats message

    print(message1)
    socketio.emit('response', message1, to=confirm)      #sends back the message as a single string

if __name__ == '__main__':
  socketio.run(app, debug=True)
