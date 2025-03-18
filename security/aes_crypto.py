from Cryptodome.Cipher import AES
from Cryptodome.Util.Padding import pad, unpad
from Cryptodome.Random import get_random_bytes
import base64
import io

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
    
    def encrypt_file(self,file,name):
        plaintext = file.read()
        cipher = AES.new(self.users_key[name], AES.MODE_CBC)

        # Pad plaintext to be a multiple of 16 bytes
        ciphertext = cipher.encrypt(pad(plaintext, AES.block_size))

        # Store the IV and the ciphertext in a memory buffer (simulating a file)
        encrypted_data = io.BytesIO()
        encrypted_data.write(cipher.iv)  # Write the IV first
        encrypted_data.write(ciphertext)  # Then the encrypted content
        
        # Move back to the beginning of the "file" in memory for reading
        encrypted_data.seek(0)
        
        return encrypted_data