DAY_MINUTES_TIME = 1440

def to_minutes(hhmm: str) -> int:
    hh, mm = hhmm.split(":")
    hh_to_mm = int(hh)
    hh_to_mm = hh_to_mm * 60
    return hh_to_mm + int(mm)

def normalize(hhmm: str, open_hhmm: str, close_time: str) -> int:
    t = to_minutes(hhmm)
    open_m = to_minutes(open_hhmm)
    close_m = to_minutes(close_time)

    if close_m < open_m and t <= close_m:
        t += DAY_MINUTES_TIME
    return t

def to_hhmm(minutes: int) -> str:
    m = minutes % DAY_MINUTES_TIME
    h = m // 60
    mm = m % 60
    return f"{h:02d}:{mm:02d}"