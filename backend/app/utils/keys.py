class BaseKey:
    @staticmethod
    def sk_date(date: str) -> str:
        return f"DATE#{date}"

    @staticmethod
    def sk_date_end(date: str) -> str:
        return f"DATE#{date}\uffff"


class RequestKey(BaseKey):
    @staticmethod
    def pk(store_id: str) -> str:
        return f"STORE#{store_id}#TYPE#REQUEST"

    @staticmethod
    def sk(date: str, staff_id: str) -> str:
        return f"DATE#{date}#{staff_id}"


class RequirementKey(BaseKey):
    @staticmethod
    def pk(store_id: str) -> str:
        return f"STORE#{store_id}#TYPE#REQUIREMENT"

    @staticmethod
    def sk(date: str, start_time: str) -> str:
        return f"DATE#{date}#{start_time}"


class StoreKey(BaseKey):
    @staticmethod
    def pk(store_id: str) -> str:
        return f"STORE#{store_id}"

    @staticmethod
    def sk() -> str:
        return "PROFILE"


class ShiftKey(BaseKey):
    @staticmethod
    def pk(store_id: str) -> str:
        return f"STORE#{store_id}#TYPE#SHIFT"

    @staticmethod
    def sk(date: str, staff_id: str) -> str:
        return f"DATE#{date}#{staff_id}"

class StaffKey(BaseKey):
    @staticmethod
    def pk(store_id: str) -> str:
        return f"STORE#{store_id}#TYPE#STAFF"

    @staticmethod
    def sk(staff_id: str) -> str:
        return f"STAFF#{staff_id}"