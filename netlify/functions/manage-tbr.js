const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS)),
  });
}

const db = admin.firestore();

exports.handler = async (event, context) => {
  try {
    // Get the user from the context (provided by Netlify Identity)
    const user = context.clientContext?.user;
    if (!user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Unauthorized: No user found" }),
      };
    }

    // Hardcode userId for testing
    const userId = "users123"; // Temporary for testing; revert to user.sub later
    // const userId = user.sub; // Uncomment this in production

    const userRef = db.collection('users').doc(userId);

    // Generate a Firebase custom token for the user
    const customToken = await admin.auth().createCustomToken(userId);

    // Handle different HTTP methods
    if (event.httpMethod === "GET") {
      // Fetch the user's data from Firestore
      const doc = await userRef.get();
      if (!doc.exists) {
        // User doesn't exist, create a new document
        await userRef.set({ tbr: [], liked: [] });
        return {
          statusCode: 200,
          body: JSON.stringify({
            tbr: [],
            liked: [],
            customToken: customToken,
          }),
        };
      }
      const data = doc.data();
      return {
        statusCode: 200,
        body: JSON.stringify({
          tbr: data.tbr || [],
          liked: data.liked || [],
          customToken: customToken,
        }),
      };
    } else if (event.httpMethod === "POST") {
      // Update the user's TBR and/or Liked lists
      const { tbr, liked } = JSON.parse(event.body);

      const updateData = {};
      if (tbr !== undefined) {
        if (!Array.isArray(tbr)) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: "Invalid TBR data: must be an array" }),
          };
        }
        updateData.tbr = tbr;
      }
      if (liked !== undefined) {
        if (!Array.isArray(liked)) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: "Invalid Liked data: must be an array" }),
          };
        }
        updateData.liked = liked;
      }

      // Update or create the user's document in Firestore
      await userRef.set(updateData, { merge: true });

      // Fetch the updated data
      const updatedDoc = await userRef.get();
      const updatedData = updatedDoc.data();

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "User data updated successfully",
          tbr: updatedData.tbr || [],
          liked: updatedData.liked || [],
          customToken: customToken,
        }),
      };
    } else {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method not allowed" }),
      };
    }
  } catch (error) {
    console.error("Error in manage-tbr:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};