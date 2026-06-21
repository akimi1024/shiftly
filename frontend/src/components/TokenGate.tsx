"use client";
import { useState, useEffect } from "react";
import { getToken, setToken } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// トークン未設定なら入力画面、設定済みなら中身(アプリ)を表示するゲート
export default function TokenGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [input, setInput] = useState("");

  // localStorage はクライアントのみ → マウント後に読む（チラ見え防止）
  useEffect(() => {
    setHasToken(!!getToken());
    setReady(true);
  }, []);

  if (!ready) return null;

  if (!hasToken) {
    return (
      <div className="mx-auto mt-24 w-full max-w-sm space-y-3 px-4">
        <h1 className="text-xl font-bold">Shiftly</h1>
        <p className="text-sm text-neutral-600">アクセストークンを入力してください</p>
        <Input
          type="password"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="トークン"
        />
        <Button
          className="w-full"
          disabled={!input}
          onClick={() => {
            setToken(input);
            setHasToken(true);
          }}
        >
          入る
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
