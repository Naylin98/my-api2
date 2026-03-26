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

    // Optional query param for tolerance
    const tolerance = parseFloat(req.query.tolerance) || 10; // wider tolerance

    let seq = 1;
    const d = new Date();
    const dateStr = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;

    const result = [];

    for (let i = 1; i < blocks.length; i++) {
      const prev = blocks[i-1];
      const curr = blocks[i];
      const diff = Math.abs(prev.timestamp - curr.timestamp) / 1000;

      // Debug log: block interval
      console.log(`Block ${curr.number} diff: ${diff}s`);

      // 🔹 54 sec ± tolerance
      if (diff === 54) {
        const lastDigit = curr.number % 10;
        const BS = lastDigit <= 4 ? "S" : "B";
        const Color = lastDigit <= 4 ? "Green" : "Red";

        const IssueNumber = `${dateStr}0123${String(seq).padStart(4,"0")}`;
        seq = seq < 1440 ? seq + 1 : 1;

        const ts = new Date(curr.timestamp);
    const humanTimestamp = `${ts.getFullYear()}-${String(ts.getMonth()+1).padStart(2,"0")}-${String(ts.getDate()).padStart(2,"0")} ${String(ts.getHours()).padStart(2,"0")}:${String(ts.getMinutes()).padStart(2,"0")}:${String(ts.getSeconds()).padStart(2,"0")}`;

    result.push({
      IssueNumber,
      Blocknumber: curr.number,
      hash: curr.hash,
      timestamp: humanTimestamp, // 🔹 human readable
      Lastdigit: lastDigit,
      "B/S": BS,
      Color
    });
      }
    }

    // If result is empty, fallback: return all blocks for testing
    if (result.length === 0) {
      console.log("No 54-sec blocks found, returning latest blocks for testing...");
      for (let i = 0; i < blocks.length; i++) {
        const lastDigit = blocks[i].number % 10;
        result.push({
          IssueNumber: `${dateStr}0123${String(i+1).padStart(4,"0")}`,
          Blocknumber: blocks[i].number,
          hash: blocks[i].hash,
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

app.get("/", (req,res) => res.send("TRON API running 🚀"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
