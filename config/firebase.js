const { initializeApp } = require('firebase/app');
const { getDatabase } = require('firebase/database');

const firebaseConfig = {
  apiKey: 'AIzaSyCELI3ddmszKAOL1_X2uuwz4A3mJxO4NFg',
  authDomain: 'slayer-bot-pro-v2.firebaseapp.com',
  databaseURL: 'https://slayer-bot-pro-v2-default-rtdb.firebaseio.com',
  projectId: 'slayer-bot-pro-v2',
  storageBucket: 'slayer-bot-pro-v2.appspot.com',
  messagingSenderId: '432320404402',
  appId: '1:432320404402:web:63bda5bf449d732a22a2ab',
  measurementId: 'G-9RT2B4YGC4'
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

module.exports = { db };
