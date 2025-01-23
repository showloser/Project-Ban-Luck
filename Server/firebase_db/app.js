// Import the functions you need from the SDKs you need
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get, child, set, update, remove, push } = require('firebase/database');

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



function update_data_in_session(db, data){
  push(ref(db, '/project-bunluck/sessions/' + data.session_id), {
    userid : data.userid,
    username : data.username,
    current_hand : data.current_hand,
    value : data.value,
    end_turn : data.end_turn
  })

}

function get_all_data(db){
  get(child(ref(db) , '/project-banluck' )).then((snapshot) => {
    if (snapshot.exists()){
      console.log(snapshot.val())
    }
    else{
      console.log('No Data Available')
    }
  }).catch((error) => {
    console.log(error)
  }) 
}

function delete_all_data_in_session(db, session_id){

  const sessionRef =  ref(db, '/project-bunluck/sessions/' + session_id);

  remove(sessionRef)
    .then(() => {
      console.log(`All data for session ${session_id} deleted successfully.`);
    })
    .catch((error) => {
      console.error(`Error deleting data for session ${session_id}:`, error);
    });

}


function get_data_from_session_userid(db, session_id, player_userid){

  const db_ref = ref(db, `/project-bunluck/sessions/${session_id}`)

  get(db_ref).then((snapshot) => {
    if (snapshot.exists()){
      snapshot.forEach((childNode) => {

        if (childNode.key == player_userid){
          result = childNode.val()
          console.log(result)
        }
      })
    }
    else{
      console.log('SERVER_ERROR_404: Session does not exist')
    }
  }).catch((error) => {
    console.log('Error retrieving data: ' + error.message)
  })
}




//  export functions
module.exports = {
  update_data_in_session,
  get_all_data,
  delete_all_data_in_session,
  get_data_from_session_userid
}