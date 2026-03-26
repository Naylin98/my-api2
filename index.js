import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());

app.get("/api/blocks54", async (req, res) => {
  try {
    const url = "https://apilist.tronscanapi.com/api/block?sort=-number&start=0&limit=50";
    const response = await fetch(url);
    if (!response.ok) throw new Error("HTTP error " + response.status);

    const blocks = (await response.json()).data || [];
    const existingNumbers = new Set();
    const result = [];

    // Sort ascending by block number
    blocks.sort((a, b) => a.number - b.number);

    blocks.forEach((block) => {
      const numberStr = String(block.number || 0);
      const timestamp = new Date(block.timestamp);

      // ✅ exact second = 54 only
      if (timestamp.getSeconds() !== 54) return;

      // ✅ prevent duplicates
      if (existingNumbers.has(numberStr)) return;
      existingNumbers.add(numberStr);

      // Human-readable timestamp
      const humanTimestamp = timestamp.getFullYear() + "-" +
        String(timestamp.getMonth()+1).padStart(2,"0") + "-" +
        String(timestamp.getDate()).padStart(2,"0") + " " +
        String(timestamp.getHours()).padStart(2,"0") + ":" +
        String(timestamp.getMinutes()).padStart(2,"0") + ":" +
        String(timestamp.getSeconds()).padStart(2,"0");

      result.push({
        Blocknumber: block.number,
        hash: block.hash,
        timestamp: humanTimestamp
      });
    });

    res.json({
      total: result.length,
      data: result
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Root route
app.get("/", (req, res) => res.send("TRON API running 🚀"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
