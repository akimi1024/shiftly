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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function RequirementsPage() {
  // ===== ① フック（全部ここ・先頭） =====
  const { data, isLoading, isError } = useQuery({
    queryKey: ["requirements", "2026-06-01", "2026-06-30"],
    queryFn: () => fetchRequirements("2026-06-01", "2026-06-30"),
  });

  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [count, setCount] = useState("");

  const [editingKey, setEditingKey] = useState<string | null>(null);
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
      setEditingKey(null);
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

  function startEdit(r: ShiftRequirementResponse) {
    setEditingKey(`${r.date}#${r.start_time}`);
    setEditEndTime(r.end_time);
    setEditCount(String(r.required_count));
  }

  function saveEdit(r: ShiftRequirementResponse) {
    updateMutation.mutate({
      date: r.date,
      startTime: r.start_time,
      body: { required_count: Number(editCount), end_time: editEndTime },
    });
  }

  // ===== ③ JSX =====
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">必要人数</h1>

      {/* 登録フォーム */}
      <Card>
        <CardHeader>
          <CardTitle>必要人数を登録</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label className="text-sm text-neutral-600">日付</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="w-40" />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-neutral-600">開始</label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required className="w-28" />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-neutral-600">終了</label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required className="w-28" />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-neutral-600">必要人数</label>
              <Input type="number" min={1} max={10} value={count} onChange={(e) => setCount(e.target.value)} required className="w-24" />
            </div>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "登録中..." : "登録"}
            </Button>
          </form>
          {mutation.isError && (
            <p className="mt-2 text-sm text-red-600">登録に失敗：{String(mutation.error)}</p>
          )}
        </CardContent>
      </Card>

      {/* 一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>一覧</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-neutral-500">読み込み中・・・</p>
          ) : isError ? (
            <p className="text-sm text-red-600">エラーが発生しました</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日付</TableHead>
                  <TableHead>時間</TableHead>
                  <TableHead>必要人数</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.map((r) => {
                  const key = `${r.date}#${r.start_time}`;
                  const isEditing = editingKey === key;
                  return (
                    <TableRow key={key}>
                      <TableCell>{r.date}</TableCell>
                      <TableCell>
                        {r.start_time}〜
                        {isEditing ? (
                          <Input
                            type="time"
                            value={editEndTime}
                            onChange={(e) => setEditEndTime(e.target.value)}
                            className="ml-1 inline-block w-28"
                          />
                        ) : (
                          r.end_time
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            min={1}
                            max={10}
                            value={editCount}
                            onChange={(e) => setEditCount(e.target.value)}
                            className="w-20"
                          />
                        ) : (
                          `${r.required_count}人`
                        )}
                      </TableCell>
                      <TableCell className="space-x-2 text-right">
                        {isEditing ? (
                          <>
                            <Button size="sm" onClick={() => saveEdit(r)}>保存</Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingKey(null)}>キャンセル</Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="outline" onClick={() => startEdit(r)}>編集</Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteMutation.mutate({ date: r.date, startTime: r.start_time })}
                            >
                              削除
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
