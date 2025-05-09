from Cryptodome.PublicKey import RSA
from Cryptodome.Cipher import PKCS1_v1_5
import base64

class rsa_help:

    def __init__(self):
        self.rsa_key = RSA.generate(2048)

    
    def return_public(self):
         return self.rsa_key.publickey().export_key().decode()
    
    def decrypt_login(self,login_info_dict):
        cipher = PKCS1_v1_5.new(self.rsa_key)
        for key in login_info_dict:

            bytes_ = base64.b64decode(login_info_dict[key])
            decrypted = cipher.decrypt(bytes_,None)
            login_info_dict[key] = decrypted.decode('utf-8')

        return login_info_dict
    
    def decrypt_aes(self,key):
        private_key = self.rsa_key
        decryptor = PKCS1_v1_5.new(private_key)
        

        encrypted_aes_key = base64.b64decode(key)

       
        decrypted_aes_key = decryptor.decrypt(encrypted_aes_key,None)
        return decrypted_aes_key
