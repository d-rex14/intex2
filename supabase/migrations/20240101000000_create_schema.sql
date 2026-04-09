-- =============================================================================
-- Lighthouse Sanctuary – Watchtower Schema
-- Migration: 20240101000000_create_schema.sql
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. SAFEHOUSES  (no deps)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS safehouses (
    safehouse_id      INTEGER PRIMARY KEY,
    safehouse_code    TEXT NOT NULL,
    name              TEXT NOT NULL,
    region            TEXT,
    city              TEXT,
    province          TEXT,
    country           TEXT DEFAULT 'Philippines',
    open_date         DATE,
    status            TEXT,          -- Active | Inactive | Closed
    capacity_girls    INTEGER,
    capacity_staff    INTEGER,
    current_occupancy INTEGER,
    notes             TEXT
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. RESIDENTS  (refs safehouses)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS residents (
    resident_id                 INTEGER PRIMARY KEY,
    case_control_no             TEXT,
    internal_code               TEXT,
    safehouse_id                INTEGER REFERENCES safehouses(safehouse_id),
    case_status                 TEXT,          -- Active | Closed | Transferred
    sex                         TEXT,          -- F | M
    date_of_birth               DATE,
    birth_status                TEXT,
    place_of_birth              TEXT,
    religion                    TEXT,
    case_category               TEXT,
    -- sub-category boolean flags
    sub_cat_orphaned            BOOLEAN DEFAULT FALSE,
    sub_cat_trafficked          BOOLEAN DEFAULT FALSE,
    sub_cat_child_labor         BOOLEAN DEFAULT FALSE,
    sub_cat_physical_abuse      BOOLEAN DEFAULT FALSE,
    sub_cat_sexual_abuse        BOOLEAN DEFAULT FALSE,
    sub_cat_osaec               BOOLEAN DEFAULT FALSE,
    sub_cat_cicl                BOOLEAN DEFAULT FALSE,
    sub_cat_at_risk             BOOLEAN DEFAULT FALSE,
    sub_cat_street_child        BOOLEAN DEFAULT FALSE,
    sub_cat_child_with_hiv      BOOLEAN DEFAULT FALSE,
    -- disability & needs
    is_pwd                      BOOLEAN DEFAULT FALSE,
    pwd_type                    TEXT,
    has_special_needs           BOOLEAN DEFAULT FALSE,
    special_needs_diagnosis     TEXT,
    -- family context flags
    family_is_4ps               BOOLEAN DEFAULT FALSE,
    family_solo_parent          BOOLEAN DEFAULT FALSE,
    family_indigenous           BOOLEAN DEFAULT FALSE,
    family_parent_pwd           BOOLEAN DEFAULT FALSE,
    family_informal_settler     BOOLEAN DEFAULT FALSE,
    -- admission / case dates
    date_of_admission           DATE,
    age_upon_admission          TEXT,
    present_age                 TEXT,
    length_of_stay              TEXT,
    referral_source             TEXT,
    referring_agency_person     TEXT,
    date_colb_registered        DATE,
    date_colb_obtained          DATE,
    assigned_social_worker      TEXT,
    initial_case_assessment     TEXT,
    date_case_study_prepared    DATE,
    reintegration_type          TEXT,
    reintegration_status        TEXT,
    initial_risk_level          TEXT,          -- Low | Medium | High
    current_risk_level          TEXT,
    date_enrolled               DATE,
    date_closed                 DATE,
    created_at                  TIMESTAMPTZ DEFAULT NOW(),
    notes_restricted            TEXT
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. PROCESS RECORDINGS  (refs residents)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS process_recordings (
    recording_id                INTEGER PRIMARY KEY,
    resident_id                 INTEGER REFERENCES residents(resident_id),
    session_date                DATE,
    social_worker               TEXT,
    session_type                TEXT,          -- Individual | Group | Family
    session_duration_minutes    INTEGER,
    emotional_state_observed    TEXT,
    emotional_state_end         TEXT,
    session_narrative           TEXT,
    interventions_applied       TEXT,
    follow_up_actions           TEXT,
    progress_noted              BOOLEAN DEFAULT FALSE,
    concerns_flagged            BOOLEAN DEFAULT FALSE,
    referral_made               BOOLEAN DEFAULT FALSE,
    notes_restricted            TEXT
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. HEALTH & WELLBEING RECORDS  (refs residents)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS health_wellbeing_records (
    health_record_id            INTEGER PRIMARY KEY,
    resident_id                 INTEGER REFERENCES residents(resident_id),
    record_date                 DATE,
    general_health_score        NUMERIC(4,2),
    nutrition_score             NUMERIC(4,2),
    sleep_quality_score         NUMERIC(4,2),
    energy_level_score          NUMERIC(4,2),
    height_cm                   NUMERIC(5,1),
    weight_kg                   NUMERIC(5,1),
    bmi                         NUMERIC(5,2),
    medical_checkup_done        BOOLEAN DEFAULT FALSE,
    dental_checkup_done         BOOLEAN DEFAULT FALSE,
    psychological_checkup_done  BOOLEAN DEFAULT FALSE,
    notes                       TEXT
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. EDUCATION RECORDS  (refs residents)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS education_records (
    education_record_id         INTEGER PRIMARY KEY,
    resident_id                 INTEGER REFERENCES residents(resident_id),
    record_date                 DATE,
    education_level             TEXT,          -- Primary | Secondary | Vocational | ALS | College
    school_name                 TEXT,
    enrollment_status           TEXT,          -- Enrolled | Not Enrolled | Graduated
    attendance_rate             NUMERIC(5,4),
    progress_percent            NUMERIC(5,2),
    completion_status           TEXT,          -- NotStarted | InProgress | Completed | Dropped
    notes                       TEXT
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. INCIDENT REPORTS  (refs residents, safehouses)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS incident_reports (
    incident_id                 INTEGER PRIMARY KEY,
    resident_id                 INTEGER REFERENCES residents(resident_id),
    safehouse_id                INTEGER REFERENCES safehouses(safehouse_id),
    incident_date               DATE,
    incident_type               TEXT,          -- Medical | Behavioral | Security | SelfHarm | RunawayAttempt
    severity                    TEXT,          -- Low | Medium | High | Critical
    description                 TEXT,
    response_taken              TEXT,
    resolved                    BOOLEAN DEFAULT FALSE,
    resolution_date             DATE,
    reported_by                 TEXT,
    follow_up_required          BOOLEAN DEFAULT FALSE
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. INTERVENTION PLANS  (refs residents)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS intervention_plans (
    plan_id                     INTEGER PRIMARY KEY,
    resident_id                 INTEGER REFERENCES residents(resident_id),
    plan_category               TEXT,          -- Safety | Education | Health | Reintegration | Legal
    plan_description            TEXT,
    services_provided           TEXT,
    target_value                NUMERIC(8,4),
    target_date                 DATE,
    status                      TEXT,          -- Active | On Hold | Completed | In Progress
    case_conference_date        DATE,
    created_at                  TIMESTAMPTZ DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. HOME VISITATIONS  (refs residents)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS home_visitations (
    visitation_id               INTEGER PRIMARY KEY,
    resident_id                 INTEGER REFERENCES residents(resident_id),
    visit_date                  DATE,
    social_worker               TEXT,
    visit_type                  TEXT,          -- Initial | Routine Follow-Up | Pre-Reintegration | Crisis
    location_visited            TEXT,
    family_members_present      TEXT,
    purpose                     TEXT,
    observations                TEXT,
    family_cooperation_level    TEXT,          -- Cooperative | Neutral | Uncooperative
    safety_concerns_noted       BOOLEAN DEFAULT FALSE,
    follow_up_needed            BOOLEAN DEFAULT FALSE,
    follow_up_notes             TEXT,
    visit_outcome               TEXT           -- Favorable | Neutral | Unfavorable
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. SAFEHOUSE MONTHLY METRICS  (refs safehouses)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS safehouse_monthly_metrics (
    metric_id                   INTEGER PRIMARY KEY,
    safehouse_id                INTEGER REFERENCES safehouses(safehouse_id),
    month_start                 DATE,
    month_end                   DATE,
    active_residents            INTEGER,
    avg_education_progress      NUMERIC(5,2),
    avg_health_score            NUMERIC(4,2),
    process_recording_count     INTEGER DEFAULT 0,
    home_visitation_count       INTEGER DEFAULT 0,
    incident_count              INTEGER DEFAULT 0,
    notes                       TEXT
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. SUPPORTERS  (no deps)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS supporters (
    supporter_id                INTEGER PRIMARY KEY,
    supporter_type              TEXT,          -- Individual | Organization | SocialMediaAdvocate | Volunteer
    display_name                TEXT,
    organization_name           TEXT,
    first_name                  TEXT,
    last_name                   TEXT,
    relationship_type           TEXT,          -- Local | International | Diaspora
    region                      TEXT,
    country                     TEXT,
    email                       TEXT,
    phone                       TEXT,
    status                      TEXT,          -- Active | Inactive | Lapsed
    created_at                  DATE,
    first_donation_date         DATE,
    acquisition_channel         TEXT           -- SocialMedia | Event | Referral | DirectMail | Online
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. DONATIONS  (refs supporters)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS donations (
    donation_id                 INTEGER PRIMARY KEY,
    supporter_id                INTEGER REFERENCES supporters(supporter_id),
    donation_type               TEXT,          -- Monetary | InKind | Time
    donation_date               DATE,
    is_recurring                BOOLEAN DEFAULT FALSE,
    campaign_name               TEXT,
    channel_source              TEXT,
    currency_code               TEXT,          -- PHP | USD | EUR | ...
    amount                      NUMERIC(12,2),
    estimated_value             NUMERIC(12,2),
    impact_unit                 TEXT,          -- pesos | hours | items
    notes                       TEXT,
    referral_post_id            INTEGER        -- soft ref to social_media_posts
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 12. DONATION ALLOCATIONS  (refs donations, safehouses)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS donation_allocations (
    allocation_id               INTEGER PRIMARY KEY,
    donation_id                 INTEGER REFERENCES donations(donation_id),
    safehouse_id                INTEGER REFERENCES safehouses(safehouse_id),
    program_area                TEXT,          -- Education | Health | Operations | Transport | ...
    amount_allocated            NUMERIC(12,2),
    allocation_date             DATE,
    allocation_notes            TEXT
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 13. IN-KIND DONATION ITEMS  (refs donations)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS in_kind_donation_items (
    item_id                     INTEGER PRIMARY KEY,
    donation_id                 INTEGER REFERENCES donations(donation_id),
    item_name                   TEXT,
    item_category               TEXT,          -- SchoolMaterials | Food | Clothing | Medical | ...
    quantity                    NUMERIC(8,2),
    unit_of_measure             TEXT,          -- sets | packs | pieces | kg | ...
    estimated_unit_value        NUMERIC(10,2),
    intended_use                TEXT,          -- Education | Health | Shelter | Livelihood | ...
    received_condition          TEXT           -- New | Good | Fair | Poor
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 14. PARTNERS  (no deps)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS partners (
    partner_id                  INTEGER PRIMARY KEY,
    partner_name                TEXT NOT NULL,
    partner_type                TEXT,          -- Organization | Individual | Government | NGO
    role_type                   TEXT,          -- SafehouseOps | Evaluation | Legal | Medical | ...
    contact_name                TEXT,
    email                       TEXT,
    phone                       TEXT,
    region                      TEXT,
    status                      TEXT,          -- Active | Inactive
    start_date                  DATE,
    end_date                    DATE,
    notes                       TEXT
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 15. PARTNER ASSIGNMENTS  (refs partners, safehouses)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS partner_assignments (
    assignment_id               INTEGER PRIMARY KEY,
    partner_id                  INTEGER REFERENCES partners(partner_id),
    safehouse_id                INTEGER REFERENCES safehouses(safehouse_id),
    program_area                TEXT,          -- Operations | Education | Health | Legal | ...
    assignment_start            DATE,
    assignment_end              DATE,
    responsibility_notes        TEXT,
    is_primary                  BOOLEAN DEFAULT FALSE,
    status                      TEXT           -- Active | Completed | Suspended
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 16. PUBLIC IMPACT SNAPSHOTS  (no deps)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public_impact_snapshots (
    snapshot_id                 INTEGER PRIMARY KEY,
    snapshot_date               DATE,
    headline                    TEXT,
    summary_text                TEXT,
    metric_payload_json         JSONB,
    is_published                BOOLEAN DEFAULT FALSE,
    published_at                DATE
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 17. SOCIAL MEDIA POSTS  (no deps)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS social_media_posts (
    post_id                             INTEGER PRIMARY KEY,
    platform                            TEXT,          -- Facebook | Instagram | Twitter | WhatsApp | YouTube | TikTok
    platform_post_id                    TEXT,
    post_url                            TEXT,
    created_at                          TIMESTAMPTZ,
    day_of_week                         TEXT,
    post_hour                           SMALLINT,
    post_type                           TEXT,
    media_type                          TEXT,          -- Photo | Video | Text | Carousel | Reel | Story
    caption                             TEXT,
    hashtags                            TEXT,
    num_hashtags                        SMALLINT DEFAULT 0,
    mentions_count                      SMALLINT DEFAULT 0,
    has_call_to_action                  BOOLEAN DEFAULT FALSE,
    call_to_action_type                 TEXT,
    content_topic                       TEXT,
    sentiment_tone                      TEXT,
    caption_length                      INTEGER,
    features_resident_story             BOOLEAN DEFAULT FALSE,
    campaign_name                       TEXT,
    is_boosted                          BOOLEAN DEFAULT FALSE,
    boost_budget_php                    NUMERIC(10,2),
    impressions                         INTEGER,
    reach                               INTEGER,
    likes                               INTEGER,
    comments                            INTEGER,
    shares                              INTEGER,
    saves                               INTEGER,
    click_throughs                      INTEGER,
    video_views                         INTEGER,
    engagement_rate                     NUMERIC(7,4),
    profile_visits                      INTEGER,
    donation_referrals                  INTEGER,
    estimated_donation_value_php        NUMERIC(12,2),
    follower_count_at_post              INTEGER,
    watch_time_seconds                  NUMERIC(10,2),
    avg_view_duration_seconds           NUMERIC(8,2),
    subscriber_count_at_post            INTEGER,
    forwards                            NUMERIC(8,2)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- ML OUTPUT TABLES (written by nightly batch pipelines)
-- ─────────────────────────────────────────────────────────────────────────────

-- Pipeline 01 & 02: per-resident risk scores
CREATE TABLE IF NOT EXISTS resident_risk_scores (
    score_id                    SERIAL PRIMARY KEY,
    resident_id                 INTEGER REFERENCES residents(resident_id),
    scored_at                   TIMESTAMPTZ DEFAULT NOW(),
    health_score_delta_6m       NUMERIC(6,4),     -- predicted 6-mo health change
    stall_risk_probability      NUMERIC(5,4),     -- P(health stall)
    incident_risk_probability   NUMERIC(5,4),     -- P(severe incident next 30 days)
    risk_tier                   TEXT              -- Low | Medium | High
);

-- Pipeline 04: donor churn scores
CREATE TABLE IF NOT EXISTS donor_churn_scores (
    score_id                    SERIAL PRIMARY KEY,
    supporter_id                INTEGER REFERENCES supporters(supporter_id),
    scored_at                   TIMESTAMPTZ DEFAULT NOW(),
    churn_risk_score            NUMERIC(5,4),     -- 0–1 probability
    risk_tier                   TEXT              -- Low | Medium | High
);
