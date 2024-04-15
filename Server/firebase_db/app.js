// Import the functions you need from the SDKs you need
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get, getChildren } = require('firebase/database');

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAlJ1gEXCOAIEN2Q1w69sKnzuxeUvpYge4",
  authDomain: "project-banluck.firebaseapp.com",
  databaseURL: "https://project-banluck-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "project-banluck",
  storageBucket: "project-banluck.appspot.com",
  messagingSenderId: "871217754770",
  appId: "1:871217754770:web:d2ea6d51e97e7c3bb72c4b",
  measurementId: "G-96W3YXLBNY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase();

const rootRef = ref(db);

// !!!!!!!
// Still learning this fked up shit
// !!!!!!!



// Get all data from database
function fetchAllData(nodeRef) {
  get(nodeRef).then((snapshot) => {
    if (snapshot.exists()) {
      console.log('Data at ' + snapshot.ref.toString() + ':', snapshot.val());
    } else {
      console.log('No data available at ' + snapshot.ref.toString());
    }

  }).catch((error) => {
    console.error("Error reading data:", error);
  });
}

// Call the function to fetch data from the root node
fetchAllData(ref(db));