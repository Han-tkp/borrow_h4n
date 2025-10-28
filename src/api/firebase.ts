import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

// TODO: Add your Firebase project configuration here
const firebaseConfig = {
    apiKey: "AIzaSyBNYPJQRfg3zcrhwzg05gUul9-xFLphCkw",
    authDomain: "borrowgmni.firebaseapp.com",
    projectId: "borrowgmni",
    storageBucket: "borrowgmni.appspot.com",
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

export const setupRecaptcha = (containerId: string) => {
    // Ensure reCAPTCHA is only rendered once
    if (!(window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier = new firebase.auth.RecaptchaVerifier(containerId, {
            'size': 'invisible',
            'callback': (response: any) => {
                console.log("reCAPTCHA solved, ready to send OTP.");
            }
        });
    }
};

export const signInWithPhoneNumber = (phoneNumber: string) => {
    const appVerifier = (window as any).recaptchaVerifier;
    return auth.signInWithPhoneNumber(phoneNumber, appVerifier);
};
