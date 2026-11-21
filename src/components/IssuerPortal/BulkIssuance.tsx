"use client";

import React, { useState } from "react";
import { Upload, FileText, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, Database, RefreshCw } from "lucide-react";
import { parseStudentCSV, ParseResult } from "@/lib/csvParser";
import { buildMerkleTree, getProofsForRecords } from "@/lib/merkle";
import { generateSDJWTCredential } from "@/lib/sdjwt";
import { anchorBatchOnChain } from "@/lib/contracts";
import { saveBatch } from "@/lib/storage";
import { BatchRecord, StudentRecord } from "@/types";

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      const result = await parseStudentCSV(text);
      setParseResult(result);
      setSuccessBatch(null);
    };
    reader.readAsText(file);
  };

  const loadSampleData = async () => {
    setCsvText(SAMPLE_CSV_DATA);
    const result = await parseStudentCSV(SAMPLE_CSV_DATA);
    setParseResult(result);
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

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-900/60 to-purple-900/40 border border-indigo-700/50 rounded-xl p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" /> Accredited Institution: IIT Bombay
            </span>
            <h2 className="text-2xl font-bold text-white">Bulk Digital Credential Issuance</h2>
            <p className="text-gray-300 text-sm mt-1 max-w-2xl">
              Export graduation batches from your ERP as a CSV. Nexo hashes all records into a single Merkle Tree,
              issues tamper-proof SD-JWT credentials, and commits one single anchor transaction on Polygon Amoy.
            </p>
          </div>
          <button
            onClick={loadSampleData}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-md shrink-0"
          >
            <RefreshCw className="w-4 h-4" /> Load Sample IIT-B Batch (CSV)
          </button>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="border-2 border-dashed border-gray-700 hover:border-indigo-500/60 bg-gray-900/50 rounded-xl p-8 text-center transition-all cursor-pointer relative group">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center">
          <div className="p-4 bg-indigo-600/10 rounded-full text-indigo-400 group-hover:scale-110 transition-transform">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-white mt-3">Upload University / HR CSV Export</h3>
          <p className="text-gray-400 text-sm mt-1">
            Drag and drop your graduation batch file or click to browse (.csv format)
          </p>
          <span className="text-xs text-gray-500 mt-2">
            Expected headers: student_id, full_name, degree, major, graduation_year, cgpa
          </span>
        </div>
      </div>

      {/* Parse Results Preview */}
      {parseResult && (
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 pb-4">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" /> Batch Validation Summary
              </h3>
              <p className="text-sm text-gray-400">
                {parseResult.validRows} of {parseResult.totalRows} student records ready for cryptographic issuance
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/30 rounded-lg text-xs font-medium">
                {parseResult.validRows} Valid Records
              </span>
              {parseResult.errors.length > 0 && (
                <span className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg text-xs font-medium">
                  {parseResult.errors.length} Format Errors
                </span>
              )}
              <button
                disabled={isProcessing || parseResult.validRows === 0}
                onClick={handleAnchorBatch}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-lg disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Anchoring on Amoy...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" /> Issue & Anchor Batch on Polygon Amoy <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Processing Status Stepper */}
          {isProcessing && (
            <div className="p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-lg animate-pulse">
              <p className="text-sm text-indigo-300 font-medium flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" /> {currentStep}
              </p>
            </div>
          )}

          {/* Success Banner */}
          {successBatch && (
            <div className="p-5 bg-green-950/40 border border-green-500/40 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-green-400 font-semibold">
                <CheckCircle2 className="w-5 h-5" /> Batch Successfully Anchored on Polygon Amoy!
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="bg-black/40 p-2.5 rounded border border-gray-800">
                  <span className="text-gray-400 block">Merkle Root (32-bytes):</span>
                  <span className="text-indigo-300 font-mono truncate block">{successBatch.merkleRoot}</span>
                </div>
                <div className="bg-black/40 p-2.5 rounded border border-gray-800">
                  <span className="text-gray-400 block">Transaction Hash (Amoy):</span>
                  <span className="text-purple-300 font-mono truncate block">{successBatch.txHash}</span>
                </div>
                <div className="bg-black/40 p-2.5 rounded border border-gray-800">
                  <span className="text-gray-400 block">Total Credentials Issued:</span>
                  <span className="text-white font-semibold block">{successBatch.totalCredentials} Students</span>
                </div>
              </div>
            </div>
          )}

          {/* Preview Table */}
          <div className="overflow-x-auto rounded-lg border border-gray-800">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-gray-800/60 text-xs text-gray-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Student ID</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Degree & Major</th>
                  <th className="py-3 px-4">CGPA</th>
                  <th className="py-3 px-4">Predicate</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {parseResult.records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-gray-800/30">
                    <td className="py-3 px-4 font-mono text-xs text-gray-300">{rec.studentId}</td>
                    <td className="py-3 px-4 font-medium text-white">{rec.fullName}</td>
                    <td className="py-3 px-4 text-xs text-gray-300">{rec.degree} ({rec.major})</td>
                    <td className="py-3 px-4 font-semibold text-indigo-400">{rec.cgpa.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      {rec.cgpaAbove8 ? (
                        <span className="px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/30 rounded text-xs">
                          CGPA &ge; 8.0: YES
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-gray-700/40 text-gray-400 rounded text-xs">
                          CGPA &ge; 8.0: NO
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-green-400 text-xs font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
