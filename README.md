# Shiftly

小規模店舗（飲食店等）の**シフト調整業務を支援する**Webアプリ。
店長を主な利用者とし、バイトのシフト希望の管理・必要人数の設定・過不足チェック・確定シフト作成を行う。

> **⚠️ 現状は MVP（Minimum Viable Product）です。**
> 必要最小限の機能のみを実装した検証段階で、認証は簡易な共有トークン方式、店舗は単一前提など割り切った設計になっています。フィードバックを受けて段階的に拡張していく予定です。

> 設計方針：アプリは判断を代替しない（自動シフト生成・最適化はしない）。あくまで店長の意思決定を支援する。

---

## 技術スタック

| レイヤー | 技術 |
|---|---|
| フロント | Next.js 16 (App Router) / React 19 / TypeScript / Tailwind CSS v4 / shadcn/ui / TanStack Query v5 |
| バック | Python + FastAPI / PynamoDB / Mangum |
| DB | DynamoDB（シングルテーブル設計） |
| インフラ | Lambda + API Gateway + S3 + CloudFront |
| IaC | AWS CDK (TypeScript) |

---

## ディレクトリ構成

```
shiftly/
├── frontend/        # Next.js（静的エクスポート → S3/CloudFront 配信）
│   └── src/
│       ├── app/         # 画面（requirements / requests / shortage / shifts / settings）
│       ├── components/  # Nav, TokenGate, ui/（shadcn）
│       ├── lib/         # api.ts（fetchラッパ）
│       └── types/
├── backend/         # FastAPI（Lambda 上で Mangum 経由で起動）
│   ├── app/
│   │   ├── main.py
│   │   ├── routers/     # shift_requests / shift_requirements / shifts / shortage / staff / store
│   │   ├── models/      # PynamoDB モデル
│   │   ├── schemas/     # Pydantic スキーマ
│   │   ├── services/    # ビジネスロジック
│   │   └── utils/       # keys（PK/SK生成） / timeslot（時刻正規化） / auth（トークン認証）
│   ├── requirements.txt
│   └── lambda_handler.py
├── infra/           # AWS CDK スタック
│   └── lib/shift-app-stack.ts
└── docs/
    └── db-design.md     # DynamoDB キー設計・アクセスパターン
```

---

## エンティティ

- **Store**（店舗）：1店舗1レコード。営業時間（open/close）、スタッフ採番カウンタを持つ
- **Staff**（スタッフ）：店長・バイトを role（`manager` / `staff`）で区別。staff_id は `店舗名+連番`（例 `A001-001`）で自動採番
- **ShiftRequest**（シフト希望）：出勤可能時間帯
- **ShiftRequirement**（必要人数）：日付 × 時間帯単位
- **Shift**（確定シフト）：希望とは独立して管理

DynamoDB は単一テーブル `shiftly`（PK + SK の複合キー）。詳細は [`docs/db-design.md`](docs/db-design.md) を参照。

---

## API 一覧

すべて `/stores/{storeId}/...` 配下。

| リソース | エンドポイント |
|---|---|
| シフト希望 | `POST/GET/DELETE /requests`、`POST /requests/bulk` |
| 必要人数 | `POST/GET/PUT/DELETE /requirements` |
| 過不足 | `GET /shortage` |
| 確定シフト | `POST/GET/PUT/DELETE /shifts`（POST は期間内一括登録） |
| スタッフ | `POST/GET/DELETE /staff` |
| 店舗 | `GET/PUT /stores/{storeId}` |

- 日付形式：`YYYY-MM-DD` / 時刻形式：`HH:mm`
- 認証：共有トークン方式。全リクエストに `X-Auth-Token` ヘッダが必要（後述）

---

## ローカル開発

### 前提
- Docker（DynamoDB Local 用）
- Python 3.12 / Node.js

### 1. DynamoDB Local 起動（ポート 8000）

```bash
docker run -p 8000:8000 amazon/dynamodb-local
```

※ メモリ実行のため再起動でテーブルは消える。シードスクリプトで再作成する。

### 2. バックエンド起動（ポート 8080）

```bash
cd backend
pip install -r requirements.txt

# ローカル用 env（値はダミーで可。DYNAMODB_HOST を指定するとローカルDBに接続）
export DYNAMODB_HOST=http://localhost:8000
export AWS_ACCESS_KEY_ID=dummy
export AWS_SECRET_ACCESS_KEY=dummy
export AWS_DEFAULT_REGION=ap-northeast-1
# API_TOKEN を設定しなければ認証は素通り（ローカル開発用）

uvicorn app.main:app --reload --port 8080
```

> `DYNAMODB_HOST` が未設定だと本番 DynamoDB に接続する。ローカルでは必ず設定すること。

### 3. フロントエンド起動（ポート 3000）

```bash
cd frontend
npm install
```

`frontend/.env.local` を作成：

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_STORE_ID=A001
```

```bash
npm run dev
```

http://localhost:3000 で起動。

> インフラは AWS CDK（`infra/`）で Lambda / API Gateway / DynamoDB / S3 / CloudFront を構築している。デプロイ手順は省略。

---

## 認証

MVP のため簡易な**共有トークン方式**を採用。

- バックエンド：`X-Auth-Token` を環境変数 `API_TOKEN` と照合（未設定なら素通り＝ローカル用）
- フロント：初回にトークンを入力（`TokenGate`）、`localStorage` に保存し全リクエストに付与
- API Gateway に**スロットリング**（20 rps / burst 10）を設定し、過剰アクセス時のコスト増を抑制

将来の堅牢化候補：SSM / Secrets Manager 化、CORS を CloudFront ドメイン限定、WAF、本格的な認証（Cognito 等）。

---

## ライセンス

学習目的のプロジェクト。
