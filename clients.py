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


    def disconnect(self):
        self.online = False

 
    #def get_conversations()

 

class clients:
    def __init__(self):
        self.clients_dict = {'Billy': client('Billy'),
                        'Sally': client('Sally')}


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
       