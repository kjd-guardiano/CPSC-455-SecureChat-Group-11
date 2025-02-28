import ratelimits

 
class client:

    def __init__(self, name):
        self.name = name
        self.online = False
        self.pid = 0
        self.limiter = ratelimits.SocketIO_Limiter(1/20, 20)

   
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
            print(self.clients_dict)

    def set_status(self,name,pid):
        self.clients_dict[name].set_pid(pid)

 
    def retrieve_sid(self,name):
        return self.clients_dict[name].pid


    def check_limits(self,name):
        if self.clients_dict[name].limiter.allow_request():
            return True
        return False


    def check_status(self,name):
        return self.clients_dict[name].online

    def retrieve_user_list(self):
        user_list = []
        for name in self.clients_dict:
            user_list.append(name)
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

    