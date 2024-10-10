// api/trello-webhook.js
const axios = require("axios");

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  if (req.method === "POST") {
    const action = req.body.action;

    // Check if the action is a card moving to the "done" list
    if (action.type === "updateCard" && action.data.listAfter.name === "Done") {
      const cardName = action.data.card.name;

      // Check if the card name matches your criteria
      if (isRelevantCard(cardName)) {
        console.log(`Triggering action for card: ${cardName}`);

        // Trigger the GitHub Action
        await triggerGitHubAction();
      }
    }

    return res.sendStatus(200);
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

function isRelevantCard(cardName) {
  // Define your criteria for the cards that should trigger the action
  const relevantCards = ["Card A", "Card B"]; // Add your relevant card names here
  return relevantCards.includes(cardName);
}

async function triggerGitHubAction() {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Use environment variable for security
  const GITHUB_REPO = "playstore777/YOUR_REPO"; // Change this to your GitHub repository
  const WORKFLOW_ID = "video-generation.yml"; // Your GitHub Actions workflow file

  try {
    await axios.post(
      `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${WORKFLOW_ID}/dispatches`,
      {
        ref: "main", // Change if your default branch is different
      },
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );
    console.log("GitHub Action triggered successfully");
  } catch (error) {
    console.error("Error triggering GitHub Action:", error);
  }
}

module.exports = handler;
