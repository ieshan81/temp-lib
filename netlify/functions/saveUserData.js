const { Octokit } = require("@octokit/rest");

exports.handler = async (event) => {
  const { userData } = JSON.parse(event.body);
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

  try {
    await octokit.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_USER,
      repo: "books-repo",
      path: `users/${userData.userID}.json`,
      message: `Update user data for ${userData.email}`,
      content: Buffer.from(JSON.stringify(userData)).toString('base64'),
      sha: await getExistingSha(userData.userID)
    });

    return { statusCode: 200, body: "Data saved" };
  } catch (error) {
    return { statusCode: 500, body: error.toString() };
  }

  async function getExistingSha(userID) {
    try {
      const { data } = await octokit.repos.getContent({
        owner: process.env.GITHUB_USER,
        repo: "books-repo",
        path: `users/${userID}.json`
      });
      return data.sha;
    } catch {
      return null;
    }
  }
};