let books = [];
let liked = JSON.parse(localStorage.getItem("liked")) || [];
let tbr = JSON.parse(localStorage.getItem("tbr")) || [];

document.addEventListener("DOMContentLoaded", () => {
    if (window.netlifyIdentity) {
        netlifyIdentity.on("init", user => {
            if (!user) {
                window.location.href = "index.html";
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

    fetchBooks();
});

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

function shortenSynopsis(synopsis) {
    const words = synopsis.split(/\s+/);
    if (words.length <= 30) return synopsis;
    return words.slice(0, 30).join(" ") + "...";
}

function displayLiked() {
    const likedShelf = document.getElementById("liked-shelf");
    if (!likedShelf) return;
    likedShelf.innerHTML = "";
    liked.forEach(bookName => {
        const book = books.find(b => b.name === bookName);
        if (book) {
            const div = document.createElement("div");
            div.className = "book";
            div.innerHTML = `
                <img src="${book.cover}" alt="${book.title}" onerror="this.src='assets/placeholder.jpg'">
                <p>${book.title}</p>
                <p class="synopsis">${book.synopsis}</p>
                <div class="buttons">
                    <button class="like-btn ${liked.includes(book.name) ? 'liked' : ''}" onclick="removeFromLiked('${book.name}'); event.stopPropagation();">
                        <i class="fas fa-heart"></i>
                    </button>
                    <button onclick="window.location.href='reader.html?book=${encodeURIComponent(book.name)}'; event.stopPropagation();">Read</button>
                </div>
            `;
            div.addEventListener("click", () => {
                window.location.href = `reader.html?book=${encodeURIComponent(book.name)}`;
            });
            likedShelf.appendChild(div);
        }
    });
}

function displayTBR() {
    const tbrShelf = document.getElementById("tbr-shelf");
    if (!tbrShelf) return;
    tbrShelf.innerHTML = "";
    tbr.forEach(bookName => {
        const book = books.find(b => b.name === bookName);
        if (book) {
            const div = document.createElement("div");
            div.className = "book";
            div.innerHTML = `
                <img src="${book.cover}" alt="${book.title}" onerror="this.src='assets/placeholder.jpg'">
                <p>${book.title}</p>
                <p class="synopsis">${book.synopsis}</p>
                <div class="buttons">
                    <button class="like-btn ${liked.includes(book.name) ? 'liked' : ''}" onclick="addToLiked('${book.name}'); event.stopPropagation();">
                        <i class="fas fa-heart"></i>
                    </button>
                    <button onclick="removeFromTBR('${book.name}'); event.stopPropagation();">Remove</button>
                    <button onclick="window.location.href='reader.html?book=${encodeURIComponent(book.name)}'; event.stopPropagation();">Read</button>
                </div>
            `;
            div.addEventListener("click", () => {
                window.location.href = `reader.html?book=${encodeURIComponent(book.name)}`;
            });
            tbrShelf.appendChild(div);
        }
    });
}

function displayGenres() {
    const genreShelves = document.getElementById("genre-shelves");
    if (!genreShelves) return;
    genreShelves.innerHTML = "";
    const genres = [...new Set(books.map(book => book.genre).filter(g => g))];
    genres.forEach(genre => {
        const genreSection = document.createElement("div");
        genreSection.innerHTML = `<h3>${genre}</h3>`;
        const shelf = document.createElement("div");
        shelf.className = "shelf";
        const genreBooks = books.filter(book => book.genre === genre);
        genreBooks.forEach(book => {
            const div = document.createElement("div");
            div.className = "book";
            div.innerHTML = `
                <img src="${book.cover}" alt="${book.title}" onerror="this.src='assets/placeholder.jpg'">
                <p>${book.title}</p>
                <p class="synopsis">${book.synopsis}</p>
                <div class="buttons">
                    <button class="like-btn ${liked.includes(book.name) ? 'liked' : ''}" onclick="addToLiked('${book.name}'); event.stopPropagation();">
                        <i class="fas fa-heart"></i>
                    </button>
                    <button onclick="addToTBR('${book.name}'); event.stopPropagation();">${tbr.includes(book.name) ? "In TBR" : "Add to TBR"}</button>
                    <button onclick="window.location.href='reader.html?book=${encodeURIComponent(book.name)}'; event.stopPropagation();">Read</button>
                </div>
            `;
            div.addEventListener("click", () => {
                window.location.href = `reader.html?book=${encodeURIComponent(book.name)}`;
            });
            shelf.appendChild(div);
        });
        genreSection.appendChild(shelf);
        genreShelves.appendChild(genreSection);
    });
}

function addToLiked(bookName) {
    if (!liked.includes(bookName)) {
        liked.push(bookName);
        localStorage.setItem("liked", JSON.stringify(liked));
    } else {
        liked = liked.filter(name => name !== bookName);
        localStorage.setItem("liked", JSON.stringify(liked));
    }
    displayLiked();
    displayTBR();
    displayGenres();
}

function removeFromLiked(bookName) {
    liked = liked.filter(name => name !== bookName);
    localStorage.setItem("liked", JSON.stringify(liked));
    displayLiked();
    displayGenres();
}

function addToTBR(bookName) {
    if (!tbr.includes(bookName)) {
        tbr.push(bookName);
        localStorage.setItem("tbr", JSON.stringify(tbr));
    }
    displayTBR();
    displayGenres();
}

function removeFromTBR(bookName) {
    tbr = tbr.filter(name => name !== bookName);
    localStorage.setItem("tbr", JSON.stringify(tbr));
    displayTBR();
    displayGenres();
}

function displayError(message) {
    const genreShelves = document.getElementById("genre-shelves");
    if (genreShelves) {
        genreShelves.innerHTML = `<p style="color: #e50914; grid-column: 1 / -1; text-align: center;">${message}</p>`;
    }
}