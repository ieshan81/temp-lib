document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const uploadStatus = document.getElementById('uploadStatus');
    uploadStatus.textContent = 'Uploading...';
  
    const formData = new FormData(e.target);
    
    // Construct filename based on Title and Author (replace spaces with underscores)
    const title = formData.get('title').trim().replace(/\s+/g, '_');
    const author = formData.get('author').trim().replace(/\s+/g, '_');
    const filename = `${title}-${author}.pdf`;
    formData.append('filename', filename);
  
    try {
      const response = await fetch('/.netlify/functions/upload-book', {
        method: 'POST',
        body: formData
      });
      const result = await response.json();
      if (response.ok) {
        uploadStatus.textContent = 'Upload successful!';
      } else {
        uploadStatus.textContent = 'Upload failed: ' + result.message;
      }
    } catch (error) {
      uploadStatus.textContent = 'Upload error: ' + error.message;
    }
  });
  