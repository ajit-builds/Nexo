"use client";

import React, { useState } from "react";
import { Upload, FileText, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, Database, RefreshCw } from "lucide-react";
import { parseStudentCSV, ParseResult } from "@/lib/csvParser";
import { buildMerkleTree, getProofsForRecords } from "@/lib/merkle";
import { generateSDJWTCredential } from "@/lib/sdjwt";
import { anchorBatchOnChain } from "@/lib/contracts";
import { saveBatch } from "@/lib/storage";
import { BatchRecord, StudentRecord } from "@/types";
import { Pagination } from "@/components/ui/Pagination";

const SAMPLE_CSV_DATA = `student_id,full_name,degree,major,graduation_year,cgpa,cgpa_above_8,institution_name,issue_date
IITB-2024-001,Aarav Sharma,Bachelor of Technology,Computer Science and Engineering,2024,8.85,true,IIT Bombay,2024-06-15
IITB-2024-002,Priya Patel,Bachelor of Technology,Electrical Engineering,2024,8.20,true,IIT Bombay,2024-06-15
IITB-2024-003,Rohan Verma,Bachelor of Technology,Mechanical Engineering,2024,7.45,false,IIT Bombay,2024-06-15
IITB-2024-004,Ananya Iyer,Bachelor of Technology,Computer Science and Engineering,2024,9.40,true,IIT Bombay,2024-06-15
IITB-2024-005,Vikram Singh,Bachelor of Technology,Civil Engineering,2024,7.80,false,IIT Bombay,2024-06-15
IITB-2024-006,Sanya Kapoor,Bachelor of Technology,Computer Science and Engineering,2024,8.60,true,IIT Bombay,2024-06-15
IITB-2024-007,Aditya Joshi,Bachelor of Technology,Aerospace Engineering,2024,8.15,true,IIT Bombay,2024-06-15
IITB-2024-008,Kavita Nair,Bachelor of Technology,Chemical Engineering,2024,7.10,false,IIT Bombay,2024-06-15`;

interface Props {
  onBatchCreated: (batch: BatchRecord) => void;
}

export function BulkIssuance({ onBatchCreated }: Props) {
  const [csvText, setCsvText] = useState("");
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [successBatch, setSuccessBatch] = useState<BatchRecord | null>(null);
  
  // Pagination for parsed preview rows
  const [previewPage, setPreviewPage] = useState(1);
  const PAGE_SIZE = 5;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      const result = await parseStudentCSV(text);
      setParseResult(result);
      setPreviewPage(1);
      setSuccessBatch(null);
    };
    reader.readAsText(file);
  };

  const loadSampleData = async () => {
    setCsvText(SAMPLE_CSV_DATA);
    const result = await parseStudentCSV(SAMPLE_CSV_DATA);
    setParseResult(result);
    setPreviewPage(1);
    setSuccessBatch(null);
  };

  const handleAnchorBatch = async () => {
    if (!parseResult || parseResult.records.length === 0) return;

    try {
      setIsProcessing(true);

      // Step 1: Merkle Tree construction
      setCurrentStep("Constructing Merkle Tree over batch records...");
      await new Promise(r => setTimeout(r, 400));
      const tree = buildMerkleTree(parseResult.records);
      const merkleRoot = tree.root;

      // Step 2: Individual Merkle Proofs
      setCurrentStep("Generating cryptographic inclusion proofs...");
      await new Promise(r => setTimeout(r, 400));
      const proofs = getProofsForRecords(tree, parseResult.records);

      // Step 3: Anchor on Polygon Amoy
      setCurrentStep("Submitting Merkle root anchor transaction to Polygon Amoy...");
      const issuerAddress = "0x71C83d95B309A20165b4F435F649BCE286a1172A";
      const anchorResult = await anchorBatchOnChain(merkleRoot, parseResult.records.length, issuerAddress);

      // Step 4: Generate SD-JWTs with individual salted disclosures
      setCurrentStep("Issuing W3C SD-JWT credentials with selective disclosure salts...");
      await new Promise(r => setTimeout(r, 400));
      const credentials = parseResult.records.map((rec, i) =>
        generateSDJWTCredential(rec, merkleRoot, proofs[i], anchorResult.batchId, {
          name: "Indian Institute of Technology, Bombay",
          address: issuerAddress,
          category: "University"
        })
      );

      const newBatch: BatchRecord = {
        batchId: anchorResult.batchId,
        merkleRoot,
        issuerAddress,
        issuerName: "Indian Institute of Technology, Bombay",
        credentialType: "Degree",
        totalCredentials: parseResult.records.length,
        timestamp: Date.now(),
        txHash: anchorResult.txHash,
        ipfsUri: "ipfs://QmNexoGraduationBatch2024Manifest",
        credentials
      };

      saveBatch(newBatch);
      setSuccessBatch(newBatch);
      onBatchCreated(newBatch);
      setIsProcessing(false);
      setCurrentStep("");
    } catch (err) {
      console.error("Batch issuance failed:", err);
      setIsProcessing(false);
      setCurrentStep("Error issuing batch. Please check your network connection.");
    }
  };

  // Paginated records
  const paginatedRecords = parseResult
    ? parseResult.records.slice((previewPage - 1) * PAGE_SIZE, previewPage * PAGE_SIZE)
    : [];

  return (
    <div className="space-y-6">
      {/* Top Banner - Apple Style */}
      <div className="bg-white border border-black/[0.06] rounded-3xl p-6 sm:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#0071e3]/10 text-[#0071e3]">
              <ShieldCheck className="w-3.5 h-3.5" /> Accredited Institution: IIT Bombay
            </span>
            <h2 className="text-2xl font-semibold text-[#1d1d1f] tracking-tight">Bulk Digital Credential Issuance</h2>
            <p className="text-[#86868b] text-sm max-w-2xl font-normal leading-relaxed">
              Export graduation cohorts from your ERP as CSV. Nexo builds a Merkle Tree over all leaves,
              issues W3C SD-JWT credentials, and commits one single anchor transaction on Polygon Amoy.
            </p>
          </div>
          <button
            type="button"
            onClick={loadSampleData}
            className="flex items-center gap-2 bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] px-4 py-2.5 rounded-full text-xs font-semibold border border-black/[0.04] transition active:scale-[0.98] shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Load Sample IIT-B Batch (CSV)
          </button>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="border-2 border-dashed border-[#d2d2d7] hover:border-[#0071e3] bg-white rounded-3xl p-10 text-center transition-all cursor-pointer relative group shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-[#f5f5f7] flex items-center justify-center text-[#1d1d1f] group-hover:scale-105 transition-transform">
            <Upload className="w-6 h-6 text-[#0071e3]" />
          </div>
          <h3 className="text-lg font-semibold text-[#1d1d1f] mt-4">Upload University / HR CSV Export</h3>
          <p className="text-[#86868b] text-sm mt-1">
            Drag and drop your graduation batch file or click to browse (.csv format)
          </p>
          <span className="text-xs text-[#86868b] mt-2 font-mono">
            student_id, full_name, degree, major, graduation_year, cgpa
          </span>
        </div>
      </div>

      {/* Parse Results Preview */}
      {parseResult && (
        <div className="bg-white border border-black/[0.06] rounded-3xl p-6 sm:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/[0.06] pb-5">
            <div>
              <h3 className="text-lg font-semibold text-[#1d1d1f] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#0071e3]" /> Batch Validation Summary
              </h3>
              <p className="text-sm text-[#86868b] mt-0.5">
                {parseResult.validRows} of {parseResult.totalRows} student records validated and ready for issuance
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-[#34c759]/10 text-[#34c759] rounded-full text-xs font-semibold">
                {parseResult.validRows} Valid Records
              </span>
              {parseResult.errors.length > 0 && (
                <span className="px-3 py-1 bg-[#ff3b30]/10 text-[#ff3b30] rounded-full text-xs font-semibold">
                  {parseResult.errors.length} Format Errors
                </span>
              )}
              <button
                type="button"
                disabled={isProcessing || parseResult.validRows === 0}
                onClick={handleAnchorBatch}
                className="flex items-center gap-2 bg-[#0071e3] hover:bg-[#0077ed] text-white px-5 py-2.5 rounded-full text-xs font-semibold transition-all shadow-sm active:scale-[0.98] disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Anchoring on Amoy...
                  </>
                ) : (
                  <>
                    <Database className="w-3.5 h-3.5" /> Anchor Batch on Polygon Amoy <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Stepper Status */}
          {isProcessing && (
            <div className="p-4 bg-[#f5f5f7] rounded-2xl flex items-center gap-3">
              <RefreshCw className="w-4 h-4 text-[#0071e3] animate-spin" />
              <span className="text-xs font-semibold text-[#1d1d1f]">{currentStep}</span>
            </div>
          )}

          {/* Success Banner */}
          {successBatch && (
            <div className="p-5 bg-[#34c759]/10 border border-[#34c759]/20 rounded-2xl flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#34c759] mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-[#1d1d1f]">Batch Successfully Anchored!</h4>
                  <p className="text-xs text-[#86868b] mt-0.5">
                    Root: <code className="font-mono text-[#0071e3]">{successBatch.merkleRoot}</code>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Paginated Records Preview Table */}
          <div className="overflow-x-auto rounded-2xl border border-black/[0.06]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f5f5f7] text-[#86868b] font-semibold uppercase tracking-wider text-[11px] border-b border-black/[0.06]">
                <tr>
                  <th className="py-3 px-4">Student ID</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Degree</th>
                  <th className="py-3 px-4">Major</th>
                  <th className="py-3 px-4">CGPA</th>
                  <th className="py-3 px-4">Predicate Proof</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {paginatedRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-[#f5f5f7]/60 transition">
                    <td className="py-3 px-4 font-mono font-medium text-[#1d1d1f]">{r.studentId}</td>
                    <td className="py-3 px-4 font-semibold text-[#1d1d1f]">{r.fullName}</td>
                    <td className="py-3 px-4 text-[#86868b]">{r.degree}</td>
                    <td className="py-3 px-4 text-[#86868b]">{r.major}</td>
                    <td className="py-3 px-4 font-semibold text-[#1d1d1f]">{r.cgpa.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      {r.cgpaAbove8 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#34c759]/10 text-[#34c759]">
                          CGPA &ge; 8.0: YES
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#86868b]/10 text-[#86868b]">
                          CGPA &ge; 8.0: NO
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          <Pagination
            currentPage={previewPage}
            totalItems={parseResult.records.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPreviewPage}
            itemName="student records"
          />
        </div>
      )}
    </div>
  );
}
