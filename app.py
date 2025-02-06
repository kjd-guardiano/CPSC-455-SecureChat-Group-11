from flask import Flask, render_template, request
from flask_socketio import SocketIO
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import asyncio
import math
import time
from contextlib import asynccontextmanager
from limits import *

app = Flask(__name__)
app.config['SECRET_KEY'] = 'dummy_secret_key'

#rate limiting link access default settings
#access_limiter = Limiter(get_remote_address,
#                         app=app,
#                         default_limits=['200 per day', '20 per hour'],
#                         storage_uri="memory://")
# [TODO] add message limiting later (need to figure out order for message limiter var creation?)
#bucket-based rate limiter (For SocketIO functions)
class SocketIO_Limiter:
    def __init__(self, rate, capacity) -> None:
        self.capacity = capacity
        self.tokens = capacity
        self.rate = rate
        self.last_check = time.time()

    #func for limiting, takes 1 token
    def allow_request(self, amount=1):
        current_time = time.time()
        passed_time = current_time - self.last_check
        self.last_check = current_time #updates time checked

        self.tokens += passed_time * self.rate
        if self.tokens > self.capacity:
            self.tokens = self.capacity

        if self.tokens >= amount:
            self.tokens -= amount
            print("All good!")
            return True
        else:
            print("Rate limiting enabled!")
            return False

rate_limiter = SocketIO_Limiter(1/20, 20)
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
    if(rate_limiter.allow_request()):
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
    else:
        socketio.emit('response', "Rate-limited! Sender needs to slow down!")

if __name__ == '__main__':
  socketio.run(app, debug=True)
