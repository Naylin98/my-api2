import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());

app.get("/api/blocks54", async (req, res) => {
  try {
    const url = "https://apilist.tronscanapi.com/api/block?sort=-timestamp&limit=50";
    const response = await fetch(url);
    if (!response.ok) throw new Error("HTTP error " + response.status);
    const json = await response.json();
    const blocks = json.data || [];

    const tolerance = parseFloat(req.query.tolerance) || 1; // ±tolerance seconds
    const existingNumbers = new Set(); // prevent duplicates
    let seq = 1;

    const d = new Date();
    const dateStr = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;

    const result = [];

    for (let i = 1; i < blocks.length; i++) {
      const prev = blocks[i - 1];
      const curr = blocks[i];
      const diff = Math.abs(curr.timestamp - prev.timestamp) / 1000;

      // 🔹 Check 54s ± tolerance
      if (Math.abs(diff - 54) <= tolerance && !existingNumbers.has(curr.number)) {
        existingNumbers.add(curr.number);

        const lastDigit = curr.number % 10;
        const BS = lastDigit <= 4 ? "S" : "B";
        const Color = lastDigit <= 4 ? "Green" : "Red";

        const IssueNumber = `${dateStr}0123${String(seq).padStart(4, "0")}`;
        seq = seq < 1440 ? seq + 1 : 1;

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

    // 🔹 Fallback: return all latest blocks if no 54s blocks found
    if (result.length === 0) {
      for (let i = 0; i < blocks.length; i++) {
        const curr = blocks[i];
        if (existingNumbers.has(curr.number)) continue;
        existingNumbers.add(curr.number);

        const lastDigit = curr.number % 10;
        const ts = new Date(curr.timestamp);
        const humanTimestamp = `${ts.getFullYear()}-${String(ts.getMonth()+1).padStart(2,"0")}-${String(ts.getDate()).padStart(2,"0")} ${String(ts.getHours()).padStart(2,"0")}:${String(ts.getMinutes()).padStart(2,"0")}:${String(ts.getSeconds()).padStart(2,"0")}`;

        result.push({
          IssueNumber: `${dateStr}0123${String(seq).padStart(4,"0")}`,
          Blocknumber: curr.number,
          hash: curr.hash,
          timestamp: humanTimestamp,
          Lastdigit: lastDigit,
          "B/S": lastDigit <= 4 ? "S" : "B",
          Color: lastDigit <= 4 ? "Green" : "Red"
        });
        seq = seq < 1440 ? seq + 1 : 1;
      }
    }

    res.json({ total: result.length, data: result });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Root route
app.get("/", (req, res) => res.send("TRON API running 🚀"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
