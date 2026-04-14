import { useMemo, useState } from "react";
import { Database, Filter, Search, ShieldAlert, ShieldCheck, RefreshCw, Lock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useRole } from "@/context/RoleContext";
import { getAssets } from "@/lib/api";

function getRiskStyle(risk: string) {
  switch (risk) {
    case "Low": return "bg-risk-low/10 text-risk-low";
    case "Medium": return "bg-risk-moderate/10 text-risk-moderate";
    case "High": return "bg-risk-high/10 text-risk-high";
    default: return "bg-muted text-muted-foreground";
  }
}

export default function Inventory() {
  const [filterRisk, setFilterRisk] = useState("All");
  const [filterAlgo, setFilterAlgo] = useState("All");
  const [search, setSearch] = useState("");
  const { isAdmin } = useRole();

  const assetsQuery = useQuery({
    queryKey: ["assets"],
    queryFn: getAssets,
  });

  const filtered = useMemo(() => {
    const inventoryData = assetsQuery.data || [];
    return inventoryData.filter((item) => {
      if (filterRisk !== "All" && item.riskLevel !== filterRisk) return false;
      if (filterAlgo !== "All" && !item.keyExchange.toUpperCase().includes(filterAlgo)) return false;
      if (
        search &&
        !item.name.toLowerCase().includes(search.toLowerCase()) &&
        !item.domain.toLowerCase().includes(search.toLowerCase())
      ) return false;
      return true;
    });
  }, [assetsQuery.data, filterAlgo, filterRisk, search]);

  if (assetsQuery.isLoading) {
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
          <Database className="w-6 h-6 text-primary" />
          Cryptographic Bill of Materials (CBOM)
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Cryptographic inventory of all public-facing assets
        </p>
      </div>

      <div className="bg-card rounded-lg border p-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="w-4 h-4" />
          Filters:
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors w-56"
          />
        </div>
        <select
          value={filterRisk}
          onChange={(e) => setFilterRisk(e.target.value)}
          className="px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="All">All Risk Levels</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <select
          value={filterAlgo}
          onChange={(e) => setFilterAlgo(e.target.value)}
          className="px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="All">All Algorithms</option>
          <option value="RSA">RSA</option>
          <option value="ECDHE">ECDHE</option>
        </select>
        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} assets found
        </span>
      </div>

      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Asset</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Domain</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Algorithm</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Key Size</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">PQC Safe?</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Quantum Label</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Risk Level</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{item.domain}</td>
                  <td className="px-4 py-3">{item.keyExchange}</td>
                  <td className="px-4 py-3 text-center font-mono">{item.keySize}</td>
                  <td className="px-4 py-3 text-center">
                    {item.pqcCompatible ? (
                      <ShieldCheck className="w-4 h-4 text-risk-low mx-auto" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 text-risk-high mx-auto" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-center font-medium text-xs">{item.securityLabel}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskStyle(item.riskLevel)}`}>
                      {item.riskLevel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
