import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { BarChart3, TrendingDown, RefreshCw } from "lucide-react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAssets, getDashboardSummary } from "@/lib/api";

function getBarColor(value: number) {
  if (value >= 60) return "bg-risk-low";
  if (value >= 40) return "bg-risk-moderate";
  return "bg-risk-high";
}

export default function RiskAnalytics() {
  const assetsQuery = useQuery({ queryKey: ["assets"], queryFn: getAssets });
  const summaryQuery = useQuery({ queryKey: ["dashboard-summary"], queryFn: getDashboardSummary });

  const trendData = useMemo(() => {
    const latestScans = summaryQuery.data?.latestScans || [];
    const points = latestScans
      .slice(0, 6)
      .map((scan) => ({
        month: new Date(scan.startedAt).toLocaleDateString(undefined, { month: "short" }),
        score: Math.round(
          scan.findings.reduce((sum, f) => sum + f.riskScore, 0) / Math.max(1, scan.findings.length)
        ),
      }))
      .reverse();

    return points;
  }, [summaryQuery.data]);

  const distributionData = useMemo(() => {
    const risk = summaryQuery.data?.riskBreakdown || { high: 0, medium: 0, low: 0 };
    return [
      { name: "High", value: risk.high, color: "hsl(0, 84%, 50%)" },
      { name: "Medium", value: risk.medium, color: "hsl(38, 92%, 50%)" },
      { name: "Low", value: risk.low, color: "hsl(142, 71%, 45%)" },
    ];
  }, [summaryQuery.data]);

  const readinessItems = useMemo(() => {
    const assets = assetsQuery.data || [];
    const total = Math.max(assets.length, 1);
    const tls13 = assets.filter((a) => a.tlsVersion === "TLS 1.3").length;
    const certUpgrade = assets.filter((a) => !a.certificateAlgorithm.toLowerCase().includes("sha-1")).length;
    const vpnUpgrade = assets.filter((a) => a.type !== "VPN" || a.keySize >= 2048).length;
    const apiUpgrade = assets.filter((a) => a.type !== "API" || a.forwardSecrecy).length;

    return [
      { label: "TLS Upgraded", value: Math.round((tls13 / total) * 100) },
      { label: "Certificate Upgrade", value: Math.round((certUpgrade / total) * 100) },
      { label: "VPN Upgrade", value: Math.round((vpnUpgrade / total) * 100) },
      { label: "API Upgrade", value: Math.round((apiUpgrade / total) * 100) },
    ];
  }, [assetsQuery.data]);

  const overallReadiness =
    readinessItems.reduce((sum, item) => sum + item.value, 0) / Math.max(1, readinessItems.length);

  if (assetsQuery.isLoading || summaryQuery.isLoading) {
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
          <BarChart3 className="w-6 h-6 text-primary" />
          Risk Analytics & PQC Readiness
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Historical risk trends and quantum readiness metrics
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-lg border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">
              Quantum Risk Score Trend
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-risk-low">
              <TrendingDown className="w-3.5 h-3.5" />
              Live from scan history
            </div>
          </div>
          {trendData.length === 0 ? (
            <div className="h-[280px] flex items-center justify-center">
              <p className="text-sm text-muted-foreground">No scan history yet. Run scans to see trend data.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(0, 100%, 27%)"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "hsl(0, 100%, 27%)" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-card rounded-lg border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Risk Distribution
          </h3>
          {(summaryQuery.data?.riskBreakdown.high ?? 0) === 0 && (summaryQuery.data?.riskBreakdown.medium ?? 0) === 0 && (summaryQuery.data?.riskBreakdown.low ?? 0) === 0 ? (
            <div className="h-[280px] flex items-center justify-center">
              <p className="text-sm text-muted-foreground">No assets scanned yet.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {distributionData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Legend verticalAlign="bottom" iconType="circle" iconSize={8} />
                <Tooltip formatter={(value: number, name: string) => [`${value} assets`, name]} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-card rounded-lg border p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-foreground">
            PQC Readiness Meter
          </h3>
          <span className="text-2xl font-bold text-primary">{Math.round(overallReadiness)}%</span>
        </div>

        <div className="mb-6">
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-1000"
              style={{ width: `${overallReadiness}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            Current overall quantum readiness level
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {readinessItems.map((item) => (
            <div key={item.label} className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-semibold">{item.value}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full ${getBarColor(item.value)} transition-all duration-1000`}
                  style={{ width: `${item.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
