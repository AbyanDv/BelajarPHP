# =========================
#  FUZZIFICATION FUNCTIONS
# =========================

def screentime_rendah(x):
    if x <= 2:
        return 1
    if x >= 4:
        return 0
    return (4 - x) / 2

def screentime_sedang(x):
    if x <= 3:
        return 0
    if x <= 5.5:
        return (x - 3) / 2.5
    if x <= 8:
        return (8 - x) / 2.5
    return 0

def screentime_tinggi(x):
    if x <= 7:
        return 0
    if x >= 10:
        return 1
    return (x - 7) / 3


def temperature_dingin(x):
    if x <= 18:
        return 1
    if x >= 22:
        return 0
    return (22 - x) / 4

def temperature_nyaman(x):
    if x <= 20 or x >= 28:
        return 0
    if x <= 24:
        return (x - 20) / 4
    if x <= 28:
        return (28 - x) / 4
    return 0

def temperature_panas(x):
    if x <= 26:
        return 0
    if x >= 30:
        return 1
    return (x - 26) / 4


def stress_rendah(x):
    if x <= 20:
        return 1
    if x >= 40:
        return 0
    return (40 - x) / 20

def stress_sedang(x):
    if x <= 30 or x >= 70:
        return 0
    if x <= 50:
        return (x - 30) / 20
    return (70 - x) / 20

def stress_tinggi(x):
    if x <= 60:
        return 0
    if x >= 80:
        return 1
    return (x - 60) / 20


# ==================================
#       INFERENCE / RULE ENGINE
# ==================================

RULES = [
    ("rendah", "dingin", "rendah"),
    ("rendah", "nyaman", "rendah"),
    ("rendah", "panas", "sedang"),
    ("sedang", "dingin", "sedang"),
    ("sedang", "nyaman", "sedang"),
    ("sedang", "panas", "tinggi"),
    ("tinggi", "dingin", "tinggi"),
    ("tinggi", "nyaman", "tinggi"),
    ("tinggi", "panas", "tinggi"),
]


def evaluate_rules(st_membership, temp_membership):
    active = []
    for st_cat, temp_cat, out_cat in RULES:
        α = min(st_membership[st_cat], temp_membership[temp_cat])
        if α > 0:
            active.append({
                "st": st_cat,
                "temp": temp_cat,
                "output": out_cat,
                "condition": α
            })
    return active


# ================================
#          DEFUZZIFICATION
# ================================

def defuzzify(active_rules):
    if not active_rules:
        return 50  # default

    numerator = 0
    denominator = 0

    for z in range(0, 101):
        membership = 0

        for rule in active_rules:
            if rule["output"] == "rendah":
                out_mu = stress_rendah(z)
            elif rule["output"] == "sedang":
                out_mu = stress_sedang(z)
            else:
                out_mu = stress_tinggi(z)

            membership = max(membership, min(rule["condition"], out_mu))

        numerator += z * membership
        denominator += membership

    if denominator == 0:
        return 50
    return numerator / denominator


# =======================================================
#  MAIN FUNCTION → CALL THIS FROM SERVER ENDPOINT
# =======================================================

def calculate_stress(screentime, temperature):
    # fuzzification
    st_membership = {
        "rendah": screentime_rendah(screentime),
        "sedang": screentime_sedang(screentime),
        "tinggi": screentime_tinggi(screentime)
    }

    temp_membership = {
        "dingin": temperature_dingin(temperature),
        "nyaman": temperature_nyaman(temperature),
        "panas": temperature_panas(temperature)
    }

    # inference
    active_rules = evaluate_rules(st_membership, temp_membership)

    # defuzzification
    level = defuzzify(active_rules)

    return {
        "stress_value": level,
        "category": (
            "Rendah" if level < 35 else
            "Sedang" if level < 65 else
            "Tinggi"
        ),
        "active_rules": active_rules,
        "memberships": {
            "screentime": st_membership,
            "temperature": temp_membership
        }
    }


# =======================================================
#  Example usage
# =======================================================

if __name__ == "__main__":
    print(calculate_stress(5.5, 25))
