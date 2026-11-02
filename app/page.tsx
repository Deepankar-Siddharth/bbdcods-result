"use client";
import { useState } from "react";
import { YEAR_CONFIGS } from "@/config/years";
import { fetchResult } from "@/lib/api";
import { ResultData } from "@/lib/types";

export default function Home() {
  const [yearKey, setYearKey] = useState(YEAR_CONFIGS[0].key);
  const [rollNo, setRollNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const handleSearch = async (overrideRoll?: string) => {
    const r = overrideRoll ?? rollNo;
    if (!r.trim()) {
      setError("Please enter a university roll number.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchResult({ yearKey, rollNo: r });
      setResult(data);
      setRollNo(data.rollNo);
      setHistory((h) => (h.includes(data.rollNo) ? h : [...h, data.rollNo]));
    } catch (e: any) {
      setError(e.message || "Failed to fetch result");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const navigate = (dir: -1 | 1) => {
    if (!result) return;
    const num = parseInt(result.rollNo, 10);
    if (isNaN(num)) return;
    handleSearch(String(num + dir));
  };

  const downloadResult = () => {
    if (!result) return;
    const blob = new Blob([result.rawHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `result_${result.rollNo}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Search Result</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">BDS Year</label>
            <select
              value={yearKey}
              onChange={(e) => setYearKey(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              {YEAR_CONFIGS.map((y) => (
                <option key={y.key} value={y.key}>
                  {y.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">University Roll Number</label>
            <input
              type="text"
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
              placeholder="e.g. 1230321021 or 21"
              className="w-full border rounded px-3 py-2"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => handleSearch()}
              disabled={loading}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Searching..." : "Search Result"}
            </button>
          </div>
        </div>
        {error && <p className="text-red-600 mt-3 text-sm">{error}</p>}
      </section>

      {result && (
        <section className="bg-white p-6 rounded-lg shadow space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Result</h2>
            <div className="space-x-2">
              <button
                onClick={() => navigate(-1)}
                className="px-3 py-1 border rounded hover:bg-gray-100"
              >
                Previous Result
              </button>
              <button
                onClick={() => navigate(1)}
                className="px-3 py-1 border rounded hover:bg-gray-100"
              >
                Next Result
              </button>
              <button
                onClick={downloadResult}
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Download Result
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <p><span className="font-medium">Name:</span> {result.name}</p>
            <p><span className="font-medium">Roll No:</span> {result.rollNo}</p>
            <p><span className="font-medium">Father Name:</span> {result.fatherName}</p>
            <p><span className="font-medium">Course:</span> {result.course}</p>
            <p><span className="font-medium">Session:</span> {result.session}</p>
            <p><span className="font-medium">Status:</span> {result.status}</p>
            <p><span className="font-medium">Total Obt. Marks:</span> {result.totalObtained}</p>
            <p><span className="font-medium">Grand Total Marks:</span> {result.grandTotal}</p>
          </div>

          {result.subjects && result.subjects.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border px-2 py-1">Subject Code</th>
                    <th className="border px-2 py-1">Max / Obtained</th>
                  </tr>
                </thead>
                <tbody>
                  {result.subjects.map((s, i) => {
                    const cells = s.cells || [];
                    const obt = cells[cells.length - 1];
                    const max = cells[cells.length - 2];
                    return (
                      <tr key={i}>
                        <td className="border px-2 py-1 font-medium">{s.code}</td>
                        <td className="border px-2 py-1">{max} / {obt}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <details className="mt-2">
            <summary className="cursor-pointer text-sm text-blue-600">View original result</summary>
            <iframe
              srcDoc={result.rawHtml}
              className="w-full h-[600px] border mt-2"
              title="Original Result"
            />
          </details>
        </section>
      )}
    </div>
  );
}