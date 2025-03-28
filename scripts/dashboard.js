import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
  if (window.netlifyIdentity) {
    netlifyIdentity.on('init', user => {
      if (!user) {
        console.log("No user detected, redirecting to login...");
        window.location.href = 'index.html';
      } else {
        console.log("User is logged in:", user.id);
        // Initialize Firebase using your actual keys
        const firebaseConfig = {
          apiKey: "AIzaSyBKN6-wxkU5kvbvpgl2Lr8XsGjUGRI6l-8",
          authDomain: "library-project-bcc87.firebaseapp.com",
          projectId: "library-project-bcc87",
          storageBucket: "library-project-bcc87.firebasestorage.app",
          messagingSenderId: "654114682160",
          appId: "1:654114682160:web:6ec4808518fb68fa3684f5",
          measurementId: "G-DJMM8L230X"
        };

        // Initialize Firebase App and Firestore
        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);

        // Load user data using Netlify Identity user ID
        loadUserData(user.id, db);
      }
    });
  } else {
    console.error("Netlify Identity widget not loaded");
    window.location.href = 'index.html';
  }
});

async function loadUserData(userId, db) {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      console.log("User data:", userDocSnap.data());
      displayTBR(userDocSnap.data().tbr || []);
      displayLiked(userDocSnap.data().liked || []);
    } else {
      console.log("No user data found in Firestore.");
      // Optionally initialize an empty document for the user here
    }
  } catch (error) {
    console.error("Error getting user data:", error);
  }
}

function displayTBR(tbrList) {
  console.log("Displaying TBR list:", tbrList);
  // Add your UI rendering logic for the TBR list here
}

function displayLiked(likedList) {
  console.log("Displaying Liked list:", likedList);
  // Add your UI rendering logic for the Liked list here
}
