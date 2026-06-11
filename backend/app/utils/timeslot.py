DAY_MINUTES_TIME = 1440

def to_minutes(hhmm: str) -> int:
    hh, mm = hhmm.split(":")
    hh_to_mm = int(hh)
    hh_to_mm = hh_to_mm * 60
    return hh_to_mm + int(mm)

def normalize(hhmm: str, open_hhmm: str) -> int:
    staff_time = to_minutes(hhmm)
    store_time = to_minutes(open_hhmm)

    if staff_time < store_time:
        staff_time = staff_time + DAY_MINUTES_TIME

    return staff_time

def to_hhmm(minutes: int) -> str:
    m = minutes % DAY_MINUTES_TIME
    h = m // 60
    mm = m % 60
    return f"{h:02d}:{mm:02d}"