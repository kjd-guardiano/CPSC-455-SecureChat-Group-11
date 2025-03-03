import bcrypt
import pwinput
import os




def sign_up(username_,password_):
    user = username_
    password = password_
    password = password.encode(encoding='utf-8')

    salt = bcrypt.gensalt()

    hash = bcrypt.hashpw(password, salt)


    with open('db.txt','r') as file:
        taken = False
        for text in file:
            parts = text.split()
            if user == parts[0]:
                print("Username already taken")
                return False
                    

    hash = hash.decode()
    txt_output = f"{user} {hash}"
    with open('db.txt','a') as file:
        if os.path.getsize('db.txt') == 0:
            file.write(txt_output)
        else:
            file.write('\n'+txt_output)
    print("Your account was successfully created!")
    return True







def pword_check(username_,password_):
    if not os.path.exists("db.txt"):
        with open("db.txt","w") as file:
            pass
        
    username = username_
    password = password_
    print(username,password_)
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