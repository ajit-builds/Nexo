import Link from 'next/link';
import { Building2, UploadCloud, Layers, ArrowLeft } from 'lucide-react';

export default function UniversityPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto mb-6">
        <Building2 className="w-8 h-8" />
      </div>
      <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
        Module 2 • Assigned to @pratikswain070-blip
      </span>
      <h1 className="text-3xl font-black text-slate-900 mt-4">University Issuer Portal</h1>
      <p className="text-slate-600 max-w-lg mx-auto mt-2 text-sm leading-relaxed">
        Bulk CSV/ERP batch upload, Merkle tree root anchoring on Polygon Amoy, and issuer credential management.
      </p>

      <div className="mt-8 p-6 bg-slate-50 border border-slate-200 rounded-2xl max-w-md mx-auto text-left">
        <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">Module 2 Key Tasks:</h4>
        <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
          <li>PapaParse bulk student CSV parsing</li>
          <li>Merkle Tree construction (`@openzeppelin/merkle-tree`)</li>
          <li>One-click on-chain batch anchor transaction</li>
          <li>Revocation management dashboard</li>
        </ul>
      </div>

      <div className="mt-8">
        <Link
          href="/student"
          className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800"
        >
          <ArrowLeft className="w-4 h-4" /> Go to Module 3 (Student Wallet)
        </Link>
      </div>
    </div>
  );
}
