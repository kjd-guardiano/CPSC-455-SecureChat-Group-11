from flask import Flask, render_template, request
from flask_socketio import SocketIO
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

app = Flask(__name__)
app.config['SECRET_KEY'] = 'dummy_secret_key'

#rate limiting link access default settings
access_limiter = Limiter(get_remote_address,
                         app=app,
                         default_limits=['200 per day', '20 per hour'],
                         storage_uri="memory://")
# [TODO] add message limiting later (need to figure out order for message limiter var creation?)
#message_limiter = Limiter(handle_message,  # type: ignore
#                          app=app,
#                          default_limits=['500 per day', '50 per hour'],
#                          storage_uri="memory://")
#socket setup
socketio = SocketIO(app)

clients = []

@app.route('/') 
@access_limiter.limit("10 per hour")
def index():
    return render_template('index.html')

@socketio.on('connect')
def handle_connect():
    sessionID = request.sid
    clients.append(sessionID)
    print('Client connected!')

@socketio.on('message')
#@message_limiter.limit("10 per minute")
def handle_message(data):
    sessionID = request.sid
    c1 = clients[0]
    c2 = clients[1]

    confirm = 0
    if sessionID == c1:
        confirm = c2
    else:
        confirm = c1

    message = data.get('message')    #sets message from dictionary
    userID = data.get('userID')       #sets userid from dictionary
    message1 = f"Message: '{message}'\nSent by User: {userID}" #formats message

    print(message1)
    socketio.emit('response', message1, to=confirm)      #sends back the message as a single string

if __name__ == '__main__':
  socketio.run(app, debug=True)
