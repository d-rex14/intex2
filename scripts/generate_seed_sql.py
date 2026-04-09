"""
Generate supabase/migrations/20240101000001_seed_data.sql
from the raw CSV files in data/raw/.

Run from the project root:
    python scripts/generate_seed_sql.py
"""

import csv
import os
import math
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).parent.parent
DATA_DIR = ROOT / "data" / "raw"
OUT_FILE = ROOT / "supabase" / "migrations" / "20240101000001_seed_data.sql"

# Table insertion order respects FK dependencies
TABLE_ORDER = [
    "safehouses",
    "residents",
    "process_recordings",
    "health_wellbeing_records",
    "education_records",
    "incident_reports",
    "intervention_plans",
    "home_visitations",
    "safehouse_monthly_metrics",
    "supporters",
    "donations",
    "donation_allocations",
    "in_kind_donation_items",
    "partners",
    "partner_assignments",
    "public_impact_snapshots",
    "social_media_posts",
]

# Columns that should be cast as JSONB (pass through as-is, already valid JSON)
JSONB_COLS = {"metric_payload_json"}

# Columns that should always be treated as plain numeric (no quoting)
NUMERIC_COLS = {
    "safehouse_id", "resident_id", "recording_id", "health_record_id",
    "education_record_id", "incident_id", "plan_id", "visitation_id",
    "metric_id", "supporter_id", "donation_id", "allocation_id", "item_id",
    "partner_id", "assignment_id", "snapshot_id", "post_id",
    "session_duration_minutes", "capacity_girls", "capacity_staff",
    "current_occupancy", "active_residents", "process_recording_count",
    "home_visitation_count", "incident_count", "post_hour", "num_hashtags",
    "mentions_count", "caption_length", "impressions", "reach", "likes",
    "comments", "shares", "saves", "click_throughs", "video_views",
    "profile_visits", "donation_referrals", "follower_count_at_post",
    "subscriber_count_at_post", "quantity",
    "general_health_score", "nutrition_score", "sleep_quality_score",
    "energy_level_score", "height_cm", "weight_kg", "bmi",
    "attendance_rate", "progress_percent", "target_value",
    "amount", "estimated_value", "amount_allocated", "estimated_unit_value",
    "engagement_rate", "boost_budget_php", "watch_time_seconds",
    "avg_view_duration_seconds", "forwards", "estimated_donation_value_php",
    "referral_post_id",
    "avg_education_progress", "avg_health_score",
}

# Columns that are boolean
BOOLEAN_COLS = {
    "is_pwd", "has_special_needs",
    "sub_cat_orphaned", "sub_cat_trafficked", "sub_cat_child_labor",
    "sub_cat_physical_abuse", "sub_cat_sexual_abuse", "sub_cat_osaec",
    "sub_cat_cicl", "sub_cat_at_risk", "sub_cat_street_child",
    "sub_cat_child_with_hiv", "family_is_4ps", "family_solo_parent",
    "family_indigenous", "family_parent_pwd", "family_informal_settler",
    "progress_noted", "concerns_flagged", "referral_made",
    "medical_checkup_done", "dental_checkup_done", "psychological_checkup_done",
    "resolved", "follow_up_required", "safety_concerns_noted",
    "follow_up_needed", "is_recurring", "is_primary",
    "has_call_to_action", "features_resident_story", "is_boosted",
    "is_published",
}


def escape_sql_string(val: str) -> str:
    """Escape a string value for SQL insertion."""
    return val.replace("'", "''")


def format_value(col: str, raw: str) -> str:
    """Return a SQL-ready literal for (col, raw_string_value)."""
    # NULL handling
    if raw is None or raw.strip() == "" or raw.strip().lower() == "nan":
        return "NULL"

    v = raw.strip()

    if col in BOOLEAN_COLS:
        return "TRUE" if v.lower() in ("true", "1", "yes", "t") else "FALSE"

    if col in NUMERIC_COLS:
        try:
            f = float(v)
            if math.isnan(f) or math.isinf(f):
                return "NULL"
            # Return int literal if whole number
            return str(int(f)) if f == int(f) else str(f)
        except ValueError:
            return "NULL"

    if col in JSONB_COLS:
        return f"'{escape_sql_string(v)}'::jsonb"

    # Default: quoted string
    return f"'{escape_sql_string(v)}'"


def csv_to_insert(table: str, csv_path: Path) -> str:
    """Convert a CSV file to a block of INSERT statements."""
    lines = []
    lines.append(f"\n-- {table}")
    lines.append(f"INSERT INTO {table} VALUES")

    with open(csv_path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        cols = reader.fieldnames
        col_list = ", ".join(cols)
        lines[1] = f"\n-- {table}\nINSERT INTO {table} ({col_list})\nVALUES"

        rows = []
        for row in reader:
            vals = ", ".join(format_value(c, row[c]) for c in cols)
            rows.append(f"  ({vals})")

        lines.append(",\n".join(rows) + ";")

    return "\n".join(lines[1:])  # skip placeholder line[0], already in line[1]


def main():
    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    blocks = [
        "-- =============================================================================",
        "-- Lighthouse Sanctuary – Watchtower Seed Data",
        "-- Migration: 20240101000001_seed_data.sql",
        f"-- Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}",
        "-- =============================================================================",
        "",
        "-- Disable triggers temporarily for bulk load performance",
        "SET session_replication_role = replica;",
        "",
    ]

    for table in TABLE_ORDER:
        csv_path = DATA_DIR / f"{table}.csv"
        if not csv_path.exists():
            print(f"  SKIP  {table} — CSV not found at {csv_path}")
            continue
        print(f"  OK    {table}")
        blocks.append(csv_to_insert(table, csv_path))
        blocks.append("")

    blocks += [
        "-- Re-enable triggers",
        "SET session_replication_role = DEFAULT;",
        "",
    ]

    OUT_FILE.write_text("\n".join(blocks), encoding="utf-8")
    print(f"\nWrote {OUT_FILE}")


if __name__ == "__main__":
    main()
