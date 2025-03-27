document.addEventListener('DOMContentLoaded', async () => {
    const bookGrid = document.getElementById('bookGrid');
    const search = document.getElementById('search');
  
    // Fetch books
    const books = await (await fetch('/.netlify/functions/listBooks')).json();
  
    // Render books
    const render = (items) => {
      bookGrid.innerHTML = items.map(book => `
        <div class="relative group">
          <div class="book-cover bg-gray-800 rounded-lg aspect-[2/3]">
            <div class="overlay absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
              <button 
                onclick="window.location='book.html?path=${encodeURIComponent(book.path)}'" 
                class="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg"
              >
                Read Now
              </button>
            </div>
          </div>
          <h3 class="mt-2 truncate">${book.title}</h3>
          <p class="text-gray-400 text-sm">${book.author}</p>
        </div>
      `).join('');
    };
  
    // Search functionality
    search.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      render(books.filter(b => 
        b.title.toLowerCase().includes(term) || 
        b.author.toLowerCase().includes(term)
      );
    });
  
    render(books);
  });