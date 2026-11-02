const express = require("express");
const cors = require("cors");
const cheerio = require("cheerio");

const app = express();
const PORT = process.env.PORT || 4000;
const UNIVERSITY_BASE = process.env.UNIVERSITY_BASE || "https://examcell.bbdu.ac.in/bbdudental-result";
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";

app.use(cors({ origin: ALLOWED_ORIGIN, credentials: true }));
app.use(express.json());

// Academic year configs (mirror frontend config/years.ts)
const YEAR_CONFIGS = {
  bds1: { rollPrefix: "12303210", session: "2023-24", year: "1", examYear: "2024", examMonth: "September", examType: "MAIN" },
  bds2: { rollPrefix: "12303210", session: "2024-25", year: "2", examYear: "2025", examMonth: "September", examType: "MAIN" },
  bds3: { rollPrefix: "12303210", session: "2025-26", year: "3", examYear: "2026", examMonth: "September", examType: "MAIN" },
  bds4: { rollPrefix: "12003210", session: "2023-24", year: "4", examYear: "2024", examMonth: "September", examType: "MAIN" },
};

function normalizeRoll(yearKey, input) {
  const cfg = YEAR_CONFIGS[yearKey];
  if (!cfg) throw new Error("Unknown academic year");
  const trimmed = String(input).trim();
  if (/^\d{1,3}$/.test(trimmed)) {
    return cfg.rollPrefix + trimmed.padStart(2, "0");
  }
  return trimmed;
}

// Establish an authorized session and obtain a CSRF token.
async function getSessionAndToken() {
  const cookieJar = {};
  const res = await fetch(`${UNIVERSITY_BASE}/`, { method: "GET" });
  // collect set-cookie
  const setCookie = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  const cookies = setCookie.map((c) => c.split(";")[0]).join("; ");
  const html = await res.text();
  const m = html.match(/name="_token"\s+value="([^"]+)"/);
  if (!m) throw new Error("CSRF token not found on form page");
  return { cookies, token: m[1] };
}

async function fetchResultHtml(yearKey, rollNo) {
  const cfg = YEAR_CONFIGS[yearKey];
  if (!cfg) throw new Error("Unknown academic year");
  const { cookies, token } = await getSessionAndToken();
  const body = new URLSearchParams({
    _token: token,
    urollno: rollNo,
    session: cfg.session,
    year: cfg.year,
    examYear: cfg.examYear,
    examMonth: cfg.examMonth,
    examtype: cfg.examType,
  });
  const res = await fetch(`${UNIVERSITY_BASE}/result-display`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookies,
    },
    body: body.toString(),
    redirect: "follow",
  });
  const html = await res.text();
  if (!res.ok) throw new Error(`University responded ${res.status}`);
  if (html.includes("ErrorException") || html.includes("Whoops")) {
    throw new Error("Result not available for this roll number");
  }
  if (!html.includes("Marks Statement") && !html.includes("Roll No")) {
    throw new Error("Unexpected response from university");
  }
  return html;
}

function parseResult(html, yearKey, rollNo) {
  const $ = cheerio.load(html);
  const text = (sel) => $(sel).first().text().trim();
  // Name / Roll / Status / Father / Branch
  let name, roll, statusExam, fatherName, branch;
  $("p").each((_, el) => {
    const t = $(el).text().replace(/\s+/g, " ").trim();
    const b = $(el).find("b").text().trim();
    if (/^Name\b/.test(t)) name = b;
    else if (/^Roll No/.test(t)) roll = b;
    else if (/^Status/.test(t)) statusExam = b;
    else if (/^Father Name/.test(t)) fatherName = b;
    else if (/^Branch/.test(t)) branch = b;
  });
  // header line: "First Year Marks Statement" and session
  const headerText = $("div.hdr").text().replace(/\s+/g, " ").trim();
  const yearLabelMatch = headerText.match(/(First|Second|Third|Fourth)\s+Year\s+Marks Statement/i);
  const sessionMatch = headerText.match(/(\d{4}-\d{2,4})/);
  // totals
  const totalObtainedMatch = html.match(/Total Obt\.\s*Marks<\/b><br>\s*<span>([^<]+)<\/span>/i);
  const grandTotalMatch = html.match(/Grand Total Marks<\/b><br>\s*<span>([^<]+)<\/span>/i);
  const resultStatusMatch = html.match(/Result<\/b><br>\s*<span>([^<]+)<\/span>/i);
  // subjects: each tr in tbody with td cells
  const subjects = [];
  $("table tbody tr").each((_, tr) => {
    const cells = $(tr).find("td").map((i, td) => $(td).text().trim()).get();
    // Only real subject rows: first cell looks like a subject code (e.g. BDS101)
    if (cells.length >= 10 && /^[A-Za-z]{2,}\d{2,}/.test(cells[0]) ) {
      subjects.push({ code: cells[0], cells });
    }
  });
  // declaration date
  const declMatch = html.match(/Date of Declaration of Result:\s*([\d\/]+)/i);

  return {
    rollNo: roll || rollNo,
    name: name || "",
    fatherName: fatherName || "",
    course: branch || "",
    yearLabel: yearLabelMatch ? yearLabelMatch[0] : "",
    session: sessionMatch ? sessionMatch[1] : YEAR_CONFIGS[yearKey].session,
    examYear: YEAR_CONFIGS[yearKey].examYear,
    examMonth: YEAR_CONFIGS[yearKey].examMonth,
    subjects,
    totalObtained: totalObtainedMatch ? totalObtainedMatch[1].trim() : "",
    grandTotal: grandTotalMatch ? grandTotalMatch[1].trim() : "",
    status: (resultStatusMatch ? resultStatusMatch[1].trim() : "") || statusExam || "",
    declarationDate: declMatch ? declMatch[1].trim() : "",
    rawHtml: html,
    fetchedAt: new Date().toISOString(),
  };
}

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.post("/api/result", async (req, res) => {
  try {
    const { yearKey, rollNo } = req.body || {};
    if (!yearKey || !rollNo) return res.status(400).json({ error: "yearKey and rollNo are required" });
    if (!YEAR_CONFIGS[yearKey]) return res.status(400).json({ error: "Unknown academic year" });
    const normalized = normalizeRoll(yearKey, rollNo);
    const html = await fetchResultHtml(yearKey, normalized);
    const data = parseResult(html, yearKey, normalized);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message || "Failed to fetch result" });
  }
});

// SSE bulk collection
app.get("/api/bulk", async (req, res) => {
  const { yearKey, startRoll, limit } = req.query;
  const max = Math.min(parseInt(limit, 10) || 100, 500);
  if (!yearKey || !YEAR_CONFIGS[yearKey]) {
    res.status(400).json({ error: "Unknown academic year" });
    return;
  }
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders && res.flushHeaders();

  const send = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  let current = normalizeRoll(yearKey, startRoll);
  let collected = 0;
  let checked = 0;
  const collectedResults = [];

  while (collected < max && checked < max * 5) {
    checked++;
    send("progress", { checked, collected, currentRoll: current, done: false });
    try {
      const html = await fetchResultHtml(yearKey, current);
      const data = parseResult(html, yearKey, current);
      collected++;
      collectedResults.push(data);
      send("result", { collected, data });
    } catch (e) {
      send("skip", { rollNo: current, reason: e.message });
    }
    // increment roll number
    const num = parseInt(current, 10);
    if (isNaN(num)) break;
    current = String(num + 1);
    // small delay to be polite
    await new Promise((r) => setTimeout(r, 300));
  }
  send("done", { checked, collected, totalCollected: collectedResults.length });
  res.end();
});

app.listen(PORT, () => console.log(`Backend listening on ${PORT}`));