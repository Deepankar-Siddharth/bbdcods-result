"use client";
import { useEffect, useState } from "react";
import { RankingEntry } from "@/lib/types";

function computeRankings(results: any[]): RankingEntry[] {
  const entries = results.map((r) => {
    const total = parseFloat(r.totalObtained) || 0;
    const grand = parseFloat(r.grandTotal) || 0;
    const pct = grand > 0 ? (total / grand) * 100 : 0;
    return {
      rollNo: r.rollNo,
      name: r.name || "",
      totalObtained: total,
      grandTotal: grand,
      percentage: pct,
      status: r.status || "",
      rank: 0,
    };
  });
  // sort by total desc, then percentage desc
  entries.sort((a, b) => b.totalObtained - a.totalObtained || b.percentage - a.percentage);
  // tie handling: same total+grand => same rank
  let rank = 0;
  let prevKey = "";
  entries.forEach((e, i) => {
    const key = `${e.totalObtained}|${e.grandTotal}`;
    if (key !== prevKey) {
      rank = i + 1;
      prevKey = key;
    }
    e.rank = rank;
  });
  return entries;
}

export default function RankingPage() {
  const [results, setResults] = useState<any[]>([]);
  const [rankings, setRankings] = useState<RankingEntry[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("bbdu_collected_results");
      if (raw) {
        const parsed = JSON.parse(raw);
        setResults(parsed);
        setRankings(computeRankings(parsed));
      }
    } catch {}
  }, []);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const arr = Array.isArray(parsed) ? parsed : [parsed];
        localStorage.setItem("bbdu_collected_results", JSON.stringify(arr));
        setResults(arr);
        setRankings(computeRankings(arr));
      } catch {
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">Student Ranking</h2>
        <p className="text-sm text-gray-600 mb-4">
          Rankings are computed from collected results stored locally. Import a JSON export or run bulk collection first.
        </p>
        <input type="file" accept="application/json" onChange={handleImport} />
      </section>

      {rankings.length > 0 && (
        <section className="bg-white p-6 rounded-lg shadow overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-2 py-1">Rank</th>
                <th className="border px-2 py-1">Roll No</th>
                <th className="border px-2 py-1">Name</th>
                <th className="border px-2 py-1">Total</th>
                <th className="border px-2 py-1">Grand Total</th>
                <th className="border px-2 py-1">Percentage</th>
                <th className="border px-2 py-1">Status</th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((r) => (
                <tr key={r.rollNo}>
                  <td className="border px-2 py-1 font-bold">{r.rank}</td>
                  <td className="border px-2 py-1">{r.rollNo}</td>
                  <td className="border px-2 py-1">{r.name}</td>
                  <td className="border px-2 py-1">{r.totalObtained}</td>
                  <td className="border px-2 py-1">{r.grandTotal}</td>
                  <td className="border px-2 py-1">{r.percentage.toFixed(2)}%</td>
                  <td className="border px-2 py-1">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}