import eventlet
eventlet.monkey_patch()
from flask import Flask, render_template, request, send_from_directory, current_app
from flask_socketio import SocketIO
from flask_limiter import Limiter
from ftplib import FTP
from flask_limiter.util import get_remote_address
from contextlib import asynccontextmanager
from ratelimits import *
from security import rsa_crypto,aes_crypto
from eventlet import wsgi
from dotenv import load_dotenv
import asyncio, math, time, authentication, clients, os, hashlib, requests, eventlet.wsgi, ssl

app = Flask(__name__)
app.config['SECRET_KEY'] = 'dummy_secret_key'

#rate limiting link access default settings
access_limiter = Limiter(get_remote_address,
                         app=app,
                         default_limits=['200 per day', '20 per hour'],
                         storage_uri="memory://")

load_dotenv()

#set-up for VirusTotal API
app.config['VT_API_KEY'] = os.getenv("VT_API_KEY")
app.config['VT_BASE_URL'] = os.getenv("VT_BASE_URL")

#Directory for file storage
upload_folder = './SecureChat_Upload'
#Directory check, creating new folder if the previously specified does not exist.
if not os.path.exists(upload_folder):
    os.makedirs(upload_folder)

#socket setup
socketio = SocketIO(app, ping_interval=20, ping_timeout=60, logger=True, engineio_logger=True,async_mode='eventlet')

users = clients.clients()   #class that stores info on all clients
rsa_helper = rsa_crypto.rsa_help()
aes_helper = aes_crypto.aes_help()

#for scanning via VirusTotal
def virus_scan(file_bytes):
    # NOTE: VirusTotal's free plan only accepts file sizes up to 32 MB.
    if len(file_bytes) > 32 * 1024 * 1024:
        socketio.emit('scan_status', {
            'filename': file_bytes['filename'],
            'status': 'too_large',
            'message': 'File exceeds maximum size.'
        }, to=request.sid)
        return

    api_key = current_app.config['VT_API_KEY']
    # setup for upload
    file = {'file': ('file.bin', file_bytes)}
    hash = hashlib.sha256(file_bytes).hexdigest()
    url = f"https://www.virustotal.com/api/v3/files/{hash}"
    headers = {"x-apikey" : api_key}

    # check hash if already scanned first, return results
    response = requests.get(url, headers=headers)

    # if hash is successful, return hashed report results
    if response.status_code == 200:
        vt_data = response.json()
        stats = vt_data["data"]["attributes"]["last_analysis_stats"]
        mal = stats.get("malicious", 0)
        sus = stats.get("suspicious", 0)
        return mal, sus

    # continues if hash is unsuccessful, moves onto scanning
    response = requests.post("https://www.virustotal.com/api/v3/files", files=file, headers=headers)

    if response.status_code != 200:
        return None, None, "Failed to upload."
    
    # start of polling for report return
    analysis_id = response.json()["data"]["id"]
    analysis_url = f"https://www.virustotal.com/api/v3/analyses/{analysis_id}"
    for _ in range(10):
        time.sleep(3)
        result_response = requests.get(analysis_url, headers=headers)
        if result_response.status_code == 200:
            result_data = result_response.json()
            status = result_data["data"]["attributes"]["status"]
            if status == "completed":
                stats = result_data["data"]["attributes"]["stats"]
                mal = stats.get("malicious", 0)
                sus = stats.get("suspicious", 0)
                return mal, sus, None
        else:
            # in event of error, exit loop
            break

    return None, None, "Request timed out."

@app.route('/') 
def index():
    
    return render_template('index.html')

#event for file uploading
@socketio.on('upload_file')
def handle_upload(data):
    file_name = data['filename']
    file_data = data['file_data']
    receiver = data['receiver']
    decrypted_file = aes_helper.decrypt_file(file_data,users.get_user(request.sid))
    

    # Save the file to the server's file system
    file_path = os.path.join(upload_folder, file_name)
    
    # Open the file and write the binary data to it
    try:
        with open(file_path, 'wb') as f:
            f.write(decrypted_file)

      
        # Emit the file information to the receiving client (file name)
        socketio.emit('file_received', {'filename': file_name},to=request.sid)
        if users.check_status(receiver):
            socketio.emit('file_received', {'filename': file_name},to=users.retrieve_sid(receiver))
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
        with open(file_path, 'rb') as f:
            file_data = f.read() 

            # checking file hash for possible suspicious activity
            mal, sus = virus_scan(file_data)
            # if not prev found on VT (mal and sus return None)
            if mal is None and sus is None:
                mal, sus, error = virus_scan(file_data)
                if error:
                    socketio.emit('scan_status', {
                        'filename': file_name,
                        'status': 'scan_failed',
                        'message': error
                    }, to=request.sid)
                    return
            # some hits found
            if mal > 0 or sus > 0:
                socketio.emit('scan_status', {
                    'filename': file_name,
                    'status': 'unsafe',
                    'malicious': mal,
                    'suspicious': sus,
                    'message': 'Download blocked: Potential malware detected'
                }, to=request.sid)
                return

            # found clean by VT
            encrypted_file = aes_helper.encrypt_file(file_data,users.get_user(request.sid))
           
        # Send the file download event back to the requesting client
            socketio.emit('file_download', {'filename': file_name,'file_data': encrypted_file}, to=request.sid)
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
                socketio.emit('online_check',{'online': True,'receiver': username})
    socketio.emit('login1',dict_login_sucess,to=request.sid)


@socketio.on('message')
def handle_message(data):
    decrypted = aes_helper.decrypt_aes(data,users.get_user(request.sid))
    username = decrypted.get('user')
    receiver = decrypted.get('receiver')
    message = decrypted.get('message')

    #message sent if ratelimits are applied
    if not users.check_limits(username, "msg"):
        rate_limit_msg = {0: "error",1: receiver,2: "Rate-limited! You need to slow down!"}
        encrypted_rate_limit = aes_helper.encrypt_aes(rate_limit_msg,username)
        socketio.emit('response', encrypted_rate_limit, to=request.sid)
        return

    #stores chat if no ratelimits are applied
    users.store_chat(username, receiver, message)

    #message sent if reciever is offline(still stores chat)
    if not users.check_status(receiver):
        offline_msg = {0: "error",1: receiver,2: f"{receiver} is not online"}
        encrypted_offline_msg = aes_helper.encrypt_aes(offline_msg,username)
        socketio.emit('response', encrypted_offline_msg, to=request.sid)
        return

    #message sent if reciever is online
    outgoing_msg = {0: "encrypted",1: username,2: message}
    encrypted_outgoing_msg = aes_helper.encrypt_aes(outgoing_msg,receiver)
    socketio.emit('response', encrypted_outgoing_msg, to=users.retrieve_sid(receiver))
  



@socketio.on('chat_log')
def send_log(data):
    sender = data.get('sender')
    receiver = data.get('receiver')
    logs = users.get_chat_log(sender,receiver)
    socketio.emit('send_log',logs,to=request.sid)

@socketio.on('send_aes')
def receive_aes(data):
    key = rsa_helper.decrypt_aes(data)
    aes_helper.set_key(key,users.get_user(request.sid))


@socketio.on('is-online')
def is_online(data):
    receiver = data.get('receiver')
    is_online = users.check_status(data.get('receiver'))
    print('user is online', is_online)
    
    socketio.emit('online_check',{'online': is_online,'receiver': receiver},to=request.sid)

@socketio.on('disconnect')
def disconnect():
    disconnecter = users.get_user(request.sid)
    
    socketio.emit('online_check',{'online': False,'receiver': disconnecter})
    users.disconnect(request.sid)

# changed for new upload method, old version below kept for posterity
# Render (hosting site) manages HTTPS/SSL automatically, below will conflict otherwise
if __name__ == '__main__':
#    socketio.run(app, host='0.0.0.0', port=5000)
  cert = 'security/securechat.crt'
  key = 'security/seckey.key'
  
  # wrapping for ssl
  listener = eventlet.listen(('0.0.0.0', 5000))
  ssl_listener = eventlet.wrap_ssl(listener, certfile = cert, keyfile = key, server_side=True)

  wsgi.server(ssl_listener, app)
