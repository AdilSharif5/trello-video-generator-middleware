export default async function handler(req, res) {
  // Handle GET and HEAD requests (Trello's webhook validation)
  if (req.method === "GET" || req.method === "HEAD") {
    res.setHeader("Content-Type", "application/json");
    res.status(200).send("Webhook verified"); // Respond with 200 status for Trello validation
    console.log(`${req.method} verification successful`);
    return;
  }

  if (req.method === "POST") {
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
  // If the method is not GET, HEAD, or POST, return 405 Method Not Allowed
  res.setHeader("Allow", ["POST", "GET", "HEAD"]);
  return res.status(405).send(`Method ${req.method} Not Allowed`);
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
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_type: "trigger_build", // This must match the GitHub Action workflow trigger
          client_payload: {
            action: "card moved", // Optional: You can pass any additional data about the Trello event here
            card: body.card,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub Action failed: ${response.statusText}`);
    }
    console.log("GitHub Action completed successfully");
  } catch (error) {
    console.error("Error triggering GitHub Action:", error);
    throw error; // Re-throw to send 500 response
  }

  console.log("GitHub Action triggered");
};
