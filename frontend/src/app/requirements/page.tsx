"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchRequirements, createRequirement } from "@/lib/api";

export default function RequirementsPage() {
  // ===== ① フック（全部ここ・先頭） =====
  const { data, isLoading, isError } = useQuery({
    queryKey: ["requirements", "2026-06-01", "2026-06-30"],
    queryFn: () => fetchRequirements("2026-06-01", "2026-06-30"),
  });

  // フォーム入力の state（4つ）
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [count, setCount] = useState("");

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: createRequirement,
    onSuccess: () => {
      // 登録成功 → 一覧を「古い」と印して自動で取り直す
      queryClient.invalidateQueries({ queryKey: ["requirements"] });
    },
  });

  // ===== ② イベントハンドラ =====
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); // 送信によるページ再読込を防ぐ
    mutation.mutate({
      date,
      start_time: startTime,
      end_time: endTime,
      required_count: Number(count), // input は文字列なので数値へ変換
    });
  }

  if (isLoading) return <p>読み込み中・・・</p>;
  if (isError) return <p>エラーが発生しました</p>;

  // ===== ③ JSX =====
  return (
    <div>
      <form onSubmit={handleSubmit}>
        {/* date：完成形の手本 */}
        <input
          value={date}
          onChange={(e) => setDate(e.target.value)}
          placeholder="日付 2026-06-12"
          type="date"
          required
        />

          <input
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            placeholder="開始 18:00"
            type="time"
            required
          />
          <input
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            placeholder="終了 22:00"
            type="time"
            required
          />
          <input
            value={count}
            onChange={(e) => setCount(e.target.value)}
            placeholder="必要人数 3"
            type="number"
            min={1}
            max={10}
            required
          />


        <button type="submit">登録</button>
      </form>

      {/* 登録の状態表示（デバッグ＆UX用） */}
      {mutation.isPending && <p>登録中...</p>}
      {mutation.isError && (
        <p style={{ color: "red" }}>登録に失敗：{String(mutation.error)}</p>
      )}

      <ul>
        {data?.map((r) => (
          <li key={`${r.date}-${r.start_time}`}>
            日付：{r.date} 時間：{r.start_time}〜{r.end_time} 必要人数：{r.required_count}人
          </li>
        ))}
      </ul>
    </div>
  );
}
