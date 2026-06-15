# Shiftly - CLAUDE.md

## プロジェクト概要
小規模店舗（飲食店等）のシフト調整業務を支援するアプリ。
店長が主な操作ユーザーで、バイトのシフト希望を管理し、過不足チェックを行う。

---

## 技術スタック
| レイヤー | 技術 |
|---|---|
| フロント | Next.js (TypeScript) |
| バック | Python + FastAPI |
| ORM相当 | PynamoDB |
| DB | DynamoDB |
| インフラ | Lambda + API Gateway + CloudFront |
| IaC | AWS CDK（TypeScript） |

---

## ディレクトリ構成
```
shiftly/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── types/
│   ├── package.json
│   └── tsconfig.json
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── routers/
│   │   │   ├── shift_requests.py
│   │   │   ├── shift_requirements.py
│   │   │   ├── shortage.py
│   │   │   └── shifts.py
│   │   ├── models/
│   │   │   ├── store.py
│   │   │   ├── staff.py
│   │   │   ├── shift_request.py
│   │   │   ├── shift_requirement.py
│   │   │   └── shift.py
│   │   ├── schemas/
│   │   │   ├── store.py
│   │   │   ├── staff.py
│   │   │   ├── shift_request.py
│   │   │   ├── shift_requirement.py
│   │   │   ├── shortage.py
│   │   │   └── shift.py
│   │   └── services/
│   │       ├── shift_request.py
│   │       ├── shift_requirement.py
│   │       ├── shortage.py
│   │       └── shift.py
│   ├── requirements.txt
│   └── lambda_handler.py
└── infra/
├── bin/
│   └── app.ts
├── lib/
│   └── shift-app-stack.ts
├── package.json
└── tsconfig.json
```

---

## エンティティ一覧
- Store（店舗）
- Staff（スタッフ）：店長・バイトをロールで区別
- ShiftRequest（シフト希望）：出勤可能時間帯の可用性情報
- ShiftRequirement（必要人数）：日付×時間帯単位で設定
- Shift（確定シフト）：ShiftRequestとは独立して管理

---

## DynamoDBキー設計方針
- シングルテーブル設計（テーブル: `shiftly`、PK+SKの複合キー）
- 店舗で束ね（PK）、日付・時間帯・スタッフで範囲/区別（SK）する
- 種別は PK の `TYPE#XXX` で棚を分ける（Storeのみ1件確定のためTYPE無し）
- 詳細・アクセスパターンは `docs/db-design.md` を参照

| エンティティ | PK | SK |
|---|---|---|
| Store | `STORE#{storeId}` | `PROFILE` |
| Staff | `STORE#{storeId}#TYPE#STAFF` | `STAFF#{staffId}` |
| ShiftRequest | `STORE#{storeId}#TYPE#REQUEST` | `DATE#{date}#{staffId}` |
| ShiftRequirement | `STORE#{storeId}#TYPE#REQUIREMENT` | `DATE#{date}#{start_time}` |
| Shift | `STORE#{storeId}#TYPE#SHIFT` | `DATE#{date}#{staffId}` |

---

## API一覧（MVP）

### ShiftRequest
| メソッド | エンドポイント | 説明 |
|---|---|---|
| POST | `/stores/{storeId}/requests` | 店長がシフト希望を登録 |
| GET | `/stores/{storeId}/requests` | 店長が全スタッフの希望を取得 |
| DELETE | `/stores/{storeId}/requests/{id}` | 店長が希望を削除 |

### ShiftRequirement
| メソッド | エンドポイント | 説明 |
|---|---|---|
| POST | `/stores/{storeId}/requirements` | 必要人数を登録 |
| PUT | `/stores/{storeId}/requirements/{id}` | 必要人数を更新 |
| GET | `/stores/{storeId}/requirements` | 必要人数を取得 |
| DELETE | `/stores/{storeId}/requirements/{id}` | 必要人数を削除 |

### Shortage
| メソッド | エンドポイント | 説明 |
|---|---|---|
| GET | `/stores/{storeId}/shortage` | 過不足状態を取得 |

### Shift
| メソッド | エンドポイント | 説明 |
|---|---|---|
| POST | `/stores/{storeId}/shifts` | 確定シフトを一括登録（Bodyの対象期間内のみ許可。期間外が1件でもあれば全体を拒否） |
| PUT | `/stores/{storeId}/shifts/{id}` | 確定シフトを1件修正 |
| GET | `/stores/{storeId}/shifts` | 期間指定で一覧取得 |
| DELETE | `/stores/{storeId}/shifts/{id}` | 確定シフトを1件削除 |

---

## 設計方針
- APIは判断を代替しない（自動シフト生成・最適化は行わない）
- 店舗単位でデータを管理（`/stores/{storeId}/...`を必須とする）
- MVPと将来拡張を明示的に分けて管理する
- 希望データ（ShiftRequest）と確定データ（Shift）は明確に分離する
- 日付形式：`YYYY-MM-DD`、時刻形式：`HH:mm`
- 認証なし（MVP）、仮ヘッダで役割識別：`X-Role: manager | staff`