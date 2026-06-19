"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchShifts,
  createShiftsBulk,
  updateShift,
  deleteShift,
  fetchRequests,
  fetchShortage,
  fetchStaff,
} from "@/lib/api";
import { ShiftResponse } from "@/types/shift";
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

const FROM = "2026-06-01";
const TO = "2026-06-30";
const BUCKET = 30;

type Selection = { start_time: string; end_time: string };

function toMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function toHHMM(min: number): string {
  const m = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}
// 連続する同じ過不足のバケットを「時間帯レンジ」に畳む（APIの配列順＝時刻順を前提）
function mergeShortage(items: { time: string; shortage: number }[]) {
  const out: { start: string; end: string; shortage: number }[] = [];
  for (const it of items) {
    const last = out[out.length - 1];
    if (last && last.shortage === it.shortage && toMin(it.time) === toMin(last.end)) {
      last.end = toHHMM(toMin(it.time) + BUCKET); // 連続→終端を伸ばす
    } else {
      out.push({ start: it.time, end: toHHMM(toMin(it.time) + BUCKET), shortage: it.shortage });
    }
  }
  return out;
}

export default function ShiftsPage() {
  // 表示する期間（画面で指定）
  const [from, setFrom] = useState(FROM);
  const [to, setTo] = useState(TO);

  const shiftsQuery = useQuery({ queryKey: ["shifts", from, to], queryFn: () => fetchShifts(from, to) });
  const requestsQuery = useQuery({ queryKey: ["requests", from, to], queryFn: () => fetchRequests(from, to) });
  const shortageQuery = useQuery({ queryKey: ["shortage", from, to], queryFn: () => fetchShortage(from, to) });
  const staffQuery = useQuery({ queryKey: ["staff"], queryFn: fetchStaff });

  // 希望→確定の選択。key = date#staff_id、値 = 調整後時間。存在＝選択中。
  const [selections, setSelections] = useState<Record<string, Selection>>({});

  // 希望にない人を追加するフォーム（日付ごと）
  type Manual = { staff_id: string; start_time: string; end_time: string };
  const [manualByDate, setManualByDate] = useState<Record<string, Manual>>({});

  // 確定済みのインライン編集
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");

  const queryClient = useQueryClient();

  const bulkMutation = useMutation({
    mutationFn: ({ periodFrom, periodTo, shifts }: { periodFrom: string; periodTo: string; shifts: ShiftResponse[] }) =>
      createShiftsBulk(periodFrom, periodTo, shifts),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      setSelections({});
      setManualByDate({});
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ date, staff_id, body }: { date: string; staff_id: string; body: { start_time: string; end_time: string } }) =>
      updateShift(date, staff_id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      setEditingKey(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ date, staff_id }: { date: string; staff_id: string }) => deleteShift(date, staff_id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shifts"] }),
  });

  function toggleSelect(r: ShiftRequestResponse) {
    const key = `${r.date}#${r.staff_id}`;
    setSelections((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = { start_time: r.start_time, end_time: r.end_time };
      return next;
    });
  }
  function updateSelTime(key: string, field: keyof Selection, value: string) {
    setSelections((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  }

  // その日の選択分を確定（period = その日）
  function handleConfirmDate(date: string) {
    const reqs = requestsQuery.data ?? [];
    const shifts: ShiftResponse[] = reqs
      .filter((r) => r.date === date && selections[`${r.date}#${r.staff_id}`])
      .map((r) => {
        const sel = selections[`${r.date}#${r.staff_id}`];
        return { date: r.date, staff_id: r.staff_id, start_time: sel.start_time, end_time: sel.end_time };
      });
    if (shifts.length === 0) return;
    bulkMutation.mutate({ periodFrom: date, periodTo: date, shifts });
  }

  // 希望にない人を1件追加（その日に確定シフトを作る）
  function setManual(date: string, field: keyof Manual, value: string) {
    setManualByDate((prev) => ({
      ...prev,
      [date]: { ...(prev[date] ?? { staff_id: "", start_time: "", end_time: "" }), [field]: value },
    }));
  }
  function handleAddManual(date: string) {
    const m = manualByDate[date];
    if (!m || !m.staff_id || !m.start_time || !m.end_time) return;
    bulkMutation.mutate({
      periodFrom: date,
      periodTo: date,
      shifts: [{ date, staff_id: m.staff_id, start_time: m.start_time, end_time: m.end_time }],
    });
  }

  function startEdit(r: ShiftResponse) {
    setEditingKey(`${r.date}#${r.staff_id}`);
    setEditStart(r.start_time);
    setEditEnd(r.end_time);
  }
  function saveEdit(r: ShiftResponse) {
    updateMutation.mutate({ date: r.date, staff_id: r.staff_id, body: { start_time: editStart, end_time: editEnd } });
  }

  // 日付の一覧（希望・過不足・確定の全部から集める）
  const allDates = Array.from(
    new Set([
      ...(requestsQuery.data ?? []).map((r) => r.date),
      ...(shortageQuery.data ?? []).map((s) => s.date),
      ...(shiftsQuery.data ?? []).map((s) => s.date),
    ])
  ).sort();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">確定シフト</h1>

      {/* 期間指定 */}
      <Card>
        <CardHeader>
          <CardTitle>表示期間</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-sm text-neutral-600">期間（開始）</label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-neutral-600">期間（終了）</label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
          </div>
        </CardContent>
      </Card>

      {allDates.length === 0 && (
        <p className="text-sm text-neutral-500">対象期間にデータがありません</p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {allDates.map((date) => {
        const dayShortage = (shortageQuery.data ?? []).filter((s) => s.date === date);
        const dayRequests = (requestsQuery.data ?? []).filter((r) => r.date === date);
        const dayShifts = (shiftsQuery.data ?? []).filter((s) => s.date === date);
        const daySelected = dayRequests.filter((r) => selections[`${r.date}#${r.staff_id}`]).length;

        const manual = manualByDate[date] ?? { staff_id: "", start_time: "", end_time: "" };

        return (
          <Card key={date} className="h-full">
            <CardHeader>
              <CardTitle>{date}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 過不足 */}
              <div>
                <p className="mb-1 text-sm font-medium text-neutral-600">過不足</p>
                {dayShortage.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {mergeShortage(dayShortage).map((r, i) => (
                      <span
                        key={i}
                        className={`rounded px-2 py-1 text-xs ${
                          r.shortage > 0 ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {r.start}〜{r.end} {r.shortage > 0 ? `不足${r.shortage}` : `過剰${-r.shortage}`}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-400">過不足なし</p>
                )}
              </div>

              {/* 希望から選ぶ */}
              <div>
                <p className="mb-1 text-sm font-medium text-neutral-600">シフト希望から選ぶ</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">選択</TableHead>
                      <TableHead>スタッフ</TableHead>
                      <TableHead>希望</TableHead>
                      <TableHead>確定する時間</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dayRequests.map((r) => {
                      const key = `${r.date}#${r.staff_id}`;
                      const sel = selections[key];
                      return (
                        <TableRow key={key}>
                          <TableCell>
                            <input type="checkbox" checked={!!sel} onChange={() => toggleSelect(r)} />
                          </TableCell>
                          <TableCell>{r.staff_id}</TableCell>
                          <TableCell className="text-neutral-500">{r.start_time}〜{r.end_time}</TableCell>
                          <TableCell>
                            {sel ? (
                              <span className="flex items-center gap-1">
                                <Input type="time" value={sel.start_time} onChange={(e) => updateSelTime(key, "start_time", e.target.value)} className="w-28" />
                                〜
                                <Input type="time" value={sel.end_time} onChange={(e) => updateSelTime(key, "end_time", e.target.value)} className="w-28" />
                              </span>
                            ) : (
                              <span className="text-neutral-400">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                <Button
                  className="mt-2"
                  size="sm"
                  onClick={() => handleConfirmDate(date)}
                  disabled={daySelected === 0 || bulkMutation.isPending}
                >
                  この日の{daySelected}件を確定する
                </Button>
              </div>

              {/* 希望にない人を追加 */}
              <div>
                <p className="mb-1 text-sm font-medium text-neutral-600">希望にない人を追加</p>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={manual.staff_id}
                    onChange={(e) => setManual(date, "staff_id", e.target.value)}
                    className="h-9 w-36 rounded-md border border-neutral-200 bg-transparent px-2 text-sm"
                  >
                    <option value="">スタッフ選択</option>
                    {staffQuery.data?.map((s) => (
                      <option key={s.staff_id} value={s.staff_id}>
                        {s.name}（{s.staff_id}）
                      </option>
                    ))}
                  </select>
                  <Input type="time" value={manual.start_time} onChange={(e) => setManual(date, "start_time", e.target.value)} className="w-28" />
                  〜
                  <Input type="time" value={manual.end_time} onChange={(e) => setManual(date, "end_time", e.target.value)} className="w-28" />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleAddManual(date)}
                    disabled={!manual.staff_id || !manual.start_time || !manual.end_time || bulkMutation.isPending}
                  >
                    追加
                  </Button>
                </div>
              </div>

              {/* この日の確定済み */}
              <div>
                <p className="mb-1 text-sm font-medium text-neutral-600">確定済み</p>
                {dayShifts.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>スタッフ</TableHead>
                        <TableHead>時間</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dayShifts.map((r) => {
                        const key = `${r.date}#${r.staff_id}`;
                        const isEditing = editingKey === key;
                        return (
                          <TableRow key={key}>
                            <TableCell>{r.staff_id}</TableCell>
                            <TableCell>
                              {isEditing ? (
                                <span className="flex items-center gap-1">
                                  <Input type="time" value={editStart} onChange={(e) => setEditStart(e.target.value)} className="w-28" />
                                  〜
                                  <Input type="time" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} className="w-28" />
                                </span>
                              ) : (
                                `${r.start_time}〜${r.end_time}`
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
                                  <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate({ date: r.date, staff_id: r.staff_id })}>削除</Button>
                                </>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-xs text-neutral-400">まだ確定なし</p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
      </div>
    </div>
  );
}
