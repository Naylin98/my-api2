import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());

// 🔹 Global memory
let history = [];

// 🔹 Fetch & update function
async function updateBlocks() {
  try {
    const url = "https://apilist.tronscanapi.com/api/block?sort=-number&start=0&limit=50";
    const response = await fetch(url);
    if (!response.ok) return;

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

      if (existingNumbers.has(block.number)) return;

      const digits = (block.hash || "").replace(/\D/g, "");
      if (!digits) return;

      const last = parseInt(digits.slice(-1)); // ✅ final digit (0-9)
      const BS = last <= 4 ? "S" : "B";
      let color = "";

      if (last === 0 || last === 5) color = "ခရမ်း";
      else if ([1,3,7,9].includes(last)) color = "အစိမ်း";
      else if ([2,4,6,8].includes(last)) color = "အနီ";

      const IssueNumber = `${dateStr}10301${String(seq).padStart(4,"0")}`;
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
        Lastdigit: last,
        "B/S": BS,
        Color: color
      });
    });

    // 🔹 newest on top
    history = [...newData, ...history];

    // 🔹 keep only 1000
    history = history.slice(0, 1000);

    console.log("Updated:", newData.length, "new blocks");

  } catch (err) {
    console.error("Update error:", err.message);
  }
}

// 🔥 Auto refresh every 3 seconds
setInterval(updateBlocks, 3000);

// First run immediately
updateBlocks();

// 🔹 API endpoint with manual seq override
app.get("/api/blocks54", (req, res) => {
  const manualSeq = parseInt(req.query.seq); // ?seq=1234 override starting point
  let seqCounter = !isNaN(manualSeq) ? manualSeq : null;

  const data = history.map((item, index) => {
    let seqNumber;

    if (seqCounter !== null) {
      seqNumber = seqCounter % 10000; // rollover 0000-9999
      seqCounter++;
    } else {
      seqNumber = parseInt(item.IssueNumber.slice(-4));
    }

    const newIssueNumber = item.IssueNumber.slice(0, -4) + String(seqNumber).padStart(4,"0");

    return { ...item, IssueNumber: newIssueNumber };
  });

  res.json({
    total: data.length,
    data
  });
});

  res.json({
    total: data.length,
    data
  });
});

// Root
app.get("/", (req, res) => res.send("TRON API running 🚀"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
