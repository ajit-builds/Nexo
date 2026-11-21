"use client";

import React, { useState, useEffect } from "react";
import { Upload, Database, ShieldAlert, BarChart3 } from "lucide-react";
import { BulkIssuance } from "./BulkIssuance";
import { BatchHistory } from "./BatchHistory";
import { RevocationManager } from "./RevocationManager";
import { IssuerAnalytics } from "./IssuerAnalytics";
import { loadBatches, loadRevocations } from "@/lib/storage";
import { BatchRecord, RevocationRecord } from "@/types";

export function IssuerPortal() {
  const [activeTab, setActiveTab] = useState<"bulk" | "batches" | "revocations" | "analytics">("bulk");
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [revocations, setRevocations] = useState<RevocationRecord[]>([]);

  useEffect(() => {
    setBatches(loadBatches());
    setRevocations(loadRevocations());
  }, []);

  const handleBatchCreated = (newBatch: BatchRecord) => {
    setBatches([newBatch, ...batches]);
  };

  const handleRevocationComplete = (newRevocation: RevocationRecord) => {
    setRevocations([newRevocation, ...revocations]);
  };

  return (
    <div className="space-y-6">
      {/* Sub Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-800 pb-3">
        <button
          onClick={() => setActiveTab("bulk")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "bulk"
              ? "bg-indigo-600 text-white shadow-md"
              : "bg-gray-800/40 text-gray-400 hover:text-white hover:bg-gray-800"
          }`}
        >
          <Upload className="w-4 h-4" /> Bulk CSV Issuance
        </button>

        <button
          onClick={() => setActiveTab("batches")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "batches"
              ? "bg-indigo-600 text-white shadow-md"
              : "bg-gray-800/40 text-gray-400 hover:text-white hover:bg-gray-800"
          }`}
        >
          <Database className="w-4 h-4" /> Issued Batches ({batches.length})
        </button>

        <button
          onClick={() => setActiveTab("revocations")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "revocations"
              ? "bg-red-600 text-white shadow-md"
              : "bg-gray-800/40 text-gray-400 hover:text-white hover:bg-gray-800"
          }`}
        >
          <ShieldAlert className="w-4 h-4" /> Revocation Registry ({revocations.length})
        </button>

        <button
          onClick={() => setActiveTab("analytics")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "analytics"
              ? "bg-indigo-600 text-white shadow-md"
              : "bg-gray-800/40 text-gray-400 hover:text-white hover:bg-gray-800"
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Issuer Analytics
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
