"use client"
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchRequests, createRequest, deleteRequest, createRequestBulk } from "@/lib/api";
import { ShiftRequestResponse } from "@/types/requests";

export default function RequestsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["requests", "2026-06-01", "2026-06-30"],
    queryFn: () => fetchRequests("2026-06-01", "2026-06-30"),
  });

  // 単体登録フォームの state（4つ）
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [staffId, setStaffId] = useState("");

  // 一括登録フォームの state（「行の配列」）。最初は空1行。
  const [rows, setRows] = useState<ShiftRequestResponse[]>([
    { date: "", staff_id: "", start_time: "", end_time: "" },
  ]);

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
  });

  const bulkMutation = useMutation({
    mutationFn: createRequestBulk,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ date, staff_id }: { date: string, staff_id: string }) =>
      deleteRequest(date, staff_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
  });

  // 単体登録
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate({ date, start_time: startTime, end_time: endTime, staff_id: staffId });
  }

  // --- 一括フォームの操作 ---
  // 1行の1フィールドだけ更新（配列を作り直す＝イミュータブル更新）
  function updateRow(index: number, field: keyof ShiftRequestResponse, value: string) {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  }
  // 空の行を末尾に追加
  function addRow() {
    setRows((prev) => [...prev, { date: "", staff_id: "", start_time: "", end_time: "" }]);
  }
  // index の行を削除
  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }
  // 一括登録
  function handleBulkSubmit(e: React.FormEvent) {
    e.preventDefault();
    bulkMutation.mutate(rows);
  }

  if (isLoading) return <p>読み込み中・・・</p>;
  if (isError) return <p>エラーが発生しました</p>;

  return (
    <div>
      {/* ===== 単体登録 ===== */}
      <h2>単体登録</h2>
      <form onSubmit={handleSubmit}>
        <input value={date} onChange={(e) => setDate(e.target.value)} type="date" required />
        <input value={startTime} onChange={(e) => setStartTime(e.target.value)} type="time" required />
        <input value={endTime} onChange={(e) => setEndTime(e.target.value)} type="time" required />
        <input value={staffId} onChange={(e) => setStaffId(e.target.value)} type="text" placeholder="STAFF01" required />
        <button type="submit">登録</button>
      </form>

      {/* ===== 一括登録 ===== */}
      <h2>一括登録</h2>
      <form onSubmit={handleBulkSubmit}>
        {rows.map((row, i) => (
          <div key={i}>
            <input type="date" value={row.date} onChange={(e) => updateRow(i, "date", e.target.value)} required />
            <input type="time" value={row.start_time} onChange={(e) => updateRow(i, "start_time", e.target.value)} required />
            <input type="time" value={row.end_time} onChange={(e) => updateRow(i, "end_time", e.target.value)} required />
            <input type="text" value={row.staff_id} onChange={(e) => updateRow(i, "staff_id", e.target.value)} placeholder="STAFF01" required />
            <button type="button" onClick={() => removeRow(i)}>行削除</button>
          </div>
        ))}
        <button type="button" onClick={addRow}>行を追加</button>
        <button type="submit">一括登録</button>
      </form>
      {bulkMutation.isError && (
        <p style={{ color: "red" }}>一括登録に失敗：{String(bulkMutation.error)}</p>
      )}

      {/* ===== 一覧 ===== */}
      <h2>一覧</h2>
      <ul>
        {data?.map((r) => (
          <li key={`${r.date}-${r.staff_id}`}>
            日付：{r.date} 時間：{r.start_time}〜{r.end_time} {r.staff_id}
            <button onClick={() => deleteMutation.mutate({ date: r.date, staff_id: r.staff_id })}>
              削除
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
