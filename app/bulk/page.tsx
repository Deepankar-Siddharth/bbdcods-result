"use client";
import { useState } from "react";
import { YEAR_CONFIGS } from "@/config/years";
import { bulkStreamUrl } from "@/lib/api";

export default function BulkPage() {
  const [yearKey, setYearKey] = useState(YEAR_CONFIGS[0].key);
  const [startRoll, setStartRoll] = useState("");
  const [limit, setLimit] = useState(100);
  const [running, setRunning] = useState(false);
  const [checked, setChecked] = useState(0);
  const [collected, setCollected] = useState(0);
  const [currentRoll, setCurrentRoll] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [log, setLog] = useState<string[]>([]);

  const start = () => {
    if (!startRoll.trim()) {
      alert("Enter starting roll number");
      return;
    }
    setRunning(true);
    setChecked(0);
    setCollected(0);
    setResults([]);
    setLog([]);
    const url = bulkStreamUrl(yearKey, startRoll.trim(), limit);
    const es = new EventSource(url);
    es.addEventListener("progress", (e) => {
      const d = JSON.parse((e as MessageEvent).data);
      setChecked(d.checked);
      setCollected(d.collected);
      setCurrentRoll(d.currentRoll);
    });
    es.addEventListener("result", (e) => {
      const d = JSON.parse((e as MessageEvent).data);
      setResults((prev) => {
        const next = [...prev, d.data];
        localStorage.setItem("bbdu_collected_results", JSON.stringify(next));
        return next;
      });
    });
    es.addEventListener("skip", (e) => {
      const d = JSON.parse((e as MessageEvent).data);
      setLog((prev) => [...prev, `Skipped ${d.rollNo}: ${d.reason}`]);
    });
    es.addEventListener("done", (e) => {
      const d = JSON.parse((e as MessageEvent).data);
      setLog((prev) => [...prev, `Done. Checked ${d.checked}, collected ${d.collected}.`]);
      setRunning(false);
      es.close();
    });
    es.onerror = () => {
      setLog((prev) => [...prev, "Connection error / stream ended."]);
      setRunning(false);
      es.close();
    };
  };

  const stop = () => {
    setRunning(false);
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bbdu_bulk_results.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
    if (results.length === 0) return;
    const header = ["Roll No", "Name", "Total Obtained", "Grand Total", "Percentage", "Status"];
    const rows = results.map((r) => {
      const total = parseFloat(r.totalObtained) || 0;
      const grand = parseFloat(r.grandTotal) || 0;
      const pct = grand > 0 ? ((total / grand) * 100).toFixed(2) : "0";
      return [r.rollNo, r.name, r.totalObtained, r.grandTotal, pct, r.status].join(",");
    });
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bbdu_bulk_results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Bulk Result Collection</h2>
        <p className="text-sm text-gray-600 mb-4">
          Authorized access only. Collects consecutive roll numbers. Skips unavailable results. Max 100 by default.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">BDS Year</label>
            <select value={yearKey} onChange={(e) => setYearKey(e.target.value)} className="w-full border rounded px-3 py-2">
              {YEAR_CONFIGS.map((y) => (
                <option key={y.key} value={y.key}>{y.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Starting Roll Number</label>
            <input type="text" value={startRoll} onChange={(e) => setStartRoll(e.target.value)} placeholder="1230321080 or 80" className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Max Results</label>
            <input type="number" value={limit} onChange={(e) => setLimit(parseInt(e.target.value) || 100)} min={1} max={500} className="w-full border rounded px-3 py-2" />
          </div>
          <div className="flex items-end gap-2">
            <button onClick={start} disabled={running} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
              {running ? "Running..." : "Start"}
            </button>
          </div>
        </div>

        {running && (
          <div className="mt-4">
            <p className="text-sm">Checked: {checked} | Collected: {collected} | Current: {currentRoll}</p>
            <div className="w-full bg-gray-200 rounded h-2 mt-2">
              <div className="bg-blue-600 h-2 rounded" style={{ width: `${Math.min(100, (collected / limit) * 100)}%` }} />
            </div>
          </div>
        )}
      </section>

      {results.length > 0 && (
        <section className="bg-white p-6 rounded-lg shadow space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Collected: {results.length}</h3>
            <div className="space-x-2">
              <button onClick={exportJson} className="px-3 py-1 bg-green-600 text-white rounded">Export JSON</button>
              <button onClick={exportCsv} className="px-3 py-1 bg-green-600 text-white rounded">Export CSV</button>
            </div>
          </div>
          <div className="max-h-64 overflow-auto text-xs">
            {log.map((l, i) => <div key={i} className="text-gray-600">{l}</div>)}
          </div>
        </section>
      )}
    </div>
  );
}