import { useState } from "react";
import {
  Search,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Globe,
  Download,
  Lock,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRole } from "@/context/RoleContext";
import RiskGauge from "@/components/RiskGauge";
import { exportReport, getAssets, getDashboardSummary, runScan } from "@/lib/api";

function getStatusColor(status: string) {
  switch (status) {
    case "Low":
      return "bg-risk-low/10 text-risk-low";
    case "Medium":
    case "Moderate":
      return "bg-risk-moderate/10 text-risk-moderate";
    case "High":
      return "bg-risk-high/10 text-risk-high";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export default function Dashboard() {
  const [url, setUrl] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { isAdmin } = useRole();

  const assetsQuery = useQuery({
    queryKey: ["assets"],
    queryFn: getAssets,
  });

  const summaryQuery = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: getDashboardSummary,
  });

  const scanMutation = useMutation({
    mutationFn: async (params: any) => {
      if (params.url) {
        return runScan(undefined, params.url);
      }
      return runScan(params);
    },
    onSuccess: () => {
      setUrl(""); // Clear URL input on success
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["latest-report"] });
    },
  });

  const results = assetsQuery.data || [];
  const overallScore = summaryQuery.data?.overallRiskScore || 0;
  const riskBreakdown = summaryQuery.data?.riskBreakdown || {
    low: 0,
    medium: 0,
    high: 0,
  };

  const isLoading = assetsQuery.isLoading || summaryQuery.isLoading;
  const scanning = scanMutation.isPending;

  const handleScan = () => {
    if (!isAdmin) {
      alert("Scanning is disabled in Public View. Switch to Security Admin mode to run scans.");
      return;
    }
    if (!url.trim()) return;
    // Pass URL directly to backend - it will auto-create asset if needed
    scanMutation.mutate({ url: url.trim() });
  };

  const handleExportCsv = async () => {
    const blob = await exportReport("csv");
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = "latest-scan.csv";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border p-12 flex items-center justify-center">
        <RefreshCw className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (assetsQuery.isError || summaryQuery.isError) {
    return (
      <div className="bg-card rounded-lg border p-6">
        <p className="text-red-600">
          Error loading dashboard data. Please try refreshing the page.
        </p>
        {assetsQuery.error && <p className="text-sm text-muted-foreground mt-2">{String(assetsQuery.error)}</p>}
        {summaryQuery.error && <p className="text-sm text-muted-foreground mt-2">{String(summaryQuery.error)}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            TLS & Quantum Risk Assessment
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Scan and assess public-facing assets for quantum vulnerability
          </p>
        </div>
      </div>

      <div className="bg-card rounded-lg border p-5">
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          URL Scanner
        </h2>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Enter Public Facing URL (e.g., www.pnbindia.in)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleScan()}
            className="flex-1 px-4 py-2.5 rounded-md border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!isAdmin}
          />
          <button
            onClick={handleScan}
            disabled={scanning || !isAdmin}
            title={!isAdmin ? "Switch to Security Admin to enable scanning" : ""}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {!isAdmin ? (
              <Lock className="w-4 h-4" />
            ) : scanning ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            {!isAdmin ? "Scanning Disabled" : scanning ? "Scanning..." : "Scan TLS Configuration"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-card rounded-lg border p-6 flex flex-col items-center justify-center relative">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Overall Quantum Risk
          </h3>
          <RiskGauge score={overallScore} />
          <div className="mt-4 grid grid-cols-3 gap-3 w-full text-center">
            <div>
              <p className="text-lg font-bold text-risk-low">{riskBreakdown.low}</p>
              <p className="text-[10px] text-muted-foreground">Low</p>
            </div>
            <div>
              <p className="text-lg font-bold text-risk-moderate">{riskBreakdown.medium}</p>
              <p className="text-[10px] text-muted-foreground">Medium</p>
            </div>
            <div>
              <p className="text-lg font-bold text-risk-high">{riskBreakdown.high}</p>
              <p className="text-[10px] text-muted-foreground">High</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 bg-card rounded-lg border">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-sm font-semibold text-foreground">Scan Results</h3>
            <button
              onClick={handleExportCsv}
              disabled={!isAdmin}
              title={!isAdmin ? "Switch to Security Admin to export" : ""}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">URL</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">TLS Version</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Key Exchange</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Risk Score</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr
                    key={r.id}
                    className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => setSelectedAsset(selectedAsset === i ? null : i)}
                  >
                    <td className="px-4 py-3 font-mono text-xs">{r.domain}</td>
                    <td className="px-4 py-3">{r.tlsVersion}</td>
                    <td className="px-4 py-3 font-mono text-xs">{r.keyExchange}</td>
                    <td className="px-4 py-3 text-center font-semibold">{r.riskScore}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(r.riskLevel)}`}
                      >
                        {r.riskLevel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border">
        <div className="p-4 border-b">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            TLS Configuration Details
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 p-4">
          {results.map((r) => (
            <div
              key={r.id}
              className="rounded-lg border p-4 space-y-3 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center justify-between">
                <p className="font-mono text-xs font-medium">{r.domain}</p>
                {r.riskScore <= 40 ? (
                  <ShieldCheck className="w-4 h-4 text-risk-low" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-risk-high" />
                )}
              </div>
              <div className="space-y-2 text-xs">
                <Row label="TLS Version" value={r.tlsVersion} />
                <Row label="Certificate Algo" value={r.certificateAlgorithm} />
                <Row label="Key Exchange" value={r.keyExchange} />
                <Row
                  label="Forward Secrecy"
                  value={r.forwardSecrecy ? "Yes" : "No"}
                  highlight={!r.forwardSecrecy}
                />
                <Row
                  label="PQC Compatible"
                  value={r.pqcCompatible ? "Yes" : "No"}
                  highlight={!r.pqcCompatible}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {scanMutation.isError && (
        <div className="bg-card rounded-lg border border-risk-high/30 p-4 text-sm text-risk-high">
          Scan failed. Please check backend connectivity and try again.
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={highlight ? "text-risk-high font-semibold" : "font-medium text-right"}>
        {value}
      </span>
    </div>
  );
}
