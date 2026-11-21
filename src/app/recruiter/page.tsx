'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function RecruiterRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const uid = searchParams.get('uid') || searchParams.get('id');
    if (uid) {
      router.replace(`/verify?id=${encodeURIComponent(uid)}`);
    } else {
      router.replace('/verify');
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center text-xs text-[#86868b]">
      Redirecting to Verification Portal...
    </div>
  );
}

export default function RecruiterPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-[#86868b]">Loading Recruiter...</div>}>
      <RecruiterRedirectContent />
    </Suspense>
  );
}
