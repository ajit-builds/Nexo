"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Upload, Database, ShieldAlert, BarChart3 } from "lucide-react";
import { BulkIssuance } from "./BulkIssuance";
import { BatchHistory } from "./BatchHistory";
import { RevocationManager } from "./RevocationManager";
import { IssuerAnalytics } from "./IssuerAnalytics";
import { loadBatches, loadRevocations } from "@/lib/storage";
import { BatchRecord, RevocationRecord } from "@/types";

export function IssuerPortal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = (searchParams.get("tab") as "bulk" | "batches" | "revocations" | "analytics") || "bulk";

  const [activeTab, setActiveTab] = useState<"bulk" | "batches" | "revocations" | "analytics">(currentTab);
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [revocations, setRevocations] = useState<RevocationRecord[]>([]);

  useEffect(() => {
    setBatches(loadBatches());
    setRevocations(loadRevocations());
  }, []);

  useEffect(() => {
    if (searchParams.get("tab")) {
      setActiveTab(searchParams.get("tab") as any);
    }
  }, [searchParams]);

  const handleTabChange = (tab: "bulk" | "batches" | "revocations" | "analytics") => {
    setActiveTab(tab);
    router.push(`/university?tab=${tab}`, { scroll: false });
  };

  const handleBatchCreated = (newBatch: BatchRecord) => {
    setBatches([newBatch, ...batches]);
    handleTabChange("batches");
  };

  const handleRevocationComplete = (newRevocation: RevocationRecord) => {
    setRevocations([newRevocation, ...revocations]);
  };

  return (
    <div className="space-y-6">
      {/* Apple-style Segmented Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white border border-black/[0.06] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <button
          type="button"
          onClick={() => handleTabChange("bulk")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "bulk"
              ? "bg-[#1d1d1f] text-white shadow-sm"
              : "text-[#1d1d1f] hover:bg-[#f5f5f7]"
          }`}
        >
          <Upload className="w-3.5 h-3.5" /> Bulk CSV Issuance
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("batches")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "batches"
              ? "bg-[#1d1d1f] text-white shadow-sm"
              : "text-[#1d1d1f] hover:bg-[#f5f5f7]"
          }`}
        >
          <Database className="w-3.5 h-3.5" /> Issued Batches ({batches.length})
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("revocations")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "revocations"
              ? "bg-[#ff3b30] text-white shadow-sm"
              : "text-[#1d1d1f] hover:bg-[#f5f5f7]"
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" /> Revocation Registry ({revocations.length})
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("analytics")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "analytics"
              ? "bg-[#1d1d1f] text-white shadow-sm"
              : "text-[#1d1d1f] hover:bg-[#f5f5f7]"
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" /> Issuer Analytics
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "bulk" && <BulkIssuance onBatchCreated={handleBatchCreated} />}
      {activeTab === "batches" && <BatchHistory batches={batches} />}
      {activeTab === "revocations" && (
        <RevocationManager
          batches={batches}
          revocations={revocations}
          onRevocationComplete={handleRevocationComplete}
        />
      )}
      {activeTab === "analytics" && <IssuerAnalytics batches={batches} revocations={revocations} />}
    </div>
  );
}
