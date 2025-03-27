const urlParams = new URLSearchParams(window.location.search);
const bookName = urlParams.get("book");
const pdfUrl = `https://raw.githubusercontent.com/ieshan81/books-repo/main/pdfs/${bookName}`;
let pdfDoc = null;
let pageNum = 1;
let pageRendering = false;
let pageNumPending = null;
let twoPageMode = false;
let bookmarks = JSON.parse(localStorage.getItem(`bookmarks_${bookName}`)) || [];

const canvas = document.getElementById("pdf-canvas");
const canvas2 = document.getElementById("pdf-canvas-2");
const ctx = canvas.getContext("2d");
const ctx2 = canvas2.getContext("2d");

// Ensure pdfjsLib is available from the CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

pdfjsLib.getDocument(pdfUrl).promise.then(pdf => {
    pdfDoc = pdf;
    document.getElementById("page-count").textContent = `/ ${pdfDoc.numPages}`;
    renderPage(pageNum);
}).catch(error => console.error("Error loading PDF:", error));

function renderPage(num) {
    pageRendering = true;
    pdfDoc.getPage(num).then(page => {
        const viewport = page.getViewport({ scale: 1.5 });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };
        const renderTask = page.render(renderContext);
        renderTask.promise.then(() => {
            pageRendering = false;
            if (pageNumPending !== null) {
                renderPage(pageNumPending);
                pageNumPending = null;
            }
        });

        if (twoPageMode && num < pdfDoc.numPages) {
            pdfDoc.getPage(num + 1).then(page2 => {
                const viewport2 = page2.getViewport({ scale: 1.5 });
                canvas2.height = viewport2.height;
                canvas2.width = viewport2.width;
                canvas2.classList.remove("hidden");
                page2.render({
                    canvasContext: ctx2,
                    viewport: viewport2
                });
            });
        } else {
            canvas2.classList.add("hidden");
        }
    });
    document.getElementById("page-num").value = num;
}

function queueRenderPage(num) {
    if (pageRendering) {
        pageNumPending = num;
    } else {
        renderPage(num);
    }
}

document.getElementById("prev").addEventListener("click", () => {
    if (pageNum <= 1) return;
    pageNum -= twoPageMode ? 2 : 1;
    if (pageNum < 1) pageNum = 1;
    queueRenderPage(pageNum);
});

document.getElementById("next").addEventListener("click", () => {
    if (pageNum >= pdfDoc.numPages) return;
    pageNum += twoPageMode ? 2 : 1;
    if (pageNum > pdfDoc.numPages) pageNum = pdfDoc.numPages;
    queueRenderPage(pageNum);
});

document.getElementById("page-num").addEventListener("change", e => {
    const num = parseInt(e.target.value);
    if (num >= 1 && num <= pdfDoc.numPages) {
        pageNum = num;
        queueRenderPage(pageNum);
    }
});

document.getElementById("bookmark").addEventListener("click", () => {
    if (!bookmarks.includes(pageNum)) {
        bookmarks.push(pageNum);
        localStorage.setItem(`bookmarks_${bookName}`, JSON.stringify(bookmarks));
        alert(`Bookmarked page ${pageNum}`);
    }
});

document.getElementById("fullscreen").addEventListener("click", () => {
    document.documentElement.requestFullscreen();
});

document.getElementById("one-page").addEventListener("click", () => {
    twoPageMode = false;
    canvas2.classList.add("hidden");
    queueRenderPage(pageNum);
});

document.getElementById("two-page").addEventListener("click", () => {
    twoPageMode = true;
    queueRenderPage(pageNum);
});