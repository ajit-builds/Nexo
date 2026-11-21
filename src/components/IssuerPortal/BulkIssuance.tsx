"use client";

import React, { useState, useRef } from "react";
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  ShieldCheck, 
  Database, 
  RefreshCw, 
  Download, 
  FileUp,
  Eye,
  Copy,
  Check,
  X,
  FileSpreadsheet,
  Code
} from "lucide-react";
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
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileSize, setUploadedFileSize] = useState<string | null>(null);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "raw">("table");
  const [hasCopied, setHasCopied] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [successBatch, setSuccessBatch] = useState<BatchRecord | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Pagination for parsed preview rows
  const [previewPage, setPreviewPage] = useState(1);
  const PAGE_SIZE = 5;

  const copyCsvToClipboard = () => {
    if (!csvText) return;
    navigator.clipboard.writeText(csvText);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const downloadCurrentCsv = () => {
    if (!csvText) return;
    const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", uploadedFileName || "cohort_records.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const processFile = async (file: File) => {
    setUploadError(null);
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv') && file.type && !file.type.includes('csv') && !file.type.includes('text')) {
      setUploadError('Please select a valid .csv file format.');
      return;
    }

    setUploadedFileName(file.name);
    setUploadedFileSize(
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        : `${(file.size / 1024).toFixed(1)} KB`
    );

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const text = event.target?.result as string;
          if (!text || !text.trim()) {
            setUploadError('The selected CSV file is empty.');
            return;
          }
          setCsvText(text);
          const result = await parseStudentCSV(text);
          if (result.records.length === 0 && result.errors.length > 0) {
            setUploadError(`Failed to parse valid records: ${result.errors[0]?.message || 'Invalid format'}`);
          } else {
            setUploadError(null);
          }
          setParseResult(result);
          setPreviewPage(1);
          setSuccessBatch(null);
        } catch (err: any) {
          setUploadError(err.message || 'Error parsing CSV file.');
        }
      };
      reader.onerror = () => {
        setUploadError('Failed to read the file from your computer.');
      };
      reader.readAsText(file);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to process file.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Reset file input value so re-selecting same file triggers onChange
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const loadSampleData = async () => {
    setUploadError(null);
    setUploadedFileName("iitb_sample_cohort_2024.csv");
    setUploadedFileSize("1.2 KB");
    setCsvText(SAMPLE_CSV_DATA);
    const result = await parseStudentCSV(SAMPLE_CSV_DATA);
    setParseResult(result);
    setPreviewPage(1);
    setSuccessBatch(null);
  };

  const downloadSampleTemplate = () => {
    const blob = new Blob([SAMPLE_CSV_DATA], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'nexo_graduation_cohort_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

      {/* Upload Zone with Full Drag & Drop + Direct File Picker */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-3xl p-8 sm:p-10 text-center transition-all cursor-pointer relative group ${
          isDragging
            ? "border-[#0071e3] bg-[#0071e3]/5 scale-[0.99]"
            : "border-[#d2d2d7] hover:border-[#0071e3] bg-white hover:bg-neutral-50/50"
        } shadow-[0_2px_8px_rgba(0,0,0,0.02)]`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv,application/vnd.ms-excel"
          onChange={handleFileUpload}
          className="hidden"
        />

        <div className="flex flex-col items-center max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#f5f5f7] flex items-center justify-center text-[#1d1d1f] group-hover:scale-105 transition-transform mb-4">
            <Upload className="w-6 h-6 text-[#0071e3]" />
          </div>

          <h3 className="text-lg font-semibold text-[#1d1d1f]">
            {isDragging ? "Drop your CSV batch file here" : "Upload University / HR CSV Export"}
          </h3>
          <p className="text-[#86868b] text-xs sm:text-sm mt-1">
            Drag and drop your graduation batch file or click to browse from computer
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="px-4 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold rounded-xl transition shadow-sm"
            >
              Browse Files (.csv)
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                loadSampleData();
              }}
              className="px-4 py-2 bg-[#f5f5f7] hover:bg-[#e8e8ed] text-neutral-800 text-xs font-semibold rounded-xl border border-black/[0.06] transition"
            >
              Use Sample Batch
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                downloadSampleTemplate();
              }}
              className="px-3.5 py-2 text-neutral-500 hover:text-neutral-800 text-xs font-medium rounded-xl hover:bg-neutral-100 transition inline-flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Template
            </button>
          </div>

          <span className="text-[11px] text-[#86868b] mt-4 font-mono">
            Expected headers: student_id, full_name, degree, major, graduation_year, cgpa
          </span>
        </div>
      </div>

      {/* Active CSV File Indicator & Quick Actions */}
      {csvText && (
        <div className="bg-white border border-black/[0.06] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs sm:text-sm font-semibold text-[#1d1d1f] font-mono">
                  {uploadedFileName || "cohort_records.csv"}
                </span>
                {uploadedFileSize && (
                  <span className="text-[11px] text-[#86868b]">({uploadedFileSize})</span>
                )}
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#34c759]/10 text-[#34c759]">
                  Loaded & Ready
                </span>
              </div>
              <p className="text-xs text-[#86868b] mt-0.5">
                {parseResult?.totalRows || csvText.split('\n').filter(Boolean).length - 1} records detected in file
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCsvModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0071e3]/10 hover:bg-[#0071e3]/15 text-[#0071e3] text-xs font-semibold rounded-xl transition active:scale-[0.98]"
            >
              <Eye className="w-3.5 h-3.5" /> View CSV File
            </button>
            <button
              type="button"
              onClick={downloadCurrentCsv}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#f5f5f7] hover:bg-[#e8e8ed] text-neutral-700 text-xs font-medium rounded-xl border border-black/[0.04] transition"
            >
              <Download className="w-3.5 h-3.5 text-neutral-500" /> Export CSV
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-[#86868b] hover:text-[#1d1d1f] px-2.5 py-2 font-medium transition hover:underline"
            >
              Upload Different File
            </button>
          </div>
        </div>
      )}

      {/* Upload Error Banner */}
      {uploadError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{uploadError}</span>
          </div>
          <button
            type="button"
            onClick={loadSampleData}
            className="px-3 py-1 bg-white hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg text-xs font-semibold shrink-0"
          >
            Load Sample CSV Instead
          </button>
        </div>
      )}

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
              {parseResult.detectedHeaders && (
                <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[11px] text-[#86868b]">
                  <span className="font-medium text-[#1d1d1f] mr-1">Auto-Mapped:</span>
                  <span className="bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-md font-mono">ID: {parseResult.detectedHeaders.id}</span>
                  <span className="bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-md font-mono">Name: {parseResult.detectedHeaders.name}</span>
                  <span className="bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-md font-mono">CGPA: {parseResult.detectedHeaders.cgpa}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Table / CSV Toggle */}
              <div className="flex items-center bg-[#f5f5f7] p-1 rounded-xl border border-black/[0.04]">
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    viewMode === "table"
                      ? "bg-white text-[#1d1d1f] shadow-xs"
                      : "text-[#86868b] hover:text-[#1d1d1f]"
                  }`}
                >
                  Table View
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("raw")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    viewMode === "raw"
                      ? "bg-white text-[#1d1d1f] shadow-xs"
                      : "text-[#86868b] hover:text-[#1d1d1f]"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5 text-[#0071e3]" /> View CSV File
                </button>
              </div>

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

          {/* Conditional View: Paginated Table vs Raw CSV File */}
          {viewMode === "table" ? (
            <>
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
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#1d1d1f] flex items-center gap-2">
                  <Code className="w-4 h-4 text-[#0071e3]" /> Raw Uploaded CSV File
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={copyCsvToClipboard}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f5f5f7] hover:bg-[#e8e8ed] text-neutral-800 text-xs font-semibold rounded-xl border border-black/[0.04] transition"
                  >
                    {hasCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#34c759]" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-neutral-500" /> Copy CSV
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCsvModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold rounded-xl transition shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5" /> Fullscreen View
                  </button>
                </div>
              </div>

              <div className="bg-[#18181b] text-neutral-200 rounded-2xl p-4 font-mono text-xs overflow-x-auto max-h-[380px] overflow-y-auto border border-black/[0.08] shadow-inner">
                <table className="w-full text-left">
                  <tbody>
                    {csvText.split("\n").map((line, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors">
                        <td className="pr-4 text-neutral-500 text-right select-none w-10 text-[11px] align-top py-0.5 border-r border-neutral-700">
                          {idx + 1}
                        </td>
                        <td className="pl-4 py-0.5 whitespace-pre font-mono text-emerald-300 text-xs leading-relaxed">
                          {line}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Full Dedicated View CSV File Modal */}
      {showCsvModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowCsvModal(false)}
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl border border-black/[0.08] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-black/[0.06] bg-[#fbfbfd]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#1d1d1f] flex items-center gap-2">
                    {uploadedFileName || "cohort_records.csv"}
                  </h3>
                  <p className="text-xs text-[#86868b] mt-0.5">
                    {csvText.split("\n").filter(Boolean).length} rows · {uploadedFileSize || `${(csvText.length / 1024).toFixed(1)} KB`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyCsvToClipboard}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-semibold rounded-xl border border-black/[0.08] shadow-xs transition"
                >
                  {hasCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#34c759]" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-neutral-500" /> Copy CSV
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={downloadCurrentCsv}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-semibold rounded-xl border border-black/[0.08] shadow-xs transition"
                >
                  <Download className="w-3.5 h-3.5 text-neutral-500" /> Download
                </button>
                <button
                  type="button"
                  onClick={() => setShowCsvModal(false)}
                  className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center transition active:scale-95 ml-1"
                  aria-label="Close CSV modal"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Modal CSV Monospace Viewer */}
            <div className="p-4 sm:p-6 bg-[#161618] overflow-y-auto overflow-x-auto flex-1 font-mono text-xs">
              <table className="w-full text-left">
                <tbody>
                  {csvText.split("\n").map((line, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="pr-4 text-[#6e7681] text-right select-none w-12 text-[11px] align-top py-0.5 border-r border-[#30363d]/80">
                        {idx + 1}
                      </td>
                      <td className="pl-4 py-0.5 whitespace-pre font-mono text-neutral-200 text-xs leading-relaxed">
                        {line}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-black/[0.06] bg-[#fbfbfd] flex items-center justify-between text-xs text-[#86868b]">
              <span>Viewing source CSV dataset</span>
              <button
                type="button"
                onClick={() => setShowCsvModal(false)}
                className="px-4 py-2 bg-[#1d1d1f] hover:bg-black text-white font-semibold rounded-xl transition"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
