const fetch = require('node-fetch');

// WARNING: Hardcoding your GitHub token in your code is insecure.
// Use environment variables in production instead.
const githubToken = "####################";

exports.handler = async (event, context) => {
  // Get the userId from query parameters, e.g., ?userId=USER_ID
  const userId = event.queryStringParameters.userId;
  
  // Get our secret settings (for this example, we assume these are set in environment variables,
  // but you could also hardcode them if absolutely necessary; again, not recommended)
  const repoOwner = process.env.GITHUB_OWNER || "ieshan81";
  const repoName = process.env.GITHUB_REPO || "books-repo";
  
  // Our file path in GitHub where we'll store user data.
  const filePath = `users/${userId}.json`;

  if (!userId) {
    return { statusCode: 400, body: "Missing userId parameter" };
  }

  // Handle GET requests to read user data.
  if (event.httpMethod === "GET") {
    try {
      const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`;
      const response = await fetch(url, {
         headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/vnd.github.v3+json"
         }
      });
      
      if (response.status === 404) {
         // File doesn't exist: return default data.
         return {
           statusCode: 200,
           body: JSON.stringify({ tbr: [], liked: [], progress: {} })
         };
      }
      
      const data = await response.json();
      const content = Buffer.from(data.content, 'base64').toString('utf8');
      
      return {
         statusCode: 200,
         body: content
      };
    } catch (err) {
      return { statusCode: 500, body: "Error: " + err.message };
    }
  } 
  // Handle POST requests to update user data.
  else if (event.httpMethod === "POST") {
    try {
      const newData = event.body; // New user data as JSON string.
      
      // Get the current file's SHA if it exists (for updating).
      const getUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`;
      let sha;
      const getResponse = await fetch(getUrl, {
         headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/vnd.github.v3+json"
         }
      });
      if (getResponse.ok) {
         const getData = await getResponse.json();
         sha = getData.sha;
      }
      
      const contentBase64 = Buffer.from(newData).toString('base64');
      const commitMessage = sha ? "Update user data" : "Create user data file";
      
      const putUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`;
      const putResponse = await fetch(putUrl, {
         method: "PUT",
         headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/vnd.github.v3+json"
         },
         body: JSON.stringify({
           message: commitMessage,
           content: contentBase64,
           sha: sha
         })
      });
      
      if (!putResponse.ok) {
         const errorData = await putResponse.json();
         return { statusCode: putResponse.status, body: JSON.stringify(errorData) };
      }
      
      return { statusCode: 200, body: JSON.stringify({ message: "User data saved" }) };
    } catch (err) {
      return { statusCode: 500, body: "Error: " + err.message };
    }
  } else {
    return { statusCode: 405, body: "Method not allowed" };
  }
};
