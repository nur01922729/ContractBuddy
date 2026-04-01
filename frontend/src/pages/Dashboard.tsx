import { useState } from "react";
import api from "../lib/axios";
import {
  Upload,
  FileText,
  LogOut,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  User,
  Flag,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  MessageCircle,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Download,
} from "lucide-react";

interface Clause {
  clause: string;
  risk: number;
  explanation: string;
}

interface AnalysisResult {
  filename: string;
  analysis: {
    overall_risk: number;
    summary: string;
    top_risks: string[];
    clauses: Clause[];
  };
}

export default function Dashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [jurisdiction, setJurisdiction] = useState("India");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("jurisdiction", jurisdiction);

    try {
      const res = await api.post("/contracts/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.detail || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const riskColor =
    result && result.analysis.overall_risk > 70
      ? "text-red-600"
      : result && result.analysis.overall_risk > 40
        ? "text-amber-600"
        : "text-emerald-600";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <nav className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-2xl">
              <FileText size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                ContractBuddy
              </h1>
              <p className="text-xs text-gray-500 -mt-1">
                India's Personal Legal Guardian
              </p>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Flag size={18} />
              <span>🇮🇳 India Mode</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center font-semibold">
                TS
              </div>
              <div>
                <p className="text-sm font-medium">Test User</p>
                <p className="text-xs text-gray-500">test@example.com</p>
              </div>
            </div>

            <button
              onClick={() => {
                localStorage.removeItem("token");
                window.location.href = "/login";
              }}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 transition"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-8 py-10">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-5xl font-bold text-gray-900">
              Analyze Your Document
            </h2>
            <p className="text-xl text-gray-600 mt-2">
              Upload any legal paper — contract, loan receipt, rent agreement,
              government document
            </p>
          </div>
        </div>

        {/* Upload Card */}
        <div className="bg-white rounded-3xl shadow-xl p-10 mb-12">
          <form onSubmit={handleUpload} className="space-y-8">
            <div className="flex gap-6">
              <div className="flex-1">
                <label className="block text-sm font-semibold mb-3">
                  Jurisdiction
                </label>
                <select
                  value={jurisdiction}
                  onChange={(e) => setJurisdiction(e.target.value)}
                  className="w-full p-5 border-2 border-gray-200 rounded-3xl focus:border-blue-600 outline-none text-lg"
                >
                  <option value="India">🇮🇳 India</option>
                  <option value="USA">🇺🇸 United States</option>
                  <option value="EU">🇪🇺 European Union</option>
                </select>
              </div>
            </div>

            <div
              className="border-4 border-dashed border-blue-200 rounded-3xl p-16 text-center hover:border-blue-400 transition cursor-pointer"
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              <Upload className="mx-auto h-20 w-20 text-blue-400 mb-6" />
              <p className="text-2xl font-semibold text-gray-700">
                Drop your document here
              </p>
              <p className="text-gray-500 mt-3">
                PDF, DOCX, JPG, PNG — scanned or typed
              </p>
              <input
                type="file"
                id="file-upload"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
                accept=".pdf,.docx,.png,.jpg,.jpeg"
              />
              {file && (
                <div className="mt-8 inline-flex items-center gap-3 bg-green-100 text-green-700 px-6 py-3 rounded-3xl">
                  <FileText size={22} />
                  <span className="font-medium">{file.name}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!file || loading}
              className="w-full py-6 text-2xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-3xl hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  Analyzing with AI <span className="animate-pulse">...</span>
                </>
              ) : (
                <>Analyze Document</>
              )}
            </button>
          </form>
        </div>

        {/* Results Section */}
        {result && (
          <div className="grid grid-cols-12 gap-8">
            {/* Risk Overview */}
            <div className="col-span-12 lg:col-span-4">
              <div className="bg-white rounded-3xl shadow-xl p-8 h-full">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold">Risk Score</h3>
                  <div className={`text-7xl font-black ${riskColor}`}>
                    {result.analysis.overall_risk}
                  </div>
                </div>

                <div className="h-3 bg-gray-100 rounded-3xl overflow-hidden mb-8">
                  <div
                    className={`h-3 rounded-3xl transition-all ${result.analysis.overall_risk > 70 ? "bg-red-500" : result.analysis.overall_risk > 40 ? "bg-amber-500" : "bg-emerald-500"}`}
                    style={{ width: `${result.analysis.overall_risk}%` }}
                  ></div>
                </div>

                <p className="text-gray-600 leading-relaxed">
                  {result.analysis.summary}
                </p>

                {result.analysis.top_risks?.length > 0 && (
                  <div className="mt-10">
                    <h4 className="font-semibold mb-4">Top Concerns</h4>
                    <ul className="space-y-3">
                      {result.analysis.top_risks.map((risk, i) => (
                        <li key={i} className="flex gap-3 text-red-600">
                          <span className="text-xl">⚠️</span>
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Detailed Clauses */}
            <div className="col-span-12 lg:col-span-8">
              <div className="bg-white rounded-3xl shadow-xl p-8">
                <h3 className="text-2xl font-bold mb-6">
                  Key Clauses &amp; Risks
                </h3>
                <div className="space-y-6">
                  {result.analysis.clauses &&
                  result.analysis.clauses.length > 0 ? (
                    result.analysis.clauses.map((clause, index) => (
                      <div
                        key={index}
                        className="border border-gray-100 rounded-3xl p-7 hover:shadow transition"
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="font-semibold text-lg">
                            {clause.clause}
                          </h4>
                          <span
                            className={`px-5 py-2 text-sm font-medium rounded-3xl ${clause.risk > 60 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}
                          >
                            Risk {clause.risk}
                          </span>
                        </div>
                        <p className="text-gray-700 mt-4">
                          {clause.explanation}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">
                      No specific clauses detected yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <p className="text-red-600 mt-6 text-center font-medium">{error}</p>
        )}
      </div>
    </div>
  );
}
