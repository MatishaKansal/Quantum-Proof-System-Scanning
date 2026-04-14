import { useMemo, useState } from "react";
import { CheckCircle2, Circle, Info, RefreshCw, Route, Shield } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getAssets, getPQCAlgorithms, type Asset } from "@/lib/api";

type RoadmapTask = {
  text: string;
  done: boolean;
};

type RoadmapPhase = {
  id: string;
  title: string;
  timeline: string;
  status: "complete" | "in_progress" | "pending";
  tasks: RoadmapTask[];
};

const ROADMAP_TEMPLATE = [
  { id: "phase-1", title: "Phase 1 - Assessment", timeline: "Current" },
  { id: "phase-2", title: "Phase 2 - Hybrid Deployment", timeline: "Next" },
  { id: "phase-3", title: "Phase 3 - Full PQC Adoption", timeline: "Final" },
];

function getPhaseStyle(status: string) {
  switch (status) {
    case "complete":
      return "border-risk-low bg-risk-low/5";
    case "in_progress":
      return "border-risk-moderate bg-risk-moderate/5";
    default:
      return "border-border bg-card";
  }
}

function buildRoadmap(asset: Asset): RoadmapPhase[] {
  const tlsVersion = String(asset.tlsVersion || "").toLowerCase();
  const keyExchange = String(asset.keyExchange || "").toLowerCase();
  const certificateAlgorithm = String(asset.certificateAlgorithm || "").toLowerCase();
  const isTls13 = tlsVersion.includes("1.3");
  const hasForwardSecrecy = Boolean(asset.forwardSecrecy);
  const hasPqc = Boolean(asset.pqcCompatible);
  const hasScannedData = tlsVersion !== "unknown";

  const phaseDefinitions = [
    {
      tasks: [
        { text: "Complete cryptographic inventory", done: hasScannedData },
        { text: "Identify quantum-vulnerable systems", done: hasScannedData && asset.riskScore > 0 },
        { text: "Baseline risk scoring across assets", done: hasScannedData },
        { text: "Document current TLS configurations", done: hasScannedData },
      ],
    },
    {
      tasks: [
        { text: "Implement RSA + CRYSTALS-Kyber Hybrid", done: hasPqc || (isTls13 && hasForwardSecrecy) },
        { text: "Upgrade TLS 1.2 -> TLS 1.3", done: isTls13 },
        { text: "Replace RSA-1024 certificates", done: !certificateAlgorithm.includes("sha-1") },
        { text: "Enable forward secrecy on all endpoints", done: hasForwardSecrecy },
      ],
    },
    {
      tasks: [
        { text: "Deploy Kyber Key Exchange", done: hasPqc },
        { text: "Deploy Dilithium Digital Signatures", done: hasPqc && !certificateAlgorithm.includes("sha-1") },
        { text: "Complete PQC pilot validation", done: hasPqc && asset.riskLevel === "Low" },
        { text: "Roll out full PQC policy", done: hasPqc && !keyExchange.includes("rsa") },
      ],
    },
  ];

  return phaseDefinitions.map((phase, index) => {
    const doneCount = phase.tasks.filter((task) => task.done).length;
    const status: RoadmapPhase["status"] =
      doneCount === phase.tasks.length ? "complete" : doneCount > 0 ? "in_progress" : "pending";

    return {
      id: ROADMAP_TEMPLATE[index].id,
      title: ROADMAP_TEMPLATE[index].title,
      timeline: ROADMAP_TEMPLATE[index].timeline,
      status,
      tasks: phase.tasks,
    };
  });
}

export default function MigrationPlanner() {
  const [selectedAssetId, setSelectedAssetId] = useState("");

  const algorithmsQuery = useQuery({
    queryKey: ["pqc-algorithms"],
    queryFn: getPQCAlgorithms,
  });

  const assetsQuery = useQuery({
    queryKey: ["assets"],
    queryFn: getAssets,
  });

  const scannedAssets = useMemo(
    () => (assetsQuery.data || []).filter((asset) => asset.lastScannedAt),
    [assetsQuery.data]
  );

  const selectedAsset = useMemo(() => {
    if (!scannedAssets.length) return null;
    return scannedAssets.find((asset) => asset.id === selectedAssetId) || scannedAssets[0];
  }, [scannedAssets, selectedAssetId]);

  const roadmap = useMemo(() => (selectedAsset ? buildRoadmap(selectedAsset) : []), [selectedAsset]);
  const isLoading = algorithmsQuery.isLoading || assetsQuery.isLoading;
  const algorithms = algorithmsQuery.data || [];

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border p-12 flex items-center justify-center">
        <RefreshCw className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Route className="w-6 h-6 text-primary" />
            Site Migration Roadmap
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Choose one scanned site to view its roadmap separately.
          </p>
        </div>

        <div className="w-full lg:w-[360px] bg-card border rounded-lg p-4 space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Select Scanned Site
          </label>
          <select
            value={selectedAsset?.id || ""}
            onChange={(e) => setSelectedAssetId(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          >
            {scannedAssets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.domain || asset.name}
              </option>
            ))}
          </select>
          {selectedAsset && (
            <p className="text-xs text-muted-foreground">
              Showing roadmap for <span className="font-medium text-foreground">{selectedAsset.domain || selectedAsset.name}</span>
            </p>
          )}
        </div>
      </div>

      {selectedAsset ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="bg-card rounded-lg border p-5 space-y-4 lg:col-span-1">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Selected Site</p>
              <h2 className="text-lg font-bold text-foreground mt-1">{selectedAsset.domain || selectedAsset.name}</h2>
              <p className="text-sm text-muted-foreground">{selectedAsset.ownerTeam || "Assigned team not set"}</p>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">TLS Version</p>
                <p className="font-medium text-foreground">{selectedAsset.tlsVersion}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Key Exchange</p>
                <p className="font-medium text-foreground">{selectedAsset.keyExchange}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Risk Score</p>
                <p className="font-medium text-foreground">{selectedAsset.riskScore} ({selectedAsset.riskLevel})</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Security Label</p>
                <p className="font-medium text-foreground">{selectedAsset.securityLabel}</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
            {roadmap.map((phase) => (
              <div
                key={phase.id}
                className={`rounded-lg border-2 p-5 space-y-4 ${getPhaseStyle(phase.status)}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-foreground">{phase.title}</h3>
                  <span className="text-xs text-muted-foreground">{phase.timeline}</span>
                </div>

                {phase.status === "complete" && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-risk-low">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                  </span>
                )}
                {phase.status === "in_progress" && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-risk-moderate">
                    <Circle className="w-3.5 h-3.5" /> In Progress
                  </span>
                )}
                {phase.status === "pending" && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                    <Circle className="w-3.5 h-3.5" /> Planned
                  </span>
                )}

                <div className="space-y-2.5">
                  {phase.tasks.map((task) => (
                    <div key={task.text} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle2
                        className={`w-4 h-4 mt-0.5 shrink-0 ${task.done ? "text-risk-low" : "text-muted-foreground/40"}`}
                      />
                      <span className={task.done ? "text-foreground" : "text-muted-foreground"}>
                        {task.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-lg border p-8 text-sm text-muted-foreground">
          No scanned sites are available yet. Run a site scan first, then return here to view that site's roadmap.
        </div>
      )}

      <div className="bg-card rounded-lg border p-5">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-primary" />
          NIST Standardized Post-Quantum Algorithms
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {algorithms.map((algo) => (
            <Tooltip key={algo.id}>
              <TooltipTrigger asChild>
                <div className="rounded-lg border p-4 hover:shadow-sm transition-shadow cursor-help space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm text-foreground">{algo.name}</h4>
                    <Info className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">
                    {algo.type}
                  </span>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {algo.description}
                  </p>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-xs">{algo.description}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </div>
  );
}
