from flask import Flask, render_template, request
from flask_socketio import SocketIO

app = Flask(__name__)
app.config['SECRET_KEY'] = 'dummy_secret_key'

socketio = SocketIO(app)

clients = []

@app.route('/') 
def index():
    return render_template('index.html')

@socketio.on('connect')
def handle_connect():
    sessionID = request.sid
    clients.append(sessionID)
    print('Client connected!')

@socketio.on('message')
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
