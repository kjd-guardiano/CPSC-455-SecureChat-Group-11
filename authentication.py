import bcrypt
import pwinput
import os

def pword_check(username_,password_):
    if not os.path.exists("db.txt"):
        with open("db.txt","w") as file:
            pass
        
    username = username_
    password = password_
    
    valid_login = False
    with open('db.txt','r') as file:
        for text in file:
            parts = text.split()
            if username == parts[0]:
                stored_pass = parts[1]
                stored_pass = stored_pass.encode(encoding='utf-8')
                password = password.encode(encoding='utf-8')
                if bcrypt.checkpw(password, stored_pass):
                    valid_login = True
                    
    if valid_login:
        return True
        
    else:
        return False