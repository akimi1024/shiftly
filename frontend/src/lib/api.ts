import { ShiftRequirementResponse } from "@/types/requirements";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
const STORE_ID = process.env.NEXT_PUBLIC_STORE_ID;

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