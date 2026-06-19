# Shiftly DynamoDB 設計書

## 方針
- **シングルテーブル設計**：全エンティティを1つのテーブル `shiftly` に格納する。
- テーブルは PK + SK の複合キー（前回CDKで定義済み）。
- エンティティの種別は **PKに `TYPE#XXX` を含めて棚を分ける**ことで区別する（Storeを除く）。
- `TYPE` / `STORE` / `DATE` などは DynamoDB の機能ではなく、人間が読むための **ただの区切り文字列**（区切りは `#`）。

## 設計の前提（業務要件）
- 1店舗の Store 情報は1件のみ。
- シフト希望（ShiftRequest）・確定シフト（Shift）は **1人1日1件**（居酒屋運用のため分割勤務なし）。
- 必要人数（ShiftRequirement）は1日に複数時間帯を持てる（開始時刻で区別）。
- 同一キーへの再登録は **上書き**（希望・必要人数の出し直しを許容）。

## キー設計一覧

| エンティティ | PK | SK | 主な属性 |
|---|---|---|---|
| Store | `STORE#{storeId}` | `PROFILE` | name など |
| Staff | `STORE#{storeId}#TYPE#STAFF` | `STAFF#{staffId}` | name, role（manager/staff） |
| ShiftRequest | `STORE#{storeId}#TYPE#REQUEST` | `DATE#{date}#{staffId}` | start_time, end_time |
| ShiftRequirement | `STORE#{storeId}#TYPE#REQUIREMENT` | `DATE#{date}#{start_time}` | end_time, required_count |
| Shift | `STORE#{storeId}#TYPE#SHIFT` | `DATE#{date}#{staffId}` | start_time, end_time |

- Store のみ1件確定のため `TYPE` を持たない（区別すべき同居レコードが無いため冗長を排除）。
- `date` 形式：`YYYY-MM-DD`、`start_time`/`end_time` 形式：`HH:mm`。

## 1件特定用 id（PUT / DELETE 用）
URLパスの `{id}` から PK/SK を復元する。storeId はURLパスから取得する。

| エンティティ | {id} の形 | 例 |
|---|---|---|
| Staff | `{staffId}` | `STAFF001` |
| ShiftRequest | `{date}#{staffId}` | `2026-06-01#STAFF001` |
| ShiftRequirement | `{date}#{start_time}` | `2026-06-01#09:00` |
| Shift | `{date}#{staffId}` | `2026-06-01#STAFF001` |

## アクセスパターン（API → クエリ対応）

### ShiftRequest
- POST `/requests`：PK+SK で Put（同一キーは上書き＝希望の出し直し）。
- GET `/requests`：PK 完全一致 + SK `between DATE#{from} ～ DATE#{to}` で**期間指定取得**。
  - `from`/`to` は**必須**（全件取得は許可しない＝データ大量化を防ぐ）。
  - デフォルト期間はバックエンドで補完せず、フロント側が明示的に指定する（ユーザーに見える形で期間を扱う）。
- DELETE `/requests/{id}`：`{id}`=`date#staffId` から SK を復元し1件削除。

### ShiftRequirement
- POST `/requirements`：PK+SK で Put（同一キーは上書き）。
- PUT `/requirements/{id}`：`{id}`=`date#start_time` から特定し更新。
- GET `/requirements`：PK 完全一致 + SK `between DATE#{from} ～ DATE#{to}` で期間取得。
- DELETE `/requirements/{id}`：同上で1件削除。

### Shift
- POST `/shifts`：複数日分を PK+SK で一括 Put。Body に対象期間 `period_from`/`period_to`（ともに必須）を含める。
  - **バリデーション**：
    - `period_from > period_to` は 400。
    - 各シフトの date が期間外（`period_from <= date <= period_to` を満たさない、両端含む）なら **POST全体を拒否（400、部分登録しない）**。
    - 登録件数の固定上限は設けない（期間は店長が指定する）。
    - Body内に同一 `date+staffId` が複数あれば **後勝ち上書き**（同一SKへの再Put）。
  - ※ 過去日付の保護はMVPでは行わない（Shiftは店長専用エンティティのため）。
- PUT `/shifts/{id}`：`{id}`=`date#staffId` から特定し1件更新。
- GET `/shifts`：PK 完全一致 + SK `between DATE#{from} ～ DATE#{to}`（期間指定一覧）。
- DELETE `/shifts/{id}`：同上で1件削除。

### Shortage
- GET `/shortage`：ShiftRequirement（必要人数）と **Shift（確定シフト）** を突き合わせて過不足を算出。
  - `available_count` は「その時間帯に**確定済み**のスタッフ数」。確定を進めるほど不足が減る。
  - それぞれ上記の PK + SK 範囲クエリで取得して、アプリ側で30分バケットで集計する。
  - 時刻正規化は閉店基準（`close<open` かつ `t<=close` のみ +1440）で、仕込み等の開店前時間も扱える。

## クエリのテクニック
- **完全一致**：`PK = ... AND SK = ...` → 1件特定（PUT/DELETE/単一GET）。
- **前方一致**：`begins_with(SK, "DATE#{date}")` → 特定1日の全レコード。
- **範囲**：`between DATE#{from} ～ DATE#{to}` → 期間一覧。
- ※ SK は先頭を `DATE#` にすることで日付の範囲・前方一致が機能する（順序が重要）。

## 既知の論点（MVPでは未対応）
- 店舗単位で全エンティティを横断取得したい場合、PKが種別ごとに分かれているため複数クエリが必要。
  MVPのAPIには該当要件が無いため現設計で問題ない。将来必要になればGSIやPK設計の見直しを検討する。
- **特定スタッフ単位での希望/シフト取得**（例：スタッフ本人が自分の希望を期間で見る、店長が1人に絞る）。
  現SK `DATE#{date}#{staffId}` は date が先頭・staffId が末尾のため、staffId を軸にした範囲クエリは前方一致できず効率的に引けない（date を固定すれば1件特定は可能）。
  対応方針（必要になった時）：
  1. **まずA案**：既存の期間GETに `?staff_id=X` を足し、取得後にアプリ側でフィルタ（1店舗規模なら十分。キー設計変更不要）。
  2. **データ量が問題化したらB案**：staffId 起点のGSI（例 PK=`STORE#{storeId}#STAFF#{staffId}`, SK=`DATE#{date}`）を追加。
  3. SKを `STAFF#{staffId}#DATE#{date}` に変えるC案は「期間で全スタッフ」（店長の主用途）が壊れるため不採用。
  YAGNI：MVPでは作らない（店長視点の「期間で全員」は現GETで充足）。
