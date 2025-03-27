document.addEventListener('DOMContentLoaded', () => {
    const netlifyIdentity = window.netlifyIdentity;
    const authBtn = document.getElementById('authBtn');
  
    netlifyIdentity.on('init', user => {
      user ? handleLogin(user) : handleLogout();
    });
  
    netlifyIdentity.on('login', user => {
      handleLogin(user);
      checkDeveloperAccess(user.email);
    });
  
    netlifyIdentity.on('logout', () => {
      handleLogout();
    });
  
    function handleLogin(user) {
      authBtn.textContent = 'Logout';
      localStorage.setItem('user', JSON.stringify({
        id: user.id,
        email: user.email
      }));
    }
  
    function handleLogout() {
      authBtn.textContent = 'Login';
      localStorage.removeItem('user');
    }
  
    async function checkDeveloperAccess(email) {
      const res = await fetch('/devs.json');
      const devs = await res.json();
      if (devs.includes(email)) {
        const devPortal = document.createElement('a');
        devPortal.href = 'dev_uploads.html';
        devPortal.className = 'ml-4 bg-blue-600 px-4 py-2 rounded';
        devPortal.textContent = 'Dev Portal';
        document.querySelector('nav').appendChild(devPortal);
      }
    }
  });