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
                synopsis: shortenSynopsis(details.synopsis || "No synopsis available.", 50),
                genre: details.genre || "Unknown",
                series: details.series || inferSeries(title, details.synopsis),
                pages: details.pages || "Unknown",
                year: details.year || "Unknown",
                authors: details.authors || "Unknown"
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
            const series = doc.series ? doc.series[0] : null;
            const pages = doc.number_of_pages || null;
            const year = doc.first_publish_year || null;
            const authors = doc.author_name ? doc.author_name.join(", ") : null;
            if (cover) return { cover, synopsis, genre, series, pages, year, authors };
        }

        const googleResponse = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(title)}`);
        if (!googleResponse.ok) throw new Error(`Google Books API error: ${googleResponse.statusText}`);
        const googleData = await googleResponse.json();
        if (googleData.items && googleData.items.length > 0) {
            const item = googleData.items[0];
            const cover = item.volumeInfo.imageLinks?.thumbnail?.replace("http://", "https://") || null;
            const synopsis = item.volumeInfo.description || null;
            const genre = item.volumeInfo.categories ? item.volumeInfo.categories[0] : null;
            const series = item.volumeInfo.series || null;
            const pages = item.volumeInfo.pageCount || null;
            const year = item.volumeInfo.publishedDate ? item.volumeInfo.publishedDate.split("-")[0] : null;
            const authors = item.volumeInfo.authors ? item.volumeInfo.authors.join(", ") : null;
            return { cover, synopsis, genre, series, pages, year, authors };
        }

        return { cover: null, synopsis: null, genre: null, series: null, pages: null, year: null, authors: null };
    } catch (error) {
        console.error(`Error fetching details for ${title}:`, error);
        return { cover: null, synopsis: null, genre: null, series: null, pages: null, year: null, authors: null };
    }
}

function inferSeries(title, synopsis) {
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
    return "Standalone";
}

function shortenSynopsis(synopsis, wordLimit = 30) {
    const words = synopsis.split(/\s+/);
    if (words.length <= wordLimit) return synopsis;
    return words.slice(0, wordLimit).join(" ") + "...";
}

function displayLiked() {
    const likedShelf = document.getElementById("liked-shelf");
    if (!likedShelf) return;
    likedShelf.innerHTML = "";
    const seriesGroups = groupBooksBySeries(liked);
    Object.keys(seriesGroups).forEach(series => {
        const seriesBooks = seriesGroups[series];
        const firstBook = seriesBooks[0];
        const seriesDiv = document.createElement("div");
        seriesDiv.className = "series-group";
        seriesDiv.innerHTML = `
            <div class="series-header">
                <h3>${series}</h3>
                <div class="series-meta">
                    <span>${firstBook.year || "Unknown"}</span> | 
                    <span>${seriesBooks.length} Book${seriesBooks.length > 1 ? "s" : ""}</span> | 
                    <span>${firstBook.genre || "Unknown"}</span>
                </div>
                <p class="series-synopsis">${firstBook.synopsis}</p>
                <p class="series-authors">Authors: ${firstBook.authors || "Unknown"}</p>
                <button class="play-btn" onclick="window.location.href='reader.html?book=${encodeURIComponent(firstBook.name)}'">Play</button>
            </div>
            <div class="series-books">
                ${seriesBooks.map((book, index) => `
                    <div class="episode">
                        <span class="episode-number">${index + 1}</span>
                        <img src="${book.cover}" alt="${book.title}" onerror="this.src='assets/placeholder.jpg'">
                        <div class="episode-details">
                            <h4>${book.title}</h4>
                            <p>${book.synopsis}</p>
                        </div>
                        <span class="episode-duration">${book.pages ? book.pages + " pages" : "Unknown"}</span>
                        <div class="episode-buttons">
                            <button class="like-btn ${liked.includes(book.name) ? 'liked' : ''}" onclick="removeFromLiked('${book.name}'); event.stopPropagation();">
                                <i class="fas fa-heart"></i>
                            </button>
                            <button onclick="toggleTBR('${book.name}'); event.stopPropagation();">${tbr.includes(book.name) ? "Remove from TBR" : "Add to TBR"}</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
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
        const firstBook = seriesBooks[0];
        const seriesDiv = document.createElement("div");
        seriesDiv.className = "series-group";
        seriesDiv.innerHTML = `
            <div class="series-header">
                <h3>${series}</h3>
                <div class="series-meta">
                    <span>${firstBook.year || "Unknown"}</span> | 
                    <span>${seriesBooks.length} Book${seriesBooks.length > 1 ? "s" : ""}</span> | 
                    <span>${firstBook.genre || "Unknown"}</span>
                </div>
                <p class="series-synopsis">${firstBook.synopsis}</p>
                <p class="series-authors">Authors: ${firstBook.authors || "Unknown"}</p>
                <button class="play-btn" onclick="window.location.href='reader.html?book=${encodeURIComponent(firstBook.name)}'">Play</button>
            </div>
            <div class="series-books">
                ${seriesBooks.map((book, index) => `
                    <div class="episode">
                        <span class="episode-number">${index + 1}</span>
                        <img src="${book.cover}" alt="${book.title}" onerror="this.src='assets/placeholder.jpg'">
                        <div class="episode-details">
                            <h4>${book.title}</h4>
                            <p>${book.synopsis}</p>
                        </div>
                        <span class="episode-duration">${book.pages ? book.pages + " pages" : "Unknown"}</span>
                        <div class="episode-buttons">
                            <button class="like-btn ${liked.includes(book.name) ? 'liked' : ''}" onclick="addToLiked('${book.name}'); event.stopPropagation();">
                                <i class="fas fa-heart"></i>
                            </button>
                            <button onclick="removeFromTBR('${book.name}'); event.stopPropagation();">Remove</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
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
        genreSection.innerHTML = `<h2>${genre}</h2>`;
        const genreBooks = books.filter(book => book.genre === genre);
        const seriesGroups = groupBooksBySeries(genreBooks.map(book => book.name));
        Object.keys(seriesGroups).forEach(series => {
            const seriesBooks = seriesGroups[series];
            const firstBook = seriesBooks[0];
            const seriesDiv = document.createElement("div");
            seriesDiv.className = "series-group";
            seriesDiv.innerHTML = `
                <div class="series-header">
                    <h3>${series}</h3>
                    <div class="series-meta">
                        <span>${firstBook.year || "Unknown"}</span> | 
                        <span>${seriesBooks.length} Book${seriesBooks.length > 1 ? "s" : ""}</span> | 
                        <span>${firstBook.genre || "Unknown"}</span>
                    </div>
                    <p class="series-synopsis">${firstBook.synopsis}</p>
                    <p class="series-authors">Authors: ${firstBook.authors || "Unknown"}</p>
                    <button class="play-btn" onclick="window.location.href='reader.html?book=${encodeURIComponent(firstBook.name)}'">Play</button>
                </div>
                <div class="series-books">
                    ${seriesBooks.map((book, index) => `
                        <div class="episode">
                            <span class="episode-number">${index + 1}</span>
                            <img src="${book.cover}" alt="${book.title}" onerror="this.src='assets/placeholder.jpg'">
                            <div class="episode-details">
                                <h4>${book.title}</h4>
                                <p>${book.synopsis}</p>
                            </div>
                            <span class="episode-duration">${book.pages ? book.pages + " pages" : "Unknown"}</span>
                            <div class="episode-buttons">
                                <button class="like-btn ${liked.includes(book.name) ? 'liked' : ''}" onclick="addToLiked('${book.name}'); event.stopPropagation();">
                                    <i class="fas fa-heart"></i>
                                </button>
                                <button onclick="toggleTBR('${book.name}'); event.stopPropagation();">${tbr.includes(book.name) ? "Remove from TBR" : "Add to TBR"}</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            genreSection.appendChild(seriesDiv);
        });
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