import { ShiftRequirementResponse } from "@/types/requirements";
import { ShiftRequestResponse } from "@/types/requests";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
const STORE_ID = process.env.NEXT_PUBLIC_STORE_ID;

// シフト必要人数取得API
export async function fetchRequirements(
  dateFrom: string,
  dateTo: string
): Promise<ShiftRequirementResponse[]> {
  const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo })
  const res = await fetch(
      `${BASE}/stores/${STORE_ID}/requirements?${params}`,
      { headers: {"X-Role": "manager"},
  });
  if(!res.ok){
      throw new Error(`failed: ${res.status}`);
  }
  return res.json();
}

// シフト必要人数登録API
export async function createRequirement(
  body: ShiftRequirementResponse
): Promise<ShiftRequirementResponse> {
  const res = await fetch(`${BASE}/stores/${STORE_ID}/requirements`, {
      method: "POST",
      headers: {
          "X-Role": "manager",
          "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
  });
  if (!res.ok) {
      const detail = await res.text(); // サーバが返したエラー本文を拾う
      throw new Error(`failed: ${res.status} ${detail}`);
  }
  return res.json();
}

// シフト必要人数削除API
export async function deleteRequirement(
  date: string,
  start_time: string
): Promise<void>{
  const id = encodeURIComponent(`${date}#${start_time}`)
  const res = await fetch(
    `${BASE}/stores/${STORE_ID}/requirements/${id}`,
      {
        method: "DELETE",
        headers: {"X-Role": "manager"},
  });
  if(!res.ok){
    throw new Error(`failed: ${res.status}`);
  }
}

// シフト必要人数編集API
export async function updateRequirement(
  date: string,
  start_time: string,
  body: { required_count: number; end_time: string }
): Promise<ShiftRequirementResponse> {
const id = encodeURIComponent(`${date}#${start_time}`)
const res = await fetch(
    `${BASE}/stores/${STORE_ID}/requirements/${id}`,
    {
      method: "PUT",
      headers: {
        "X-Role": "manager",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
});
if(!res.ok){
  const detail = await res.text()
  throw new Error(`failed: ${res.status} detail: ${detail}`);
}
return res.json();
}

// シフトリクエスト取得API
export async function fetchRequests(
  dateFrom: string,
  dateTo: string
): Promise<ShiftRequestResponse[]> {
  const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo })
  const res = await fetch(
      `${BASE}/stores/${STORE_ID}/requests?${params}`,
      { headers: {"X-Role": "manager"},
  });
  if(!res.ok){
      throw new Error(`failed: ${res.status}`);
  }
  return res.json();
}

// シフトリクエスト登録API
export async function createRequest(
  body: ShiftRequestResponse
): Promise<ShiftRequestResponse> {
  const res = await fetch(`${BASE}/stores/${STORE_ID}/requests`, {
      method: "POST",
      headers: {
          "X-Role": "manager",
          "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
  });
  if (!res.ok) {
      const detail = await res.text(); // サーバが返したエラー本文を拾う
      throw new Error(`failed: ${res.status} ${detail}`);
  }
  return res.json();
}

// シフトリクエスト一括登録API
export async function createRequestBulk(
  requests: ShiftRequestResponse[]
): Promise<ShiftRequestResponse[]> {
  const res = await fetch(`${BASE}/stores/${STORE_ID}/requests/bulk`, {
      method: "POST",
      headers: {
          "X-Role": "manager",
          "Content-Type": "application/json",
      },
      body: JSON.stringify({ requests }),
  });
  if (!res.ok) {
      const detail = await res.text(); // サーバが返したエラー本文を拾う
      throw new Error(`failed: ${res.status} ${detail}`);
  }
  return res.json();
}

// シフトリクエスト削除API
export async function deleteRequest(
  date: string,
  staff_id: string
): Promise<void>{
  const id = encodeURIComponent(`${date}#${staff_id}`)
  const res = await fetch(
    `${BASE}/stores/${STORE_ID}/requests/${id}`,
      {
        method: "DELETE",
        headers: {"X-Role": "manager"},
  });
  if(!res.ok){
    const detail = await res.text();
    throw new Error(`failed: ${res.status} detail: ${detail}`);
  }
}