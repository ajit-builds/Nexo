import { BatchRecord, RevocationRecord } from "@/types";

const BATCHES_KEY = "nexo_issuer_batches";
const REVOCATIONS_KEY = "nexo_revocations";

export function loadBatches(): BatchRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BATCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveBatch(batch: BatchRecord): void {
  if (typeof window === "undefined") return;
  const current = loadBatches();
  localStorage.setItem(BATCHES_KEY, JSON.stringify([batch, ...current]));
}

export function loadRevocations(): RevocationRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(REVOCATIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveRevocation(record: RevocationRecord): void {
  if (typeof window === "undefined") return;
  const current = loadRevocations();
  localStorage.setItem(REVOCATIONS_KEY, JSON.stringify([record, ...current]));
}
