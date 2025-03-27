let books = [];
let tbr = JSON.parse(localStorage.getItem("tbr")) || [];

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
        displayTBR();
    } catch (error) {
        console.error("Error fetching books:", error);
        displayError("Failed to load books. Please try again later.");
    }
}

async function fetchBookDetails(title) {
    try {
        // First try Open Library
        const olResponse = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(title)}`);
        const olData = await olResponse.json();
        if (olData.docs && olData.docs.length > 0) {
            const doc = olData.docs[0];
            const coverId = doc.cover_i;
            const cover = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null;
            const synopsis = doc.first_sentence || doc.subtitle || null;
            if (cover) return { cover, synopsis };
        }

        // Fallback to Google Books
        const googleResponse = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(title)}`);
        const googleData = await googleResponse.json();
        if (googleData.items && googleData.items.length > 0) {
            const item = googleData.items[0];
            const cover = item.volumeInfo.imageLinks?.thumbnail || null;
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
    libraryShelf.innerHTML = "";
    books.forEach(book => {
        const div = document.createElement("div");
        div.className = "book";
        div.innerHTML = `
            <img src="${book.cover}" alt="${book.title}" onerror="this.src='assets/placeholder.jpg'">
            <p>${book.title}</p>
            <p class="synopsis">${book.synopsis}</p>
            <button onclick="addToTBR('${book.name}')">Add to TBR</button>
            <button onclick="window.location.href='reader.html?book=${encodeURIComponent(book.name)}'">Read</button>
        `;
        libraryShelf.appendChild(div);
    });
}

function displayTBR() {
    const tbrShelf = document.getElementById("tbr-shelf");
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
                <button onclick="removeFromTBR('${book.name}')">Remove</button>
                <button onclick="window.location.href='reader.html?book=${encodeURIComponent(book.name)}'">Read</button>
            `;
            tbrShelf.appendChild(div);
        }
    });
}

function addToTBR(bookName) {
    if (!tbr.includes(bookName)) {
        tbr.push(bookName);
        localStorage.setItem("tbr", JSON.stringify(tbr));
        displayTBR();
    }
}

function removeFromTBR(bookName) {
    tbr = tbr.filter(name => name !== bookName);
    localStorage.setItem("tbr", JSON.stringify(tbr));
    displayTBR();
}

function displayError(message) {
    const libraryShelf = document.getElementById("library-shelf");
    libraryShelf.innerHTML = `<p style="color: #e50914; grid-column: 1 / -1; text-align: center;">${message}</p>`;
}

document.getElementById("search").addEventListener("input", e => {
    const query = e.target.value.toLowerCase();
    const filteredBooks = books.filter(book => book.title.toLowerCase().includes(query));
    const libraryShelf = document.getElementById("library-shelf");
    libraryShelf.innerHTML = "";
    filteredBooks.forEach(book => {
        const div = document.createElement("div");
        div.className = "book";
        div.innerHTML = `
            <img src="${book.cover}" alt="${book.title}" onerror="this.src='assets/placeholder.jpg'">
            <p>${book.title}</p>
            <p class="synopsis">${book.synopsis}</p>
            <button onclick="addToTBR('${book.name}')">Add to TBR</button>
            <button onclick="window.location.href='reader.html?book=${encodeURIComponent(book.name)}'">Read</button>
        `;
        libraryShelf.appendChild(div);
    });
});

fetchBooks();