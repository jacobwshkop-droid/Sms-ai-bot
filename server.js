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
