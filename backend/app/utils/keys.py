class RequestKey:
    @staticmethod
    def pk(store_id: str) -> str:
        return f"STORE#{store_id}#TYPE#REQUEST"


    @staticmethod
    def sk(date: str, staff_id: str) -> str:
        return f"DATE#{date}#{staff_id}"

    @staticmethod
    def sk_date(date: str) -> str:
        return f"DATE#{date}"

    @staticmethod
    def sk_date_end(date: str) -> str:
        return f"DATE#{date}\uffff"