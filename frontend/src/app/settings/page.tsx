"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchStore, updateStore, fetchStaff, createStaff, deleteStaff } from "@/lib/api";
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

export default function SettingsPage() {
  const queryClient = useQueryClient();

  // ===== 店舗の時間設定 =====
  const storeQuery = useQuery({ queryKey: ["store"], queryFn: fetchStore });
  const [name, setName] = useState("");
  const [openTime, setOpenTime] = useState("");
  const [closeTime, setCloseTime] = useState("");

  // 取得できたらフォームに反映
  useEffect(() => {
    if (storeQuery.data) {
      setName(storeQuery.data.name);
      setOpenTime(storeQuery.data.open_time);
      setCloseTime(storeQuery.data.close_time);
    }
  }, [storeQuery.data]);

  const storeMutation = useMutation({
    mutationFn: updateStore,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["store"] }),
  });

  function handleStoreSubmit(e: React.FormEvent) {
    e.preventDefault();
    storeMutation.mutate({ name, open_time: openTime, close_time: closeTime });
  }

  // ===== スタッフ管理 =====
  const staffQuery = useQuery({ queryKey: ["staff"], queryFn: fetchStaff });
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("staff");

  const createMutation = useMutation({
    mutationFn: createStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      setNewName("");
      setNewRole("staff");
    },
  });
  const deleteStaffMutation = useMutation({
    mutationFn: deleteStaff,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["staff"] }),
  });

  function handleStaffSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate({ name: newName, role: newRole });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">設定</h1>

      {/* 店舗の時間設定 */}
      <Card>
        <CardHeader>
          <CardTitle>店舗・営業時間</CardTitle>
        </CardHeader>
        <CardContent>
          {storeQuery.isLoading ? (
            <p className="text-sm text-neutral-500">読み込み中・・・</p>
          ) : (
            <form onSubmit={handleStoreSubmit} className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <label className="text-sm text-neutral-600">店舗名</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required className="w-48" />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-neutral-600">開店</label>
                <Input type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} required className="w-28" />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-neutral-600">閉店</label>
                <Input type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} required className="w-28" />
              </div>
              <Button type="submit" disabled={storeMutation.isPending}>
                {storeMutation.isPending ? "保存中..." : "保存"}
              </Button>
            </form>
          )}
          {storeMutation.isError && (
            <p className="mt-2 text-sm text-red-600">保存に失敗：{String(storeMutation.error)}</p>
          )}
        </CardContent>
      </Card>

      {/* スタッフ管理 */}
      <Card>
        <CardHeader>
          <CardTitle>スタッフ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 追加フォーム（IDは自動採番） */}
          <form onSubmit={handleStaffSubmit} className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label className="text-sm text-neutral-600">名前</label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} required className="w-40" />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-neutral-600">役割</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="h-9 w-32 rounded-md border border-neutral-200 bg-transparent px-3 text-sm"
              >
                <option value="staff">staff</option>
                <option value="manager">manager</option>
              </select>
            </div>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "追加中..." : "追加"}
            </Button>
          </form>
          {createMutation.isError && (
            <p className="text-sm text-red-600">追加に失敗：{String(createMutation.error)}</p>
          )}

          {/* 一覧 */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>名前</TableHead>
                <TableHead>役割</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffQuery.data?.map((s) => (
                <TableRow key={s.staff_id}>
                  <TableCell>{s.staff_id}</TableCell>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{s.role}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="destructive" onClick={() => deleteStaffMutation.mutate(s.staff_id)}>
                      削除
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
