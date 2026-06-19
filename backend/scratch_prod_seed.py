# 本番DynamoDBにStore A001を1件だけ作る（DYNAMODB_HOSTを設定しない=実DynamoDBへ）
# 認証は aws configure の実クレデンシャルを使用。region は base model Meta(ap-northeast-1)。
from app.models.store import Store
from app.utils.keys import StoreKey

STORE = "A001"
Store(
    StoreKey.pk(STORE), StoreKey.sk(),
    name="サンプル店", open_time="18:00", close_time="02:00", staff_seq=0,
).save()
print("seeded prod store:", STORE)
