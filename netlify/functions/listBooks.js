const { Octokit } = require("@octokit/rest");

exports.handler = async (event) => {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  
  try {
    const { data } = await octokit.repos.getContent({
      owner: process.env.GITHUB_USER,
      repo: "books-repo",
      path: "books"
    });

    const books = data.filter(item => item.name.endsWith('.pdf')).map(book => ({
      title: book.name.replace(/_/g, ' ').replace('.pdf', ''),
      path: book.download_url,
      author: book.name.split('-')[1]?.replace(/_/g, ' ') || 'Unknown',
      genre: 'General'
    }));

    return {
      statusCode: 200,
      body: JSON.stringify(books)
    };
  } catch (error) {
    return { statusCode: 500, body: error.toString() };
  }
};