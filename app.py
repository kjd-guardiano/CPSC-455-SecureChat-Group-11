from flask import Flask, render_template
from flask_socketio import SocketIO

app = Flask(__name__)
app.config['SECRET_KEY'] = 'dummy_secret_key'

socketio = SocketIO(app)

@app.route('/') 
def index():
    return render_template('index.html')

@socketio.on('connect')
def handle_connect():
  print('Client connected!')

@socketio.on('message')
def handle_message(data):
  message = data.get('message')    #sets message from dictionary
  userID = data.get('userID')       #sets userid from dictionary
  message1 = f"Message: '{message}'\nSent by User: {userID}" #formats message

  print(message1)
  socketio.emit('response', message1)      #sends back the message as a single string

if __name__ == '__main__':
  socketio.run(app, debug=True)
