import { ShiftRequirementResponse } from "@/types/requirements";
import { ShiftRequestResponse } from "@/types/requests";
import { StaffResponse } from "@/types/staff";
import { ShortageResponse } from "@/types/shortage";
import { ShiftResponse } from "@/types/shift";
import { StoreResponse } from "@/types/store";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
const STORE_ID = process.env.NEXT_PUBLIC_STORE_ID;

const TOKEN_KEY = "shiftly_token";

export function getToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
}
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// 全リクエスト共通ヘッダ。X-Role と（あれば）X-Auth-Token を付ける。
function authHeaders(json = false): Record<string, string> {
  const h: Record<string, string> = { "X-Role": "manager" };
  const token = getToken();
  if (token) h["X-Auth-Token"] = token;
  if (json) h["Content-Type"] = "application/json";
  return h;
}

// ===== スタッフ =====
export async function fetchStaff(): Promise<StaffResponse[]> {
  const res = await fetch(`${BASE}/stores/${STORE_ID}/staff`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`failed: ${res.status}`);
  return res.json();
}

export async function createStaff(body: { name: string; role: string }): Promise<StaffResponse> {
  const res = await fetch(`${BASE}/stores/${STORE_ID}/staff`, {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`failed: ${res.status} ${detail}`);
  }
  return res.json();
}

export async function deleteStaff(staffId: string): Promise<void> {
  const res = await fetch(`${BASE}/stores/${STORE_ID}/staff/${encodeURIComponent(staffId)}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`failed: ${res.status}`);
}

// ===== 店舗 =====
export async function fetchStore(): Promise<StoreResponse> {
  const res = await fetch(`${BASE}/stores/${STORE_ID}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`failed: ${res.status}`);
  return res.json();
}

export async function updateStore(body: StoreResponse): Promise<StoreResponse> {
  const res = await fetch(`${BASE}/stores/${STORE_ID}`, {
    method: "PUT",
    headers: authHeaders(true),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`failed: ${res.status} ${detail}`);
  }
  return res.json();
}

// ===== 確定シフト =====
export async function fetchShifts(dateFrom: string, dateTo: string): Promise<ShiftResponse[]> {
  const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo });
  const res = await fetch(`${BASE}/stores/${STORE_ID}/shifts?${params}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`failed: ${res.status}`);
  return res.json();
}

export async function createShiftsBulk(
  periodFrom: string,
  periodTo: string,
  shifts: ShiftResponse[]
): Promise<ShiftResponse[]> {
  const res = await fetch(`${BASE}/stores/${STORE_ID}/shifts`, {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify({ period_from: periodFrom, period_to: periodTo, shifts }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`failed: ${res.status} ${detail}`);
  }
  return res.json();
}

export async function updateShift(
  date: string,
  staff_id: string,
  body: { start_time: string; end_time: string }
): Promise<ShiftResponse> {
  const id = encodeURIComponent(`${date}#${staff_id}`);
  const res = await fetch(`${BASE}/stores/${STORE_ID}/shifts/${id}`, {
    method: "PUT",
    headers: authHeaders(true),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`failed: ${res.status} ${detail}`);
  }
  return res.json();
}

export async function deleteShift(date: string, staff_id: string): Promise<void> {
  const id = encodeURIComponent(`${date}#${staff_id}`);
  const res = await fetch(`${BASE}/stores/${STORE_ID}/shifts/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`failed: ${res.status}`);
}

// ===== 過不足 =====
export async function fetchShortage(dateFrom: string, dateTo: string): Promise<ShortageResponse[]> {
  const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo });
  const res = await fetch(`${BASE}/stores/${STORE_ID}/shortage?${params}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`failed: ${res.status}`);
  return res.json();
}

// ===== 必要人数 =====
export async function fetchRequirements(
  dateFrom: string,
  dateTo: string
): Promise<ShiftRequirementResponse[]> {
  const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo });
  const res = await fetch(`${BASE}/stores/${STORE_ID}/requirements?${params}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`failed: ${res.status}`);
  return res.json();
}

export async function createRequirement(
  body: ShiftRequirementResponse
): Promise<ShiftRequirementResponse> {
  const res = await fetch(`${BASE}/stores/${STORE_ID}/requirements`, {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`failed: ${res.status} ${detail}`);
  }
  return res.json();
}

export async function deleteRequirement(date: string, start_time: string): Promise<void> {
  const id = encodeURIComponent(`${date}#${start_time}`);
  const res = await fetch(`${BASE}/stores/${STORE_ID}/requirements/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`failed: ${res.status}`);
}

export async function updateRequirement(
  date: string,
  start_time: string,
  body: { required_count: number; end_time: string }
): Promise<ShiftRequirementResponse> {
  const id = encodeURIComponent(`${date}#${start_time}`);
  const res = await fetch(`${BASE}/stores/${STORE_ID}/requirements/${id}`, {
    method: "PUT",
    headers: authHeaders(true),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`failed: ${res.status} detail: ${detail}`);
  }
  return res.json();
}

// ===== シフト希望 =====
export async function fetchRequests(
  dateFrom: string,
  dateTo: string
): Promise<ShiftRequestResponse[]> {
  const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo });
  const res = await fetch(`${BASE}/stores/${STORE_ID}/requests?${params}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`failed: ${res.status}`);
  return res.json();
}

export async function createRequest(body: ShiftRequestResponse): Promise<ShiftRequestResponse> {
  const res = await fetch(`${BASE}/stores/${STORE_ID}/requests`, {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`failed: ${res.status} ${detail}`);
  }
  return res.json();
}

export async function createRequestBulk(
  requests: ShiftRequestResponse[]
): Promise<ShiftRequestResponse[]> {
  const res = await fetch(`${BASE}/stores/${STORE_ID}/requests/bulk`, {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify({ requests }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`failed: ${res.status} ${detail}`);
  }
  return res.json();
}

export async function deleteRequest(date: string, staff_id: string): Promise<void> {
  const id = encodeURIComponent(`${date}#${staff_id}`);
  const res = await fetch(`${BASE}/stores/${STORE_ID}/requests/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`failed: ${res.status} detail: ${detail}`);
  }
}
