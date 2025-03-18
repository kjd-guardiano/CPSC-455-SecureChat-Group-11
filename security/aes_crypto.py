from Cryptodome.Cipher import AES
from Cryptodome.Util.Padding import pad, unpad
from Cryptodome.Random import get_random_bytes
import base64

class aes_help:
    def __init__(self):
        self.aes_key = ''
        self.users_key = {}
        pass

    def set_key(self,key,user):
        aes_key = base64.b64decode(key)
        self.aes_key= aes_key
        self.users_key[user] = aes_key
        print('key:            ', key)

    
    def encrypt_aes(self,msg_dict,name):
        user_key = self.users_key[name]
        for key in msg_dict:
        
            cipher = AES.new(user_key, AES.MODE_ECB)
            padded_msg = pad(msg_dict[key].encode('utf-8'), AES.block_size)
            encrypted_msg = cipher.encrypt(padded_msg)
            encrypted_msg_base64 = base64.b64encode(encrypted_msg).decode('utf-8')
            msg_dict[key] = encrypted_msg_base64
        return msg_dict

            