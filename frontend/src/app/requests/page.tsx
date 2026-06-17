"use client"
import { useQuery } from "@tanstack/react-query";
import { fetchRequests } from "@/lib/api";

export default function RequestsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["requirements", "2026-06-01", "2026-06-30"],
    queryFn: () => fetchRequests("2026-06-01", "2026-06-30"),
  });

  return (
    <div>
      <ul>
        {data?.map((r) => (
          <li key={`${r.date}-${r.start_time}`}>
            日付：{r.date} 時間：{r.start_time}〜{r.end_time} {r.staff_id}
          </li>
        ))}
      </ul>
    </div>
  )
}