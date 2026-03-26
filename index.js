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

    // IssueNumber setup
    let seq = 1;
    const d = new Date();
    const dateStr = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;

    // Sort ascending
    blocks.sort((a, b) => a.number - b.number);

    blocks.forEach((block) => {
      const numberStr = String(block.number || 0);
      const timestamp = new Date(block.timestamp);

      // ✅ exact second = 54 only
      if (timestamp.getSeconds() !== 54) return;

      // ✅ prevent duplicates
      if (existingNumbers.has(numberStr)) return;
      existingNumbers.add(numberStr);

      // 🔹 Last digit logic
      const lastDigit = block.number % 10;
      const BS = lastDigit <= 4 ? "S" : "B";
      const Color = lastDigit <= 4 ? "Green" : "Red";

      // 🔹 IssueNumber (1 → 1440 reset)
      const IssueNumber = `${dateStr}0123${String(seq).padStart(4,"0")}`;
      seq = seq < 1440 ? seq + 1 : 1;

      // 🔹 Human-readable timestamp
      const humanTimestamp = timestamp.getFullYear() + "-" +
        String(timestamp.getMonth()+1).padStart(2,"0") + "-" +
        String(timestamp.getDate()).padStart(2,"0") + " " +
        String(timestamp.getHours()).padStart(2,"0") + ":" +
        String(timestamp.getMinutes()).padStart(2,"0") + ":" +
        String(timestamp.getSeconds()).padStart(2,"0");

      // ✅ Final push (all fields)
      result.push({
        IssueNumber,
        Blocknumber: block.number,
        hash: block.hash,
        timestamp: humanTimestamp,
        Lastdigit: lastDigit,
        "B/S": BS,
        Color
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

// Root
app.get("/", (req, res) => res.send("TRON API running 🚀"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
