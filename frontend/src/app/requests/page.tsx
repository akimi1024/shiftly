"use client"
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchRequests, createRequest } from "@/lib/api";

export default function RequestsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["requests", "2026-06-01", "2026-06-30"],
    queryFn: () => fetchRequests("2026-06-01", "2026-06-30"),
  });

  // 登録フォーム入力の state（4つ）
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [staffId, setStaffId] = useState("");

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
  });

    function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate({
      date,
      start_time: startTime,
      end_time: endTime,
      staff_id: staffId,
    });
  }

  if (isLoading) return <p>読み込み中・・・</p>;
  if (isError) return <p>エラーが発生しました</p>;

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input value={date} onChange={(e) => setDate(e.target.value)} type="date" required />
        <input value={startTime} onChange={(e) => setStartTime(e.target.value)} type="time" required />
        <input value={endTime} onChange={(e) => setEndTime(e.target.value)} type="time" required />
        <input value={staffId} onChange={(e) => setStaffId(e.target.value)} type="item" required />
        <button type="submit">登録</button>
      </form>

      <ul>
        {data?.map((r) => (
          <li key={`${r.date}-${r.staff_id}`}>
            日付：{r.date} 時間：{r.start_time}〜{r.end_time} {r.staff_id}
          </li>
        ))}
      </ul>
    </div>
  )
}