document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('uploadForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const fileInput = document.getElementById('bookFile');
        const isbnInput = document.getElementById('bookIsbn');
        const user = JSON.parse(localStorage.getItem('user'));

        if (!fileInput.files[0] || !isbnInput.value) {
            alert('Please fill all fields');
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64Content = event.target.result.split(',')[1];
            
            try {
                const response = await fetch('/.netlify/functions/uploadBook', {
                    method: 'POST',
                    body: JSON.stringify({
                        content: base64Content,
                        filename: `${isbnInput.value}.pdf`,
                        user: user
                    })
                });

                if (response.ok) {
                    alert('Book uploaded successfully!');
                    form.reset();
                } else {
                    alert('Upload failed: ' + await response.text());
                }
            } catch (error) {
                alert('Error: ' + error.message);
            }
        };
        reader.readAsDataURL(fileInput.files[0]);
    });
});

function logout() {
    netlifyIdentity.logout();
    window.location.href = '/';
}