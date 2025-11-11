import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// TODO: Add your Firebase project configuration here
export const firebaseConfig = {
    apiKey: "AIzaSyBNYPJQRfg3zcrhwzg05gUul9-xFLphCkw",
    authDomain: "borrowgmni.firebaseapp.com",
    projectId: "borrowgmni",
    storageBucket: "borrowgmni.appspot.com",
    messagingSenderId: "724759892595",
    appId: "1:724759892595:web:5974a89b9985a55d431006",
    measurementId: "G-QSVE1X2M3B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export { app }; // Export the app instance

