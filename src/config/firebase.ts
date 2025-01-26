import firebase from '@react-native-firebase/app';
import '@react-native-firebase/firestore';
import { FIREBASE_CONFIG } from './env';

// Initialize Firebase if it hasn't been initialized yet
if (!firebase.apps.length) {
  firebase.initializeApp(FIREBASE_CONFIG);
}

export const firestore = firebase.firestore();
export const emisCollection = firestore.collection('emis');
