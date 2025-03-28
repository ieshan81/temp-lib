document.addEventListener('DOMContentLoaded', () => {
    if (window.netlifyIdentity) {
      netlifyIdentity.on('init', user => {
        if (!user) {
          console.log("No user detected, redirecting to login...");
          window.location.href = 'index.html';
        } else {
          console.log("User is logged in:", user.id);
          // Initialize Supabase client with the correct Anon Key
          const supabase = Supabase.createClient(
            'https://foygwxdyminhqbytoeqy.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZveWd3eGR5bWluaHFieXRvZXF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxNjYzODQsImV4cCI6MjA1ODc0MjM8NH0.McDPjN3H4R7l6gVEaWTMzMgmqSjsdCvZY-7tY4NC8xE'
          );
  
          // Fetch the hardcoded "users123" data
          loadUserData(supabase);
        }
      });
  
      // Handle logout
      const logoutBtn = document.getElementById('logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          netlifyIdentity.logout();
          window.location.href = 'index.html';
        });
      }
    } else {
      console.error("Netlify Identity widget not loaded");
      window.location.href = 'index.html';
    }
  });
  
  async function loadUserData(supabase) {
    try {
      console.log("Attempting to fetch data for user 'users123' from Supabase...");
      // Fetch data for "users123" from Supabase
      const { data, error } = await supabase
        .from('users')
        .select('liked, tbr')
        .eq('id', 'users123')
        .single();
  
      if (error) {
        console.error("Supabase fetch error:", error);
        throw error;
      }
  
      if (data) {
        console.log("User data for users123:", data);
        displayTBR(data.tbr || []);
        displayLiked(data.liked || []);
      } else {
        console.log("No user data found for users123 in Supabase.");
        const tbrShelf = document.getElementById('tbr-shelf');
        const likedShelf = document.getElementById('liked-shelf');
        if (tbrShelf) tbrShelf.innerHTML = '<p>No TBR data found.</p>';
        if (likedShelf) likedShelf.innerHTML = '<p>No Liked data found.</p>';
      }
    } catch (error) {
      console.error("Error getting user data:", error.message);
      const tbrShelf = document.getElementById('tbr-shelf');
      const likedShelf = document.getElementById('liked-shelf');
      if (tbrShelf) tbrShelf.innerHTML = '<p>Error loading TBR data: ' + error.message + '</p>';
      if (likedShelf) likedShelf.innerHTML = '<p>Error loading Liked data: ' + error.message + '</p>';
    }
  }
  
  function displayTBR(tbrList) {
    const tbrShelf = document.getElementById('tbr-shelf');
    if (tbrShelf) {
      tbrShelf.innerHTML = ''; // Clear previous content
      if (tbrList.length === 0) {
        tbrShelf.innerHTML = '<p>No books in TBR.</p>';
      } else {
        const ul = document.createElement('ul');
        tbrList.forEach(book => {
          const li = document.createElement('li');
          li.textContent = book;
          ul.appendChild(li);
        });
        tbrShelf.appendChild(ul);
      }
    }
  }
  
  function displayLiked(likedList) {
    const likedShelf = document.getElementById('liked-shelf');
    if (likedShelf) {
      likedShelf.innerHTML = ''; // Clear previous content
      if (likedList.length === 0) {
        likedShelf.innerHTML = '<p>No liked books.</p>';
      } else {
        const ul = document.createElement('ul');
        likedList.forEach(book => {
          const li = document.createElement('li');
          li.textContent = book;
          ul.appendChild(li);
        });
        likedShelf.appendChild(ul);
      }
    }
  }