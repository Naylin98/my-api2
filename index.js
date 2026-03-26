import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());

// 🔹 Global storage (memory)
let history = []; // store last 1000 records

app.get("/api/blocks54", async (req, res) => {
  try {
    const url = "https://apilist.tronscanapi.com/api/block?sort=-number&start=0&limit=50";
    const response = await fetch(url);
    if (!response.ok) throw new Error("HTTP error " + response.status);

    const blocks = (await response.json()).data || [];
    const existingNumbers = new Set(history.map(x => x.Blocknumber));

    let seq = history.length + 1;
    const d = new Date();
    const dateStr = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;

    const newData = [];

    blocks.forEach((block) => {
      const timestamp = new Date(block.timestamp);

      // ✅ only second = 54
      if (timestamp.getSeconds() !== 54) return;

      // ✅ skip duplicates (already in history)
      if (existingNumbers.has(block.number)) return;

      const lastDigit = block.number % 10;
      const BS = lastDigit <= 4 ? "S" : "B";
      const Color = lastDigit <= 4 ? "Green" : "Red";

      const IssueNumber = `${dateStr}0123${String(seq).padStart(4,"0")}`;
      seq = seq < 1440 ? seq + 1 : 1;

      const humanTimestamp =
        timestamp.getFullYear() + "-" +
        String(timestamp.getMonth()+1).padStart(2,"0") + "-" +
        String(timestamp.getDate()).padStart(2,"0") + " " +
        String(timestamp.getHours()).padStart(2,"0") + ":" +
        String(timestamp.getMinutes()).padStart(2,"0") + ":" +
        String(timestamp.getSeconds()).padStart(2,"0");

      newData.push({
        IssueNumber,
        Blocknumber: block.number,
        hash: block.hash,
        timestamp: humanTimestamp,
        Lastdigit: lastDigit,
        "B/S": BS,
        Color
      });
    });

    // 🔹 Add new data to TOP
    history = [...newData.reverse(), ...history];

    // 🔹 Keep only latest 1000
    history = history.slice(0, 1000);

    res.json({
      total: history.length,
      data: history
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
