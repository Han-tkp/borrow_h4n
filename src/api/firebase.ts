import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/storage';

// TODO: Add your Firebase project configuration here
export const firebaseConfig = {
    apiKey: "AIzaSyBNYPJQRfg3zcrhwzg05gUul9-xFLphCkw",
    authDomain: "borrowgmni.firebaseapp.com",
    projectId: "borrowgmni",
    storageBucket: "borrowgmni.firebasestorage.app",
    messagingSenderId: "724759892595",
    appId: "1:724759892595:web:5974a89b9985a55d431006",
    measurementId: "G-QSVE1X2M3B"
};

// Initialize Firebase
if (firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();
export const db = firebase.firestore();
export const storage = firebase.storage();

