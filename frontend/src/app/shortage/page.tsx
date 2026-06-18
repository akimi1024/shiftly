"use client";
import { useQuery } from "@tanstack/react-query";
import { fetchShortage } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ShortagePage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["shortage", "2026-06-01", "2026-06-30"],
    queryFn: () => fetchShortage("2026-06-01", "2026-06-30"),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">過不足</h1>

      <Card>
        <CardHeader>
          <CardTitle>過不足のある時間帯</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-neutral-500">読み込み中・・・</p>
          ) : isError ? (
            <p className="text-sm text-red-600">エラーが発生しました</p>
          ) : data && data.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日付</TableHead>
                  <TableHead>時間帯</TableHead>
                  <TableHead className="text-right">必要</TableHead>
                  <TableHead className="text-right">希望</TableHead>
                  <TableHead className="text-right">過不足</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((s) => {
                  const isShortage = s.shortage > 0; // 正=不足
                  return (
                    <TableRow key={`${s.date}-${s.time}`}>
                      <TableCell>{s.date}</TableCell>
                      <TableCell>{s.time}</TableCell>
                      <TableCell className="text-right">{s.required_count}</TableCell>
                      <TableCell className="text-right">{s.available_count}</TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          isShortage ? "text-red-600" : "text-blue-600"
                        }`}
                      >
                        {isShortage ? `不足 ${s.shortage}` : `過剰 ${-s.shortage}`}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-neutral-500">過不足のある時間帯はありません</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
