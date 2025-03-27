let books = [];
let liked = JSON.parse(localStorage.getItem("liked")) || [];
let tbr = JSON.parse(localStorage.getItem("tbr")) || [];

document.addEventListener("DOMContentLoaded", () => {
    if (window.netlifyIdentity) {
        netlifyIdentity.on("init", user => {
            const logoutBtn = document.getElementById("logout-btn");
            if (!logoutBtn) {
                console.error("Logout button not found in the DOM.");
                return;
            }
            if (user) {
                logoutBtn.style.display = "inline-block";
            } else {
                window.location.href = "index.html";
            }
        });

        document.getElementById("logout-btn").addEventListener("click", () => {
            netlifyIdentity.logout();
            window.location.href = "index.html";
        });
    }

    fetchBooks();
});

async function fetchBooks() {
    try {
        const response = await fetch("/.netlify/functions/listbook");
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const bookFiles = await response.json();
        books = await Promise.all(bookFiles.map(async file => {
            const title = file.name.replace(".pdf", "");
            const details = await fetchBookDetails(title);
            return {
                name: file.name,
                title: title,
                cover: details.cover || "assets/placeholder.jpg",
                synopsis: details.synopsis || "No synopsis available."
            };
        }));
        displayBooks();
    } catch (error) {
        console.error("Error fetching books:", error);
        displayError("Failed to load books. Please try again later.");
    }
}

async function fetchBookDetails(title) {
    try {
        // Use HTTPS for Open Library
        const olResponse = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(title)}`);
        if (!olResponse.ok) throw new Error(`Open Library API error: ${olResponse.statusText}`);
        const olData = await olResponse.json();
        if (olData.docs && olData.docs.length > 0) {
            const doc = olData.docs[0];
            const coverId = doc.cover_i;
            const cover = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null;
            const synopsis = doc.first_sentence || doc.subtitle || null;
            if (cover) return { cover, synopsis };
        }

        // Use HTTPS for Google Books
        const googleResponse = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(title)}`);
        if (!googleResponse.ok) throw new Error(`Google Books API error: ${googleResponse.statusText}`);
        const googleData = await googleResponse.json();
        if (googleData.items && googleData.items.length > 0) {
            const item = googleData.items[0];
            const cover = item.volumeInfo.imageLinks?.thumbnail?.replace("http://", "https://") || null;
            const synopsis = item.volumeInfo.description || null;
            return { cover, synopsis };
        }

        return { cover: null, synopsis: null };
    } catch (error) {
        console.error(`Error fetching details for ${title}:`, error);
        return { cover: null, synopsis: null };
    }
}

function displayBooks() {
    const libraryShelf = document.getElementById("library-shelf");
    if (!libraryShelf) {
        console.error("Library shelf element not found in the DOM.");
        return;
    }
    libraryShelf.innerHTML = "";
    books.forEach(book => {
        const div = document.createElement("div");
        div.className = "book";
        div.innerHTML = `
            <img src="${book.cover}" alt="${book.title}" onerror="this.src='assets/placeholder.jpg'">
            <p>${book.title}</p>
            <p class="synopsis">${book.synopsis}</p>
            <button onclick="addToLiked('${book.name}')">${liked.includes(book.name) ? "Unlike" : "Like"}</button>
            <button onclick="addToTBR('${book.name}')">${tbr.includes(book.name) ? "In TBR" : "Add to TBR"}</button>
            <button onclick="window.location.href='reader.html?book=${encodeURIComponent(book.name)}'">Read</button>
        `;
        libraryShelf.appendChild(div);
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
    displayBooks();
}

function addToTBR(bookName) {
    if (!tbr.includes(bookName)) {
        tbr.push(bookName);
        localStorage.setItem("tbr", JSON.stringify(tbr));
    }
    displayBooks();
}

function displayError(message) {
    const libraryShelf = document.getElementById("library-shelf");
    if (libraryShelf) {
        libraryShelf.innerHTML = `<p style="color: #e50914; grid-column: 1 / -1; text-align: center;">${message}</p>`;
    }
}

document.getElementById("search").addEventListener("input", e => {
    const query = e.target.value.toLowerCase();
    const filteredBooks = books.filter(book => book.title.toLowerCase().includes(query));
    const libraryShelf = document.getElementById("library-shelf");
    if (libraryShelf) {
        libraryShelf.innerHTML = "";
        filteredBooks.forEach(book => {
            const div = document.createElement("div");
            div.className = "book";
            div.innerHTML = `
                <img src="${book.cover}" alt="${book.title}" onerror="this.src='assets/placeholder.jpg'">
                <p>${book.title}</p>
                <p class="synopsis">${book.synopsis}</p>
                <button onclick="addToLiked('${book.name}')">${liked.includes(book.name) ? "Unlike" : "Like"}</button>
                <button onclick="addToTBR('${book.name}')">${tbr.includes(book.name) ? "In TBR" : "Add to TBR"}</button>
                <button onclick="window.location.href='reader.html?book=${encodeURIComponent(book.name)}'">Read</button>
            `;
            libraryShelf.appendChild(div);
        });
    }
});