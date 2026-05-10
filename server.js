const express = require("express");
const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const GROK_API_KEY = process.env.GROK_API_KEY;
const PORT = process.env.PORT || 3000;

// Store conversation history per phone number
const conversations = {};

app.post("/sms", async (req, res) => {
  const incomingMsg = req.body.Body?.trim();
  const from = req.body.From;

  if (!incomingMsg) {
    return res.set("Content-Type", "text/xml").send(`<Response><Message>Say something!</Message></Response>`);
  }

  // Initialize conversation history for this number
  if (!conversations[from]) {
    conversations[from] = [];
  }

  // Add user message to history
  conversations[from].push({ role: "user", content: incomingMsg });

  // Keep last 20 messages to avoid token bloat
  if (conversations[from].length > 20) {
    conversations[from] = conversations[from].slice(-20);
  }

  try {
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "grok-3",
        messages: [
          {
            role: "system",
            content: "You are a helpful AI assistant responding via SMS. Keep responses concise and clear — ideally under 300 characters when possible, since this is a text message.",
          },
          ...conversations[from],
        ],
        max_tokens: 300,
      }),
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't get a response.";

    // Add assistant reply to history
    conversations[from].push({ role: "assistant", content: reply });

    res.set("Content-Type", "text/xml");
    res.send(`<Response><Message>${reply}</Message></Response>`);
  } catch (err) {
    console.error("Grok API error:", err);
    res.set("Content-Type", "text/xml");
    res.send(`<Response><Message>Something went wrong. Try again.</Message></Response>`);
  }
});

app.get("/", (req, res) => res.send("SMS AI Bot is running."));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
