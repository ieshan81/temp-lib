document.addEventListener('DOMContentLoaded', () => {
    if (window.netlifyIdentity) {
        netlifyIdentity.on('init', user => {
            if (!user) {
                // No user logged in, redirect to login page
                console.log("No user detected, redirecting to login...");
                window.location.href = 'index.html';
            } else {
                // User is logged in, load dashboard content
                console.log("User is logged in:", user.id);
                // Initialize Firebase for user data
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
                // Load user data from Firebase using Netlify Identity user ID
                loadUserData(user.id);
            }
        });
    } else {
        console.error("Netlify Identity widget not loaded");
        window.location.href = 'index.html';
    }
});

function loadUserData(userId) {
    // Load data from Firestore using the Netlify Identity user ID
    const db = firebase.firestore();
    db.collection('users').doc(userId).get()
        .then((doc) => {
            if (doc.exists) {
                console.log("User data:", doc.data());
                // Display data on the dashboard (e.g., TBR and Liked lists)
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

// Placeholder functions to display data (replace with your actual UI logic)
function displayTBR(tbrList) {
    console.log("Displaying TBR list:", tbrList);
    // Add your code to render the TBR list in the dashboard UI
}

function displayLiked(likedList) {
    console.log("Displaying Liked list:", likedList);
    // Add your code to render the Liked list in the dashboard UI
}