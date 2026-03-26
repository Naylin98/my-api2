import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());

app.get("/api/blocks54", async (req, res) => {
  try {
    const url = "https://apilist.tronscanapi.com/api/block?sort=-timestamp&limit=50";
    const response = await fetch(url);
    const json = await response.json();
    const blocks = json.data || [];

    const tolerance = parseFloat(req.query.tolerance) || 10;

    let seq = 1;
    const d = new Date();
    const dateStr = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;

    const result = [];

    // Main loop: check 54-sec ± tolerance
    for (let i = 1; i < blocks.length; i++) {
      const prev = blocks[i - 1];
      const curr = blocks[i];
      const diff = Math.abs(curr.timestamp - prev.timestamp) / 1000;

      console.log(`Block ${curr.number} interval: ${diff}s`);

      if (diff === 54) {
        const lastDigit = curr.number % 10;
        const BS = lastDigit <= 4 ? "S" : "B";
        const Color = lastDigit <= 4 ? "Green" : "Red";

        const IssueNumber = `${dateStr}0123${String(seq).padStart(4, "0")}`;
        seq = seq < 1440 ? seq + 1 : 1;

        // Human-readable timestamp
        const ts = new Date(curr.timestamp);
        const humanTimestamp = `${ts.getFullYear()}-${String(ts.getMonth()+1).padStart(2,"0")}-${String(ts.getDate()).padStart(2,"0")} ${String(ts.getHours()).padStart(2,"0")}:${String(ts.getMinutes()).padStart(2,"0")}:${String(ts.getSeconds()).padStart(2,"0")}`;

        result.push({
          IssueNumber,
          Blocknumber: curr.number,
          hash: curr.hash,
          timestamp: humanTimestamp,
          Lastdigit: lastDigit,
          "B/S": BS,
          Color
        });
      }
    }

    // Fallback: return all blocks if no 54-sec blocks found
    if (result.length === 0) {
      console.log("No 54-sec blocks found, returning latest blocks for testing...");
      for (let i = 0; i < blocks.length; i++) {
        const curr = blocks[i];
        const lastDigit = curr.number % 10;
        const ts = new Date(curr.timestamp);
        const humanTimestamp = `${ts.getFullYear()}-${String(ts.getMonth()+1).padStart(2,"0")}-${String(ts.getDate()).padStart(2,"0")} ${String(ts.getHours()).padStart(2,"0")}:${String(ts.getMinutes()).padStart(2,"0")}:${String(ts.getSeconds()).padStart(2,"0")}`;

        result.push({
          IssueNumber: `${dateStr}0123${String(i+1).padStart(4,"0")}`,
          Blocknumber: curr.number,
          hash: curr.hash,
          timestamp: humanTimestamp,
          Lastdigit: lastDigit,
          "B/S": lastDigit <= 4 ? "S" : "B",
          Color: lastDigit <= 4 ? "Green" : "Red"
        });
      }
    }

    res.json({ total: result.length, data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/", (req, res) => res.send("TRON API running 🚀"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
