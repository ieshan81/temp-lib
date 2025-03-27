let books = [];
let liked = [];
let tbr = [];

document.addEventListener("DOMContentLoaded", () => {
    if (window.netlifyIdentity) {
        netlifyIdentity.on("init", user => {
            if (!user) {
                window.location.href = "index.html";
            } else {
                fetchUserData(user).then(() => fetchBooks());
            }
        });

        const logoutBtn = document.getElementById("logout-btn");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", () => {
                netlifyIdentity.logout();
                window.location.href = "index.html";
            });
        }
    }
});

async function fetchUserData(user) {
    try {
        const response = await fetch("/.netlify/functions/manage-tbr", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${user.token.access_token}`,
            },
        });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        tbr = data.tbr || [];
        liked = data.liked || [];
    } catch (error) {
        console.error("Error fetching user data:", error);
        tbr = [];
        liked = [];
    }
}

async function updateUserData(newTbr, newLiked) {
    try {
        const user = netlifyIdentity.currentUser();
        if (!user) throw new Error("No user logged in");
        const response = await fetch("/.netlify/functions/manage-tbr", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${user.token.access_token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ tbr: newTbr, liked: newLiked }),
        });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        tbr = newTbr;
        liked = newLiked;
    } catch (error) {
        console.error("Error updating user data:", error);
    }
}

async function fetchBooks() {
    try {
        const response = await fetch("/.netlify/functions/listbook");
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const bookFiles = await response.json();
        books = await Promise.all(bookFiles.map(async file => {
            const title = file.name.replace(".pdf", "").replace(/_/g, " ");
            const details = await fetchBookDetails(title);
            return {
                name: file.name,
                title: title,
                cover: details.cover || "assets/placeholder.jpg",
                synopsis: shortenSynopsis(details.synopsis || "No synopsis available."),
                genre: details.genre || "Unknown"
            };
        }));
        displayAllBooks();
        displayLiked();
        displayTBR();
        displayGenres();
    } catch (error) {
        console.error("Error fetching books:", error);
        displayError("Failed to load books. Please try again later.");
    }
}

async function fetchBookDetails(title) {
    try {
        const olResponse = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(title)}`);
        if (!olResponse.ok) throw new Error(`Open Library API error: ${olResponse.statusText}`);
        const olData = await olResponse.json();
        if (olData.docs && olData.docs.length > 0) {
            const doc = olData.docs[0];
            const coverId = doc.cover_i;
            const cover = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null;
            const synopsis = doc.first_sentence || doc.subtitle || null;
            const genre = doc.subjects ? doc.subjects[0] : null;
            if (cover) return { cover, synopsis, genre };
        }

        const googleResponse = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(title)}`);
        if (!googleResponse.ok) throw new Error(`Google Books API error: ${googleResponse.statusText}`);
        const googleData = await googleResponse.json();
        if (googleData.items && googleData.items.length > 0) {
            const item = googleData.items[0];
            const cover = item.volumeInfo.imageLinks?.thumbnail?.replace("http://", "https://") || null;
            const synopsis = item.volumeInfo.description || null;
            const genre = item.volumeInfo.categories ? item.volumeInfo.categories[0] : null;
            return { cover, synopsis, genre };
        }

        return { cover: null, synopsis: null, genre: null };
    } catch (error) {
        console.error(`Error fetching details for ${title}:`, error);
        return { cover: null, synopsis: null, genre: null };
    }
}

function shortenSynopsis(synopsis, wordLimit = 30) {
    const words = synopsis.split(/\s+/);
    if (words.length <= wordLimit) return synopsis;
    return words.slice(0, wordLimit).join(" ") + "...";
}

function displayAllBooks() {
    const allBooksShelf = document.getElementById("all-books-shelf");
    if (!allBooksShelf) return;
    allBooksShelf.innerHTML = "";
    allBooksShelf.className = "shelf";
    books.forEach(book => {
        const bookDiv = document.createElement("div");
        bookDiv.className = "book";
        bookDiv.innerHTML = `
            <div class="image-container">
                <img src="${book.cover}" alt="${book.title}" onerror="this.src='assets/placeholder.jpg'">
                <p class="synopsis">${book.synopsis}</p>
            </div>
            <p>${book.title}</p>
            <div class="buttons">
                <button class="like-btn ${liked.includes(book.name) ? 'liked' : ''}" onclick="addToLiked('${book.name}'); event.stopPropagation();">
                    <i class="fas fa-heart"></i>
                </button>
                <button onclick="toggleTBR('${book.name}'); event.stopPropagation();">${tbr.includes(book.name) ? "Remove from TBR" : "Add to TBR"}</button>
            </div>
        `;
        bookDiv.addEventListener("click", () => {
            window.location.href = `reader.html?book=${encodeURIComponent(book.name)}`;
        });
        allBooksShelf.appendChild(bookDiv);
    });
    toggleSectionVisibility("all-books", books.length);
}

function displayLiked() {
    const likedShelf = document.getElementById("liked-shelf");
    if (!likedShelf) return;
    likedShelf.innerHTML = "";
    likedShelf.className = "shelf";
    liked.forEach(bookName => {
        const book = books.find(b => b.name === bookName);
        if (book) {
            const bookDiv = document.createElement("div");
            bookDiv.className = "book";
            bookDiv.innerHTML = `
                <div class="image-container">
                    <img src="${book.cover}" alt="${book.title}" onerror="this.src='assets/placeholder.jpg'">
                    <p class="synopsis">${book.synopsis}</p>
                </div>
                <p>${book.title}</p>
                <div class="buttons">
                    <button class="like-btn ${liked.includes(book.name) ? 'liked' : ''}" onclick="removeFromLiked('${book.name}'); event.stopPropagation();">
                        <i class="fas fa-heart"></i>
                    </button>
                    <button onclick="toggleTBR('${book.name}'); event.stopPropagation();">${tbr.includes(book.name) ? "Remove from TBR" : "Add to TBR"}</button>
                </div>
            `;
            bookDiv.addEventListener("click", () => {
                window.location.href = `reader.html?book=${encodeURIComponent(book.name)}`;
            });
            likedShelf.appendChild(bookDiv);
        }
    });
    toggleSectionVisibility("liked", liked.length);
}

function displayTBR() {
    const tbrShelf = document.getElementById("tbr-shelf");
    if (!tbrShelf) return;
    tbrShelf.innerHTML = "";
    tbrShelf.className = "shelf";
    tbr.forEach(bookName => {
        const book = books.find(b => b.name === bookName);
        if (book) {
            const bookDiv = document.createElement("div");
            bookDiv.className = "book";
            bookDiv.innerHTML = `
                <div class="image-container">
                    <img src="${book.cover}" alt="${book.title}" onerror="this.src='assets/placeholder.jpg'">
                    <p class="synopsis">${book.synopsis}</p>
                </div>
                <p>${book.title}</p>
                <div class="buttons">
                    <button class="like-btn ${liked.includes(book.name) ? 'liked' : ''}" onclick="addToLiked('${book.name}'); event.stopPropagation();">
                        <i class="fas fa-heart"></i>
                    </button>
                    <button onclick="removeFromTBR('${book.name}'); event.stopPropagation();">Remove</button>
                </div>
            `;
            bookDiv.addEventListener("click", () => {
                window.location.href = `reader.html?book=${encodeURIComponent(book.name)}`;
            });
            tbrShelf.appendChild(bookDiv);
        }
    });
    toggleSectionVisibility("tbr", tbr.length);
}

function displayGenres() {
    const genreShelves = document.getElementById("genre-shelves");
    if (!genreShelves) return;
    genreShelves.innerHTML = "";
    const genres = [...new Set(books.map(book => book.genre).filter(g => g))];
    genres.forEach(genre => {
        const genreSection = document.createElement("div");
        genreSection.className = "genre-section";
        genreSection.innerHTML = `<h3>${genre}</h3>`;
        const shelf = document.createElement("div");
        shelf.className = "shelf";
        const genreBooks = books.filter(book => book.genre === genre);
        genreBooks.forEach(book => {
            const bookDiv = document.createElement("div");
            bookDiv.className = "book";
            bookDiv.innerHTML = `
                <div class="image-container">
                    <img src="${book.cover}" alt="${book.title}" onerror="this.src='assets/placeholder.jpg'">
                    <p class="synopsis">${book.synopsis}</p>
                </div>
                <p>${book.title}</p>
                <div class="buttons">
                    <button class="like-btn ${liked.includes(book.name) ? 'liked' : ''}" onclick="addToLiked('${book.name}'); event.stopPropagation();">
                        <i class="fas fa-heart"></i>
                    </button>
                    <button onclick="toggleTBR('${book.name}'); event.stopPropagation();">${tbr.includes(book.name) ? "Remove from TBR" : "Add to TBR"}</button>
                </div>
            `;
            bookDiv.addEventListener("click", () => {
                window.location.href = `reader.html?book=${encodeURIComponent(book.name)}`;
            });
            shelf.appendChild(bookDiv);
        });
        genreSection.appendChild(shelf);
        genreShelves.appendChild(genreSection);
        toggleSectionVisibility(genreSection, genreBooks.length);
    });
}

async function toggleTBR(bookName) {
    if (tbr.includes(bookName)) {
        tbr = tbr.filter(name => name !== bookName);
    } else {
        tbr.push(bookName);
    }
    await updateUserData(tbr, liked);
    displayAllBooks();
    displayLiked();
    displayTBR();
    displayGenres();
}

async function addToLiked(bookName) {
    if (!liked.includes(bookName)) {
        liked.push(bookName);
    } else {
        liked = liked.filter(name => name !== bookName);
    }
    await updateUserData(tbr, liked);
    displayAllBooks();
    displayLiked();
    displayTBR();
    displayGenres();
}

async function removeFromLiked(bookName) {
    liked = liked.filter(name => name !== bookName);
    await updateUserData(tbr, liked);
    displayAllBooks();
    displayLiked();
    displayGenres();
}

async function addToTBR(bookName) {
    if (!tbr.includes(bookName)) {
        tbr.push(bookName);
        await updateUserData(tbr, liked);
    }
    displayAllBooks();
    displayTBR();
    displayGenres();
}

async function removeFromTBR(bookName) {
    tbr = tbr.filter(name => name !== bookName);
    await updateUserData(tbr, liked);
    displayAllBooks();
    displayTBR();
    displayGenres();
}

function displayError(message) {
    const genreShelves = document.getElementById("genre-shelves");
    if (genreShelves) {
        genreShelves.innerHTML = `<p style="color: #e50914; grid-column: 1 / -1; text-align: center;">${message}</p>`;
    }
}

function toggleSectionVisibility(sectionId, itemCount) {
    const section = typeof sectionId === "string" ? document.getElementById(sectionId) : sectionId;
    if (section) {
        section.style.display = itemCount > 0 ? "block" : "none";
    }
}