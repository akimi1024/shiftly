"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchRequirements,
  createRequirement,
  deleteRequirement,
  updateRequirement,
} from "@/lib/api";
import { ShiftRequirementResponse } from "@/types/requirements";

export default function RequirementsPage() {
  // ===== ① フック（全部ここ・先頭） =====
  const { data, isLoading, isError } = useQuery({
    queryKey: ["requirements", "2026-06-01", "2026-06-30"],
    queryFn: () => fetchRequirements("2026-06-01", "2026-06-30"),
  });

  // 登録フォーム入力の state（4つ）
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [count, setCount] = useState("");

  // 編集モードの state
  const [editingKey, setEditingKey] = useState<string | null>(null); // 編集中の行（null=誰も編集してない）
  const [editEndTime, setEditEndTime] = useState("");
  const [editCount, setEditCount] = useState("");

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createRequirement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requirements"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ date, startTime }: { date: string; startTime: string }) =>
      deleteRequirement(date, startTime),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requirements"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      date,
      startTime,
      body,
    }: {
      date: string;
      startTime: string;
      body: { required_count: number; end_time: string };
    }) => updateRequirement(date, startTime, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requirements"] });
      setEditingKey(null); // 保存できたら編集モードを抜ける
    },
  });

  // ===== ② イベントハンドラ =====
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate({
      date,
      start_time: startTime,
      end_time: endTime,
      required_count: Number(count),
    });
  }

  // 編集開始：その行の値を編集用stateに入れて、編集モードにする
  function startEdit(r: ShiftRequirementResponse) {
    setEditingKey(`${r.date}#${r.start_time}`);
    setEditEndTime(r.end_time);
    setEditCount(String(r.required_count));
  }

  // 保存：編集用stateの値でPUT
  function saveEdit(r: ShiftRequirementResponse) {
    updateMutation.mutate({
      date: r.date,
      startTime: r.start_time,
      body: { required_count: Number(editCount), end_time: editEndTime },
    });
  }

  if (isLoading) return <p>読み込み中・・・</p>;
  if (isError) return <p>エラーが発生しました</p>;

  // ===== ③ JSX =====
  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input value={date} onChange={(e) => setDate(e.target.value)} type="date" required />
        <input value={startTime} onChange={(e) => setStartTime(e.target.value)} type="time" required />
        <input value={endTime} onChange={(e) => setEndTime(e.target.value)} type="time" required />
        <input value={count} onChange={(e) => setCount(e.target.value)} type="number" min={1} max={10} required />
        <button type="submit">登録</button>
      </form>

      {mutation.isPending && <p>登録中...</p>}
      {mutation.isError && (
        <p style={{ color: "red" }}>登録に失敗：{String(mutation.error)}</p>
      )}

      <ul>
        {data?.map((r) => {
          const key = `${r.date}#${r.start_time}`;
          const isEditing = editingKey === key;
          return (
            <li key={key}>
              {isEditing ? (
                // --- 編集中の行：入力欄に切り替え ---
                <>
                  日付：{r.date} 時間：{r.start_time}〜
                  <input
                    type="time"
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                  />
                  必要人数：
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={editCount}
                    onChange={(e) => setEditCount(e.target.value)}
                  />
                  人
                  <button onClick={() => saveEdit(r)}>保存</button>
                  <button onClick={() => setEditingKey(null)}>キャンセル</button>
                </>
              ) : (
                // --- 通常の行：テキスト表示 ---
                <>
                  日付：{r.date} 時間：{r.start_time}〜{r.end_time} 必要人数：
                  {r.required_count}人
                  <button onClick={() => startEdit(r)}>編集</button>
                  <button
                    onClick={() =>
                      deleteMutation.mutate({ date: r.date, startTime: r.start_time })
                    }
                  >
                    削除
                  </button>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
