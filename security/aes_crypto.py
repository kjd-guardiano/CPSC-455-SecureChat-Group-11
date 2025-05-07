from Cryptodome.Cipher import AES
from Cryptodome.Util.Padding import pad, unpad
from Cryptodome.Random import get_random_bytes
import base64
import os

class aes_help:
    def __init__(self):
        
        self.users_key = {}
        pass

    def set_key(self,key,user):
        aes_key = base64.b64decode(key)
        self.aes_key= aes_key
        self.users_key[user] = aes_key
        
    def encrypt_aes(self,msg_dict,name):
        print('Encrypting: ',msg_dict)
        user_key = self.users_key[name]
        for key in msg_dict:
        
            cipher = AES.new(user_key, AES.MODE_ECB)
            padded_msg = pad(msg_dict[key].encode('utf-8'), AES.block_size)
            encrypted_msg = cipher.encrypt(padded_msg)
            encrypted_msg_base64 = base64.b64encode(encrypted_msg).decode('utf-8')
            msg_dict[key] = encrypted_msg_base64
        return msg_dict

    
    def decrypt_aes(self, msg_dict, name):
        print('Decrypting: ',msg_dict)
        user_key = self.users_key[name]
        for key in msg_dict:
            encrypted_msg = base64.b64decode(msg_dict[key])
            cipher = AES.new(user_key, AES.MODE_ECB)
            decrypted_msg = unpad(cipher.decrypt(encrypted_msg), AES.block_size)
            msg_dict[key] = decrypted_msg.decode('utf-8')
        
        return msg_dict
        
    def encrypt_file(self, file_data, name):
        # Decode the base64-encoded AES key
        aes_key = self.users_key[name]
        
        # Set up the AES cipher in ECB mode (no IV needed)
        cipher = AES.new(aes_key, AES.MODE_ECB)
        
        # Pad the file data to make it a multiple of AES.block_size
        padded_data = pad(file_data, AES.block_size)
        
        # Encrypt the data
        encrypted_data = cipher.encrypt(padded_data)
        
        # Base64 encode the encrypted data to make it ready for transmission
        encrypted_file_b64 = base64.b64encode(encrypted_data).decode('utf-8')
        
        return encrypted_file_b64
    
    def decrypt_file(self, encrypted_file_b64, name):
        # Decode the base64-encoded encrypted file data
        encrypted_data_bytes = base64.b64decode(encrypted_file_b64)
        
        # Decode the AES key (ensure it matches the encoding method)
        aes_key = self.users_key[name]  # assuming this is the correct AES key
        
        # Create a new AES cipher object using ECB mode
        cipher = AES.new(aes_key, AES.MODE_ECB)
        
        # Decrypt the data and remove padding
        decrypted_data = unpad(cipher.decrypt(encrypted_data_bytes), AES.block_size)
        
        return decrypted_data
    



    