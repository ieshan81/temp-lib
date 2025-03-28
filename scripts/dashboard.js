import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', () => {
  if (window.netlifyIdentity) {
    netlifyIdentity.on('init', user => {
      if (!user) {
        console.log("No user detected, redirecting to login...");
        window.location.href = 'index.html';
      } else {
        console.log("User is logged in:", user.id);
        const firebaseConfig = {
          apiKey: "AIzaSyBKN6-wxkU5kvbvpgl2Lr8XsGjUGRI6l-8",
          authDomain: "library-project-bcc87.firebaseapp.com",
          projectId: "library-project-bcc87",
          storageBucket: "library-project-bcc87.firebasestorage.app",
          messagingSenderId: "654114682160",
          appId: "1:654114682160:web:6ec4808518fb68fa3684f5",
          measurementId: "G-DJMM8L230X"
        };

        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);

        // Fetch and display the hardcoded "users123" data
        loadUserData(db);
      }
    });

    // Handle logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        netlifyIdentity.logout();
        window.location.href = 'index.html';
      });
    }
  } else {
    console.error("Netlify Identity widget not loaded");
    window.location.href = 'index.html';
  }
});

async function loadUserData(db) {
  try {
    const userDocRef = doc(db, 'users', 'users123'); // Hardcoded to "users123"
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      console.log("User data for users123:", userDocSnap.data());
      displayTBR(userDocSnap.data().tbr || []);
      displayLiked(userDocSnap.data().liked || []);
    } else {
      console.log("No user data found for users123 in Firestore.");
      const tbrShelf = document.getElementById('tbr-shelf');
      const likedShelf = document.getElementById('liked-shelf');
      if (tbrShelf) tbrShelf.innerHTML = '<p>No TBR data found.</p>';
      if (likedShelf) likedShelf.innerHTML = '<p>No Liked data found.</p>';
    }
  } catch (error) {
    console.error("Error getting user data:", error);
    const tbrShelf = document.getElementById('tbr-shelf');
    const likedShelf = document.getElementById('liked-shelf');
    if (tbrShelf) tbrShelf.innerHTML = '<p>Error loading TBR data.</p>';
    if (likedShelf) likedShelf.innerHTML = '<p>Error loading Liked data.</p>';
  }
}

function displayTBR(tbrList) {
  const tbrShelf = document.getElementById('tbr-shelf');
  if (tbrShelf) {
    tbrShelf.innerHTML = ''; // Clear previous content
    if (tbrList.length === 0) {
      tbrShelf.innerHTML = '<p>No books in TBR.</p>';
    } else {
      const ul = document.createElement('ul');
      tbrList.forEach(book => {
        const li = document.createElement('li');
        li.textContent = book;
        ul.appendChild(li);
      });
      tbrShelf.appendChild(ul);
    }
  }
}

function displayLiked(likedList) {
  const likedShelf = document.getElementById('liked-shelf');
  if (likedShelf) {
    likedShelf.innerHTML = ''; // Clear previous content
    if (likedList.length === 0) {
      likedShelf.innerHTML = '<p>No liked books.</p>';
    } else {
      const ul = document.createElement('ul');
      likedList.forEach(book => {
        const li = document.createElement('li');
        li.textContent = book;
        ul.appendChild(li);
      });
      likedShelf.appendChild(ul);
    }
  }
}