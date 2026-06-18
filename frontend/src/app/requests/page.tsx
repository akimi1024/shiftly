"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchRequests, createRequest, deleteRequest, createRequestBulk, fetchStaff } from "@/lib/api";
import { ShiftRequestResponse } from "@/types/requests";
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

export default function RequestsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["requests", "2026-06-01", "2026-06-30"],
    queryFn: () => fetchRequests("2026-06-01", "2026-06-30"),
  });

  // スタッフ一覧（ドロップダウン用）
  const { data: staffList } = useQuery({
    queryKey: ["staff"],
    queryFn: fetchStaff,
  });

  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [staffId, setStaffId] = useState("");

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
    mutationFn: ({ date, staff_id }: { date: string; staff_id: string }) =>
      deleteRequest(date, staff_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate({ date, start_time: startTime, end_time: endTime, staff_id: staffId });
  }

  function updateRow(index: number, field: keyof ShiftRequestResponse, value: string) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }
  function addRow() {
    setRows((prev) => [...prev, { date: "", staff_id: "", start_time: "", end_time: "" }]);
  }
  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }
  function handleBulkSubmit(e: React.FormEvent) {
    e.preventDefault();
    bulkMutation.mutate(rows);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">シフト希望</h1>

      {/* 単体登録 */}
      <Card>
        <CardHeader>
          <CardTitle>単体登録</CardTitle>
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
              <label className="text-sm text-neutral-600">スタッフ</label>
              <select
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                required
                className="h-9 w-40 rounded-md border border-neutral-200 bg-transparent px-3 text-sm"
              >
                <option value="">選択してください</option>
                {staffList?.map((s) => (
                  <option key={s.staff_id} value={s.staff_id}>
                    {s.name}（{s.staff_id}）
                  </option>
                ))}
              </select>
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

      {/* 一括登録 */}
      <Card>
        <CardHeader>
          <CardTitle>一括登録</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleBulkSubmit} className="space-y-3">
            {rows.map((row, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <Input type="date" value={row.date} onChange={(e) => updateRow(i, "date", e.target.value)} required className="w-40" />
                <Input type="time" value={row.start_time} onChange={(e) => updateRow(i, "start_time", e.target.value)} required className="w-28" />
                <Input type="time" value={row.end_time} onChange={(e) => updateRow(i, "end_time", e.target.value)} required className="w-28" />
                <select
                  value={row.staff_id}
                  onChange={(e) => updateRow(i, "staff_id", e.target.value)}
                  required
                  className="h-9 w-40 rounded-md border border-neutral-200 bg-transparent px-3 text-sm"
                >
                  <option value="">選択してください</option>
                  {staffList?.map((s) => (
                    <option key={s.staff_id} value={s.staff_id}>
                      {s.name}（{s.staff_id}）
                    </option>
                  ))}
                </select>
                <Button type="button" variant="outline" size="sm" onClick={() => removeRow(i)}>行削除</Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={addRow}>行を追加</Button>
              <Button type="submit" disabled={bulkMutation.isPending}>
                {bulkMutation.isPending ? "登録中..." : "一括登録"}
              </Button>
            </div>
          </form>
          {bulkMutation.isError && (
            <p className="mt-2 text-sm text-red-600">一括登録に失敗：{String(bulkMutation.error)}</p>
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
                  <TableHead>スタッフ</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.map((r) => (
                  <TableRow key={`${r.date}-${r.staff_id}`}>
                    <TableCell>{r.date}</TableCell>
                    <TableCell>{r.start_time}〜{r.end_time}</TableCell>
                    <TableCell>{r.staff_id}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteMutation.mutate({ date: r.date, staff_id: r.staff_id })}
                      >
                        削除
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
