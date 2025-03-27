document.addEventListener("DOMContentLoaded", () => {
    const loginBtn = document.getElementById("login-btn");
    const signupBtn = document.getElementById("signup-btn");
    const logoutBtn = document.getElementById("logout-btn");
    const loginMessage = document.getElementById("login-message");

    if (!loginBtn || !signupBtn || !logoutBtn || !loginMessage) {
        console.error("One or more login elements not found in the DOM.");
        return;
    }

    // Initialize Netlify Identity
    if (window.netlifyIdentity) {
        netlifyIdentity.on("init", user => {
            if (user) {
                loginMessage.textContent = `Welcome back, ${user.user_metadata.full_name || user.email}!`;
                loginBtn.style.display = "none";
                signupBtn.style.display = "none";
                logoutBtn.style.display = "inline-block";
                setTimeout(() => window.location.href = "home.html", 2000);
            }
        });

        netlifyIdentity.on("login", user => {
            loginMessage.textContent = `Logged in as ${user.user_metadata.full_name || user.email}`;
            loginBtn.style.display = "none";
            signupBtn.style.display = "none";
            logoutBtn.style.display = "inline-block";
            netlifyIdentity.close();
            window.location.href = "home.html";
        });

        netlifyIdentity.on("logout", () => {
            loginMessage.textContent = "You have been logged out.";
            loginBtn.style.display = "inline-block";
            signupBtn.style.display = "inline-block";
            logoutBtn.style.display = "none";
        });
    } else {
        console.error("Netlify Identity widget not loaded.");
        loginMessage.textContent = "Authentication service unavailable. Please try again later.";
    }

    loginBtn.addEventListener("click", () => {
        netlifyIdentity.open("login");
    });

    signupBtn.addEventListener("click", () => {
        netlifyIdentity.open("signup");
    });

    logoutBtn.addEventListener("click", () => {
        netlifyIdentity.logout();
    });
});