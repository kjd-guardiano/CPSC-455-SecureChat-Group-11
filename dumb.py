
import re

def sanitize_message(text):
    # Removes HTML-like tags and individual dangerous characters

     return re.sub(r'[<>/"\'&]', '', text)
    


text = 'zombie<'

print(sanitize_message(text))