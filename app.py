from flask import FLask, render_template
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
  print('Received message: ', data)
  socketio.emit('response', 'Server received your message: ' + data)

if __name__ == '__main__':
  socketio.run(app, debug=True)
