import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  // Log the request body for debugging
  console.log("Received Trello Webhook:", req.body);

  const action = req.body.action;

  // Check if the card was moved to "Done"
  if (action.type === "updateCard" && action.data.list.name === "Done") {
    const cardName = action.data.card.name;
    console.log(`Card moved to Done: ${cardName}`);

    // Check if the card name matches your criteria
    if (isRelevantCard(cardName)) {
      try {
        // Trigger the GitHub Action
        await triggerGitHubAction(req.body);
        res.status(200).send("Webhook received and GitHub Action triggered!");
      } catch (error) {
        res.status(500).send("Error triggering GitHub Action");
      }
    } else {
      res.status(200).send("Card not relevant, no action taken");
    }
  } else {
    res.status(200).send("Card not moved to Done");
  }
}

function isRelevantCard(cardName) {
  // Define your criteria for the cards that should trigger the action
  const relevantCards = ["Card A", "Card B"]; // Add your relevant card names here
  return relevantCards.includes(cardName);
}

const triggerGitHubAction = async (body) => {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Use environment variable for security
  const GITHUB_REPO = "AdilSharif5/trello-video-generator"; // Change this to your GitHub repository
  const WORKFLOW_ID = "video-generation.yml"; // Your GitHub Actions workflow file

  try {
    await axios.post(
      `https://api.github.com/repos/${GITHUB_REPO}/dispatches`,
      {
        event_type: "trigger_build",
        client_payload: {
          action: "card moved", // your custom input
          card: body.card, // any other relevant data
        },
      },
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );
    console.log("GitHub Action completed successfully");
  } catch (error) {
    console.error("Error triggering GitHub Action:", error);
    throw error; // Re-throw to send 500 response
  }

  console.log("GitHub Action triggered");
};
