/* global gapi */

import {
  getUserProfile as getFirestoreUserProfile,
  getUserProfileByEmail as getFirestoreUserProfileByEmail,
  saveProfile as saveFirestoreProfile,
  watchProfile as watchFirestoreProfile,
} from '../firestore/UsersClient'
import {
  uploadFile as uploadFirebaseFile,
  deleteFile as deleteFirebaseFile,
} from '../firestore/FilesClient'
import { config } from '../resources/config'
import { firebaseConfig } from '../resources/config'

//Login

export function initialiseGAPI() {
  const script = document.createElement("script");
  script.src = "https://apis.google.com/js/api.js";
  document.body.appendChild(script);

  script.onload = () => {
    window.gapi.load('client:auth2', () => {
      gapi.client.init({
        apiKey: firebaseConfig.apiKey,
        clientId: firebaseConfig.clientId,
        discoveryDocs: firebaseConfig.discoveryDocs,
        scope: firebaseConfig.scopes.join(' '),
      })
     })
   }
}

export function signIn(firebase, successCallback, errorCallback) {
  window.gapi.auth2.getAuthInstance().signIn().then((e) => {
    var idToken = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
    var creds = firebase.auth.GoogleAuthProvider.credential(idToken);

    firebase.login({
      credential: creds
    })
    .then((result) => successCallback(result))
    .catch((error) => errorCallback(error))
  })
}

export function signOut(firebase, callback) {
  var auth = gapi.auth2.getAuthInstance()

  firebase.logout().then(() => {
  	auth.signOut().then(() => {
  		callback()
  	})
  })
}

//Update

export function saveProfile(firestore, firebase, profile, callback = () => {}) {
  watchFirestoreProfile(firestore, profile, 'myProfile')
  if(profile.avatarUrl !== profile.original.avatarUrl) {
    if(profile.original.avatarUrl && !profile.original.avatarUrl.startsWith("http")) {
      deleteFirebaseFile(firebase, profile.original.avatarUrl, () => {})
    }

    if(profile.avatarUrl) {
      uploadAvatar(firebase, profile.avatarUrl, (filePath) => {
        profile = {
          ...profile,
          avatarUrl: filePath,
        }

        saveFirestoreProfile(firestore, profile, callback)
      })
    } else {
      saveFirestoreProfile(firestore, profile, callback)
    }
  } else {
    saveFirestoreProfile(firestore, profile, callback)
  }
}

//Read

export function getMyProfile(firestore, auth, callback) {
  getFirestoreUserProfile(firestore, auth.uid, callback, 'myProfile')
}

export function getUserProfile(firestore, userID, callback) {
  getFirestoreUserProfile(firestore, userID, callback)
}

export function getUserByEmail(firestore, email, callback) {
  getFirestoreUserProfileByEmail(firestore, email, callback)
}

//Utility

export function uploadAvatar(firebase, avatar, callback) {
  uploadFirebaseFile(firebase, config.avatarFilePath, avatar, callback)
}