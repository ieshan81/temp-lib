document.addEventListener('DOMContentLoaded', () => {
    if (window.netlifyIdentity) {
        netlifyIdentity.on('init', user => {
            if (!user) {
                // No user logged in, redirect to login page
                console.log("No user detected, redirecting to login...");
                window.location.href = 'index.html';
            } else {
                // User is logged in, proceed to load dashboard
                console.log("User is logged in:", user.id);
                // Initialize Firebase for Firestore (user data)
                const firebaseConfig = {
                    apiKey: "your-api-key",
                    authDomain: "your-auth-domain",
                    projectId: "your-project-id",
                    storageBucket: "your-storage-bucket",
                    messagingSenderId: "your-messaging-sender-id",
                    appId: "your-app-id",
                    measurementId: "your-measurement-id"
                };
                firebase.initializeApp(firebaseConfig);
                // Load user data from Firestore using Netlify Identity user ID
                loadUserData(user.id);
            }
        });
    } else {
        console.error("Netlify Identity widget not loaded");
        window.location.href = 'index.html';
    }
});

function loadUserData(userId) {
    const db = firebase.firestore();
    db.collection('users').doc(userId).get()
        .then((doc) => {
            if (doc.exists) {
                console.log("User data:", doc.data());
                // Display TBR and Liked lists on the dashboard
                displayTBR(doc.data().tbr || []);
                displayLiked(doc.data().liked || []);
            } else {
                console.log("No user data found in Firestore.");
                // Optionally, initialize an empty document for the user
            }
        })
        .catch((error) => {
            console.error("Error getting user data:", error);
        });
}

// Placeholder functions for displaying data (replace with your actual UI logic)
function displayTBR(tbrList) {
    console.log("Displaying TBR list:", tbrList);
    // Add code to render TBR list in the dashboard
}

function displayLiked(likedList) {
    console.log("Displaying Liked list:", likedList);
    // Add code to render Liked list in the dashboard
}