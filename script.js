const repoUrl = "https://api.github.com/repos/ieshan81/books-repo/contents/pdfs";
const rawBaseUrl = "https://raw.githubusercontent.com/ieshan81/books-repo/main/pdfs/";
let books = [];
let tbr = JSON.parse(localStorage.getItem("tbr")) || [];

function fetchBooks() {
    fetch(repoUrl)
        .then(response => response.json())
        .then(data => {
            books = data.filter(file => file.name.endsWith(".pdf"));
            displayBooks();
            displayTBR();
        })
        .catch(error => console.error("Error fetching books:", error));
}

function displayBooks() {
    const libraryRow = document.getElementById("library-row");
    libraryRow.innerHTML = "";
    books.forEach(book => {
        const div = document.createElement("div");
        div.className = "book";
        div.innerHTML = `
            <img src="assets/placeholder.jpg" alt="${book.name}">
            <p>${book.name.replace(".pdf", "")}</p>
            <button onclick="addToTBR('${book.name}')">Add to TBR</button>
            <button onclick="window.location.href='reader.html?book=${encodeURIComponent(book.name)}'">Read</button>
        `;
        libraryRow.appendChild(div);
    });
}

function displayTBR() {
    const tbrRow = document.getElementById("tbr-row");
    tbrRow.innerHTML = "";
    tbr.forEach(bookName => {
        const book = books.find(b => b.name === bookName);
        if (book) {
            const div = document.createElement("div");
            div.className = "book";
            div.innerHTML = `
                <img src="assets/placeholder.jpg" alt="${book.name}">
                <p>${book.name.replace(".pdf", "")}</p>
                <button onclick="removeFromTBR('${book.name}')">Remove</button>
                <button onclick="window.location.href='reader.html?book=${encodeURIComponent(book.name)}'">Read</button>
            `;
            tbrRow.appendChild(div);
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

document.getElementById("search").addEventListener("input", e => {
    const query = e.target.value.toLowerCase();
    const filteredBooks = books.filter(book => book.name.toLowerCase().includes(query));
    const libraryRow = document.getElementById("library-row");
    libraryRow.innerHTML = "";
    filteredBooks.forEach(book => {
        const div = document.createElement("div");
        div.className = "book";
        div.innerHTML = `
            <img src="assets/placeholder.jpg" alt="${book.name}">
            <p>${book.name.replace(".pdf", "")}</p>
            <button onclick="addToTBR('${book.name}')">Add to TBR</button>
            <button onclick="window.location.href='reader.html?book=${encodeURIComponent(book.name)}'">Read</button>
        `;
        libraryRow.appendChild(div);
    });
});

fetchBooks();