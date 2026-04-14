import { useState, type ReactNode, useEffect } from "react";
import { FileText, Download, X, Shield, Clock, AlertTriangle, CheckCircle2, RefreshCw, Lock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useRole } from "@/context/RoleContext";
import { exportReport, getAssets, getLatestReport } from "@/lib/api";

function buildAssetRecommendations(asset: any) {
  if (!asset) {
    return ["Run a fresh scan for this URL to generate recommendations."];
  }

  const tlsVer = String(asset.tlsVersion || "").toLowerCase();
  const keyExchange = String(asset.keyExchange || "").toLowerCase();
  const certAlgo = String(asset.certificateAlgorithm || "").toLowerCase();
  const keySize = Number(asset.keySize || 0);
  const recommendations: string[] = [];

  if (tlsVer.includes("1.0") || tlsVer.includes("1.1")) {
    recommendations.push("Upgrade endpoint to TLS 1.2 or TLS 1.3 immediately.");
  } else if (tlsVer.includes("1.2")) {
    recommendations.push("TLS 1.2 is acceptable; prefer TLS 1.3 where possible.");
  }

  if (!asset.forwardSecrecy) {
    recommendations.push("Enable forward secrecy with ECDHE or hybrid KEM exchange.");
  }

  if (keyExchange.includes("rsa")) {
    recommendations.push("Migrate from RSA key exchange to hybrid ECDHE + CRYSTALS-Kyber.");
  }

  if (keySize > 0 && keySize < 2048 && keyExchange.includes("rsa")) {
    recommendations.push("Replace weak RSA keys with minimum 3072-bit or PQC-ready alternatives.");
  }

  if (certAlgo.includes("sha-1")) {
    recommendations.push("Reissue certificates using SHA-256+ and plan Dilithium-based signature transition.");
  }

  if (!asset.pqcCompatible) {
    recommendations.push("Run pilot migration to NIST-standardized PQC algorithms (Kyber/Dilithium).");
  }

  if (recommendations.length === 0) {
    recommendations.push("Current configuration is healthy; keep continuous monitoring active.");
  }

  return recommendations;
}

export default function Reports() {
  const [showPreview, setShowPreview] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState("");
  const { isAdmin } = useRole();

  const assetsQuery = useQuery({
    queryKey: ["assets"],
    queryFn: getAssets,
  });

  const reportQuery = useQuery({
    queryKey: ["latest-report"],
    queryFn: getLatestReport,
    retry: false,
  });

  const report = reportQuery.data;
  const scannedAssets = (assetsQuery.data || []).filter((asset) => asset.lastScannedAt);
  const selectedFinding =
    report?.findings?.find((finding) => finding.domain === selectedDomain) || null;
  const selectedAsset =
    scannedAssets.find((asset) => (asset.domain || asset.name) === selectedDomain) ||
    scannedAssets[0] ||
    null;
  const selectedLabel = selectedDomain || selectedFinding?.domain || selectedAsset?.domain || selectedAsset?.name || "Latest Scanned Site";
  const selectedRiskScore = selectedFinding?.riskScore ?? selectedAsset?.riskScore ?? 0;
  const selectedRiskLevel = selectedFinding?.riskLevel || selectedAsset?.riskLevel || "Unknown";
  const selectedTlsVersion = selectedFinding?.tlsVersion || selectedAsset?.tlsVersion || "Unknown";
  const selectedKeyExchange = selectedFinding?.keyExchange || selectedAsset?.keyExchange || "Unknown";
  const selectedCertAlgo = selectedFinding?.certificateAlgorithm || selectedAsset?.certificateAlgorithm || "Unknown";
  const selectedRecommendations =
    selectedFinding?.recommendations?.length
      ? selectedFinding.recommendations
      : buildAssetRecommendations(selectedAsset);
  const avgRisk = report
    ? Math.round(report.findings.reduce((sum, finding) => sum + finding.riskScore, 0) / Math.max(1, report.findings.length))
    : 0;

  const riskLabel = avgRisk > 75 ? "High" : avgRisk > 45 ? "Moderate" : "Low";
  const reportTitle = selectedFinding?.domain
    ? `${selectedFinding.domain} Quantum Readiness Assessment`
    : "Quantum Readiness Assessment";

  const openPreviewForSelected = () => {
    if (!scannedAssets.length && !report?.findings?.length) return;
    setShowPreview(true);
  };

  useEffect(() => {
    if (!selectedDomain) {
      const first = scannedAssets[0]?.domain || scannedAssets[0]?.name || report?.findings?.[0]?.domain || "";
      if (first) {
        setSelectedDomain(first);
      }
    }
  }, [scannedAssets, report?.findings, selectedDomain]);

  // Close modal on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showPreview) {
        setShowPreview(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showPreview]);

  const download = async (format: "json" | "csv" | "xml") => {
    const blob = await exportReport(format);
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = `quantum-report.${format}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  };

  if (reportQuery.isLoading || assetsQuery.isLoading) {
    return (
      <div className="bg-card rounded-lg border p-12 flex items-center justify-center">
        <RefreshCw className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary" />
          Report Generator
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate compliance-ready quantum security assessment reports
        </p>
      </div>

      <div className="bg-card rounded-lg border p-6 space-y-5">
        <h3 className="text-sm font-semibold text-foreground">Available Reports</h3>

        <div className="bg-muted/30 border rounded-lg p-4 space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Select Link For Report
          </label>
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            disabled={!scannedAssets.length}
            className="w-full rounded-md border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {scannedAssets.map((asset) => {
              const label = asset.domain || asset.name;
              return (
                <option key={asset.id} value={label}>
                  {label}
                </option>
              );
            })}
            {!scannedAssets.length && (
              <option value="">
                No scanned links found
              </option>
            )}
          </select>
          <p className="text-xs text-muted-foreground">
            Selected: {selectedLabel}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ReportCard
            title="Quantum Readiness Assessment"
            description="Executive summary with risk scores, inventory overview, and migration timeline"
            tags={["RBI Aligned", "NIST Ready"]}
            onClick={openPreviewForSelected}
          />
          <ReportCard
            title="Cryptographic Inventory Export"
            description="Full CBOM export with algorithm details, key sizes, and vulnerability status"
            tags={["CSV", "JSON", "XML"]}
            onClick={openPreviewForSelected}
          />
        </div>
      </div>

      {showPreview && (
        <div
          className="fixed inset-0 z-50 bg-foreground/40 overflow-y-auto px-4 py-6"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="fixed left-1/2 top-[68%] z-50 w-full max-w-3xl max-h-[calc(100vh-8rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto bg-card rounded-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-card z-10">
              <h3 className="font-semibold text-foreground">
                Report Preview - {selectedLabel}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => download("csv")}
                  disabled={!isAdmin}
                  title={!isAdmin ? "Switch to Security Admin to export" : ""}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download CSV
                </button>
                <button
                  onClick={() => download("xml")}
                  disabled={!isAdmin}
                  title={!isAdmin ? "Switch to Security Admin to export" : ""}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground text-xs font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download XML
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 rounded-md hover:bg-red-500/20 hover:text-red-600 transition-colors ml-auto"
                  title="Close (ESC)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-8 text-sm">
              <div className="text-center border-b pb-6">
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center">
                    <Shield className="w-7 h-7 text-primary-foreground" />
                  </div>
                </div>
                <h1 className="text-xl font-bold text-foreground">
                  {selectedLabel}
                </h1>
                <p className="text-muted-foreground mt-1">
                  Quantum Security Readiness Assessment Report
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Generated: {new Date().toLocaleString()} | Classification: CONFIDENTIAL
                </p>
              </div>

              <section>
                <h2 className="text-base font-bold text-foreground border-b pb-2 mb-3">
                  1. Executive Summary
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  This report presents the quantum security posture for the selected URL:
                  <span className="font-medium text-foreground"> {selectedLabel}</span>, based on the latest completed backend scan.
                </p>
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <StatBox icon={<AlertTriangle className="w-4 h-4 text-risk-moderate" />} label="Overall Risk Score" value={`${selectedRiskScore}/100`} sub={selectedRiskLevel} />
                  <StatBox icon={<Shield className="w-4 h-4 text-primary" />} label="Assets In This Report" value="1" sub={selectedLabel} />
                  <StatBox icon={<Clock className="w-4 h-4 text-muted-foreground" />} label="Scan Ended" value={report ? new Date(report.finishedAt).toLocaleDateString() : "N/A"} sub="Timestamp" />
                </div>
              </section>

              <section>
                <h2 className="text-base font-bold text-foreground border-b pb-2 mb-3">
                  2. Risk Overview
                </h2>
                <table className="w-full text-xs border">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left px-3 py-2 font-medium">Asset</th>
                      <th className="text-left px-3 py-2 font-medium">TLS</th>
                      <th className="text-left px-3 py-2 font-medium">Algorithm</th>
                      <th className="text-center px-3 py-2 font-medium">Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t">
                      <td className="px-3 py-2 font-mono">{selectedLabel}</td>
                      <td className="px-3 py-2">{selectedTlsVersion}</td>
                      <td className="px-3 py-2">{selectedKeyExchange}</td>
                      <td className="px-3 py-2 text-center font-semibold">{selectedRiskLevel}</td>
                    </tr>
                  </tbody>
                </table>
              </section>

              <section>
                <h2 className="text-base font-bold text-foreground border-b pb-2 mb-3">
                  3. Selected Site Details
                </h2>
                {selectedFinding || selectedAsset ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="border rounded-lg p-4 space-y-2">
                      <p className="font-semibold text-foreground">Selected Site</p>
                      <p className="text-muted-foreground">{selectedLabel}</p>
                      <p className="text-muted-foreground">TLS: {selectedTlsVersion}</p>
                      <p className="text-muted-foreground">Key Exchange: {selectedKeyExchange}</p>
                      <p className="text-muted-foreground">Certificate: {selectedCertAlgo}</p>
                      <p className="text-muted-foreground">Risk: {selectedRiskScore} / {selectedRiskLevel}</p>
                    </div>
                    <div className="border rounded-lg p-4 space-y-2">
                      <p className="font-semibold text-foreground">Recommendations</p>
                      <ul className="space-y-2 text-muted-foreground">
                        {selectedRecommendations.map((text) => (
                          <li key={text} className="flex gap-2">
                            <CheckCircle2 className="w-4 h-4 text-risk-low shrink-0 mt-0.5" />
                            {text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Run a scan to generate recommendations.</p>
                )}
              </section>
            </div>
          </div>
        </div>
      )}

      {reportQuery.isError && (
        <div className="bg-card rounded-lg border border-risk-moderate/30 p-4 text-sm text-muted-foreground">
          No scan report yet. Run a scan from Dashboard first.
        </div>
      )}
    </div>
  );
}

function ReportCard({
  title,
  description,
  tags,
  onClick,
}: {
  title: string;
  description: string;
  tags: string[];
  onClick: () => void;
}) {
  return (
    <div className="border rounded-lg p-4 hover:shadow-sm transition-shadow space-y-3">
      <div>
        <h4 className="font-semibold text-sm text-foreground">{title}</h4>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-medium"
            >
              {t}
            </span>
          ))}
        </div>
        <button
          onClick={onClick}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
        >
          <FileText className="w-3 h-3" />
          Generate
        </button>
      </div>
    </div>
  );
}

function StatBox({
  icon,
  label,
  value,
  sub,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="border rounded-lg p-3 text-center space-y-1">
      <div className="flex justify-center">{icon}</div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
