exports.handler = async (event, context) => {
    const repoUrl = "https://api.github.com/repos/ieshan81/books-repo/contents/pdfs";
    
    try {
        const response = await fetch(repoUrl);
        if (!response.ok) {
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: `GitHub API error: ${response.statusText}` })
            };
        }
        const data = await response.json();
        const books = data.filter(file => file.name.endsWith(".pdf"));
        return {
            statusCode: 200,
            body: JSON.stringify(books)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to fetch books from GitHub" })
        };
    }
};