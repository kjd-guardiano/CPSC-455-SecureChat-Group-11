// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBGkY3B3lhd2wnJ8XDIpIEh8V4uNUVkkIs",
  authDomain: "chat-15b0f.firebaseapp.com",
  projectId: "chat-15b0f",
  storageBucket: "chat-15b0f.firebasestorage.app",
  messagingSenderId: "968057655674",
  appId: "1:968057655674:web:3e74dc4161f2f92aaa46c3"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();




async function storeEncryptedDHKey(name, password) {
  const enc = new TextEncoder();

  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" }, true, ["deriveKey", "deriveBits"]
  );

  const publicKey = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
  const privateKey = JSON.stringify(await crypto.subtle.exportKey("jwk", keyPair.privateKey));

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const baseKey = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  const aesKey = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt"]
  );

  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, enc.encode(privateKey));

  await firebase.firestore().collection("keys").doc(name).set({
    publicKey,
    encryptedPrivateKey: Array.from(new Uint8Array(encrypted)),
    salt: Array.from(salt),
    iv: Array.from(iv)
  });

  console.log(`✅ Stored keys for ${name}`);
}



async function getPublicKey(username) {
  const doc = await firebase.firestore().collection("keys").doc(username).get();

  if (!doc.exists) {
    throw new Error(`No public key found for user: ${username}`);
  }

  const data = doc.data();
  return data.publicKey;
}

async function getDecryptedPrivateKey(name, password) {
  const doc = await firebase.firestore().collection("keys").doc(name).get();
  if (!doc.exists) throw new Error("User not found");

  const { encryptedPrivateKey, salt, iv } = doc.data();

  const pwBytes = new TextEncoder().encode(password);
  const saltBytes = new Uint8Array(salt);
  const ivBytes = new Uint8Array(iv);
  const encPrivKey = new Uint8Array(encryptedPrivateKey);

  const baseKey = await crypto.subtle.importKey("raw", pwBytes, "PBKDF2", false, ["deriveKey"]);
  const aesKey = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: saltBytes, iterations: 100000, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: ivBytes }, aesKey, encPrivKey);
  const jwk = JSON.parse(new TextDecoder().decode(decrypted));

  return crypto.subtle.importKey("jwk", jwk, { name: "ECDH", namedCurve: "P-256" }, true, ["deriveKey", "deriveBits"]);
}


async function deriveSharedAESKey(nameA, password, nameB) {
  const db = firebase.firestore();

  const docB = await db.collection("keys").doc(nameB).get();
  if (!docB.exists) {
    throw new Error(`User '${nameB}' does not exist in Firestore.`);
  }

  const publicKeyJwk = docB.data().publicKey;

  const publicKey = await crypto.subtle.importKey(
    "jwk",
    publicKeyJwk,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    []
  );

  const privateKey = await getDecryptedPrivateKey(nameA, password);

  const sharedKey = await crypto.subtle.deriveKey(
    {
      name: "ECDH",
      public: publicKey
    },
    privateKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  // Convert the CryptoKey to raw bytes
  const rawKey = await crypto.subtle.exportKey("raw", sharedKey);

  // Convert to CryptoJS WordArray
  const wordArrayKey = CryptoJS.lib.WordArray.create(new Uint8Array(rawKey));

  return wordArrayKey;
}

//'jacob',1234
//'johhn',1211134




x = deriveSharedAESKey('billy', 123, 'jacob')
y = deriveSharedAESKey('jacob', 1234, 'billy')
  console.log(x)

en = encrypt_aes({x:'hisasasasaiiii'})
console.log(en)
de = decrypt_aes(en)
console.log(de)