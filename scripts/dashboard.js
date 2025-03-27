const firebaseConfig = {
    apiKey: "your-api-key",
    apiKey: "AIzaSyBKN6-wxkU5kvbvpgl2Lr8XsGjUGRI6l-8",
    authDomain: "library-project-bcc87.firebaseapp.com",
    projectId: "library-project-bcc87",
    storageBucket: "library-project-bcc87.firebasestorage.app",
    messagingSenderId: "654114682160",
    appId: "1:654114682160:web:6ec4808518fb68fa3684f5",
    measurementId: "G-DJMM8L230X"
};

// Initialize Firebase with global firebase object
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Logout functionality
document.getElementById('logout').addEventListener('click', () => {
    auth.signOut().then(() => {
        window.location.href = 'index.html'; // Redirect to login page
    });
});

// Display all books
function displayAllBooks() {
    const bookList = document.getElementById('book-list');
    db.collection('books').get()
        .then((querySnapshot) => {
            bookList.innerHTML = '';
            querySnapshot.forEach((doc) => {
                const book = doc.data();
                const div = document.createElement('div');
                div.className = 'book';
                div.innerHTML = `
                    <h3>${book.title}</h3>
                    <p>${book.author}</p>
                    <button onclick="addToTBR('${doc.id}')">Add to TBR</button>
                    <button onclick="likeBook('${doc.id}')"><i class="fas fa-heart"></i> Like</button>
                `;
                bookList.appendChild(div);
            });
        })
        .catch((error) => console.error('Error fetching books:', error));
}

// Display TBR books
function displayTBR() {
    const tbrList = document.getElementById('tbr-list');
    const userId = auth.currentUser.uid;
    db.collection('users').doc(userId).get()
        .then((doc) => {
            if (doc.exists && doc.data().tbr) {
                tbrList.innerHTML = '';
                doc.data().tbr.forEach((bookId) => {
                    db.collection('books').doc(bookId).get()
                        .then((bookDoc) => {
                            const book = bookDoc.data();
                            const div = document.createElement('div');
                            div.innerHTML = `<p>${book.title} by ${book.author}</p>`;
                            tbrList.appendChild(div);
                        });
                });
            }
        })
        .catch((error) => console.error('Error fetching TBR:', error));
}

// Add to TBR
function addToTBR(bookId) {
    const userId = auth.currentUser.uid;
    db.collection('users').doc(userId).update({
        tbr: firebase.firestore.FieldValue.arrayUnion(bookId)
    }).then(() => displayTBR());
}

// Like a book
function likeBook(bookId) {
    const userId = auth.currentUser.uid;
    db.collection('users').doc(userId).update({
        liked: firebase.firestore.FieldValue.arrayUnion(bookId)
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged((user) => {
        if (user) {
            displayAllBooks();
            displayTBR();
        } else {
            window.location.href = 'index.html'; // Redirect to login if not authenticated
        }
    });
});