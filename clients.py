import ratelimits
import json
import os
 
class client:

    def __init__(self, name):
        self.name = name
        self.online = False
        self.pid = 0
        self.msg_limiter = ratelimits.Token_Limiter(1/20, 20)
        self.login_limiter = ratelimits.Token_Limiter(1/60, 5)

   
    def set_pid(self, pid):
        self.pid = pid
        self.online = True
 
    #def get_conversations()

 

class clients:
    def __init__(self):
        self.clients_dict = {}

        with open('db.txt', 'r') as file:
            for line in file:
                # Split the line into username and hash (we only care about the username)
                username, _ = line.strip().split(' ', 1)
                # Create a client instance for each username and store it in the dictionary
                self.clients_dict[username] = client(username)
            

    def set_status(self,name,pid):
        self.clients_dict[name].set_pid(pid)

 
    def retrieve_sid(self,name):
        return self.clients_dict[name].pid


    def check_limits(self,name,type):
        client = self.clients_dict.get(name)
        if client:
            if type == "msg":
                return client.msg_limiter.allow_request()
            if type == "login":
                return client.login_limiter.allow_request()
        return False

    def get_user(self, sid):
        # Iterate over all clients and check for the matching pid (sid)
        for username, client in self.clients_dict.items():
            if client.pid == sid:
                return username
        return None  # If no user is found with that pid
        
    def check_status(self,name):
        return self.clients_dict[name].online

    def retrieve_user_dict(self):
        i = 0
        user_list = {}
        for name in self.clients_dict:
            user_list[i] = name
            i +=1
        print(user_list)
        
        return user_list
    
    def add_user(self,name):
        self.clients_dict[name] = client(name)
    
    def disconnect(self, pid):
        for user in self.clients_dict:
            if self.clients_dict[user].pid == pid:
                print(user, ' disconnected')
                self.clients_dict[user].online = False
                self.clients_dict[user].pid = 0

    def store_chat(self, sender, receiver, message):
        # Create a unique file name for each conversation
        folder_name = "chat_logs"
        if not os.path.exists(folder_name):  # Check if the folder exists
            os.makedirs(folder_name)  # Create the folder if it doesn't exist
        
        # Define the path with the folder
        file_name = os.path.join(folder_name, "_".join(sorted([sender, receiver])) + "_chat_log.json")

        # Prepare the chat log entry
        log_entry = {
            0: sender,
            1: receiver,
            2: message,
        }

        # Read existing log or create a new one
        try:
            with open(file_name, "r") as file:
                chat_logs = json.load(file)
        except FileNotFoundError:
            chat_logs = []

        # Append the new message to the log
        chat_logs.append(log_entry)

        # Save the updated chat log back to the JSON file
        with open(file_name, "w") as file:
            json.dump(chat_logs, file, indent=4)

    def get_chat_log(self, sender, receiver):
        folder_name = "chat_logs"
        file_name = os.path.join(folder_name, "_".join(sorted([sender, receiver])) + "_chat_log.json")
        # Check if the file exists
        if not os.path.exists(file_name):
            return []  # Return an empty list if the file doesn't exist
        
        # Open and read the JSON file
        with open(file_name, 'r') as file:
            chat_log = json.load(file)  # Parse the JSON content into a Python object (list, dict, etc.)
        
        return chat_log
