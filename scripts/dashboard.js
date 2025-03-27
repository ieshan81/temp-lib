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
                genre: details.genre || "Unknown",
                series: details.series || inferSeries(title, details.synopsis)
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
            const series = doc.series ? doc.series[0] : null; // Open Library might provide series info
            if (cover) return { cover, synopsis, genre, series };
        }

        const googleResponse = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(title)}`);
        if (!googleResponse.ok) throw new Error(`Google Books API error: ${googleResponse.statusText}`);
        const googleData = await googleResponse.json();
        if (googleData.items && googleData.items.length > 0) {
            const item = googleData.items[0];
            const cover = item.volumeInfo.imageLinks?.thumbnail?.replace("http://", "https://") || null;
            const synopsis = item.volumeInfo.description || null;
            const genre = item.volumeInfo.categories ? item.volumeInfo.categories[0] : null;
            const series = item.volumeInfo.series || null; // Google Books might provide series info
            return { cover, synopsis, genre, series };
        }

        return { cover: null, synopsis: null, genre: null, series: null };
    } catch (error) {
        console.error(`Error fetching details for ${title}:`, error);
        return { cover: null, synopsis: null, genre: null, series: null };
    }
}

function inferSeries(title, synopsis) {
    // Heuristic to infer series name from title or synopsis
    const seriesKeywords = [
        { keyword: "Flesh and Fire", titles: ["A Light in the Flame", "A Fire in the Flesh", "A Shadow in the Ember", "A Soul of Ash and Blood"] },
        // Add more series as needed
    ];

    for (const series of seriesKeywords) {
        if (series.titles.some(t => title.includes(t))) {
            return series.keyword;
        }
        if (synopsis && synopsis.includes(series.keyword)) {
            return series.keyword;
        }
    }
    return "Standalone"; // Default to "Standalone" if no series is identified
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
    const seriesGroups = groupBooksBySeries(liked);
    Object.keys(seriesGroups).forEach(series => {
        const seriesBooks = seriesGroups[series];
        const seriesDiv = document.createElement("div");
        seriesDiv.className = "series-group";
        seriesDiv.innerHTML = `
            <div class="series-header">
                <h4>${series}</h4>
                <span class="toggle-icon">▼</span>
            </div>
            <div class="series-books shelf">
                ${seriesBooks.map(book => `
                    <div class="book">
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
                    </div>
                `).join('')}
            </div>
        `;
        const header = seriesDiv.querySelector(".series-header");
        const bookList = seriesDiv.querySelector(".series-books");
        header.addEventListener("click", () => {
            bookList.classList.toggle("expanded");
            const icon = header.querySelector(".toggle-icon");
            icon.textContent = bookList.classList.contains("expanded") ? "▲" : "▼";
        });
        likedShelf.appendChild(seriesDiv);
    });
    toggleSectionVisibility("liked", liked.length);
}

function displayTBR() {
    const tbrShelf = document.getElementById("tbr-shelf");
    if (!tbrShelf) return;
    tbrShelf.innerHTML = "";
    const seriesGroups = groupBooksBySeries(tbr);
    Object.keys(seriesGroups).forEach(series => {
        const seriesBooks = seriesGroups[series];
        const seriesDiv = document.createElement("div");
        seriesDiv.className = "series-group";
        seriesDiv.innerHTML = `
            <div class="series-header">
                <h4>${series}</h4>
                <span class="toggle-icon">▼</span>
            </div>
            <div class="series-books shelf">
                ${seriesBooks.map(book => `
                    <div class="book">
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
                    </div>
                `).join('')}
            </div>
        `;
        const header = seriesDiv.querySelector(".series-header");
        const bookList = seriesDiv.querySelector(".series-books");
        header.addEventListener("click", () => {
            bookList.classList.toggle("expanded");
            const icon = header.querySelector(".toggle-icon");
            icon.textContent = bookList.classList.contains("expanded") ? "▲" : "▼";
        });
        tbrShelf.appendChild(seriesDiv);
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
        const genreBooks = books.filter(book => book.genre === genre);
        const seriesGroups = groupBooksBySeries(genreBooks.map(book => book.name));
        const shelf = document.createElement("div");
        shelf.className = "shelf";
        Object.keys(seriesGroups).forEach(series => {
            const seriesBooks = seriesGroups[series];
            const seriesDiv = document.createElement("div");
            seriesDiv.className = "series-group";
            seriesDiv.innerHTML = `
                <div class="series-header">
                    <h4>${series}</h4>
                    <span class="toggle-icon">▼</span>
                </div>
                <div class="series-books shelf">
                    ${seriesBooks.map(book => `
                        <div class="book">
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
                        </div>
                    `).join('')}
                </div>
            `;
            const header = seriesDiv.querySelector(".series-header");
            const bookList = seriesDiv.querySelector(".series-books");
            header.addEventListener("click", () => {
                bookList.classList.toggle("expanded");
                const icon = header.querySelector(".toggle-icon");
                icon.textContent = bookList.classList.contains("expanded") ? "▲" : "▼";
            });
            shelf.appendChild(seriesDiv);
        });
        genreSection.appendChild(shelf);
        genreShelves.appendChild(genreSection);
        toggleSectionVisibility(genreSection, genreBooks.length);
    });
}

function groupBooksBySeries(bookNames) {
    const seriesGroups = {};
    bookNames.forEach(bookName => {
        const book = books.find(b => b.name === bookName);
        if (book) {
            const series = book.series || "Standalone";
            if (!seriesGroups[series]) {
                seriesGroups[series] = [];
            }
            seriesGroups[series].push(book);
        }
    });
    // Sort books within each series by title (to mimic episode ordering)
    Object.keys(seriesGroups).forEach(series => {
        seriesGroups[series].sort((a, b) => a.title.localeCompare(b.title));
    });
    return seriesGroups;
}

function toggleTBR(bookName) {
    if (tbr.includes(bookName)) {
        tbr = tbr.filter(name => name !== bookName);
    } else {
        tbr.push(bookName);
    }
    localStorage.setItem("tbr", JSON.stringify(tbr));
    displayLiked();
    displayTBR();
    displayGenres();
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

function toggleSectionVisibility(sectionId, itemCount) {
    const section = typeof sectionId === "string" ? document.getElementById(sectionId) : sectionId;
    if (section) {
        section.style.display = itemCount > 0 ? "block" : "none";
    }
}