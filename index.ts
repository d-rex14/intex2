// ─── Safehouses ───────────────────────────────────────────────────────────────
export interface Safehouse {
    safehouse_id: number
    safehouse_code: string
    name: string
    region: 'Luzon' | 'Visayas' | 'Mindanao'
    city: string
    province: string
    country: string
    open_date: string
    status: 'Active' | 'Inactive'
    capacity_girls: number
    capacity_staff: number
    current_occupancy: number
    notes?: string
  }
  
  // ─── Partners ─────────────────────────────────────────────────────────────────
  export interface Partner {
    partner_id: number
    partner_name: string
    partner_type: 'Organization' | 'Individual'
    role_type: 'Education' | 'Evaluation' | 'SafehouseOps' | 'FindSafehouse' | 'Logistics' | 'Transport' | 'Maintenance'
    contact_name: string
    email: string
    phone: string
    region: string
    status: 'Active' | 'Inactive'
    start_date: string
    end_date?: string
    notes?: string
  }
  
  // ─── Supporters ───────────────────────────────────────────────────────────────
  export type SupporterType = 'MonetaryDonor' | 'InKindDonor' | 'Volunteer' | 'SkillsContributor' | 'SocialMediaAdvocate' | 'PartnerOrganization'
  export type AcquisitionChannel = 'Website' | 'SocialMedia' | 'Event' | 'WordOfMouth' | 'PartnerReferral' | 'Church'
  
  export interface Supporter {
    supporter_id: number
    supporter_type: SupporterType
    display_name: string
    organization_name?: string
    first_name?: string
    last_name?: string
    relationship_type: 'Local' | 'International' | 'PartnerOrganization'
    region: string
    country: string
    email: string
    phone: string
    status: 'Active' | 'Inactive'
    first_donation_date?: string
    acquisition_channel: AcquisitionChannel
    created_at: string
  }
  
  // ─── Donations ────────────────────────────────────────────────────────────────
  export type DonationType = 'Monetary' | 'InKind' | 'Time' | 'Skills' | 'SocialMedia'
  
  export interface Donation {
    donation_id: number
    supporter_id: number
    donation_type: DonationType
    donation_date: string
    channel_source: 'Campaign' | 'Event' | 'Direct' | 'SocialMedia' | 'PartnerReferral'
    currency_code?: string
    amount?: number
    estimated_value?: number
    impact_unit?: 'pesos' | 'items' | 'hours' | 'campaigns'
    is_recurring: boolean
    campaign_name?: string
    notes?: string
    created_by_partner_id?: number
    referral_post_id?: number
  }
  
  export interface InKindDonationItem {
    item_id: number
    donation_id: number
    item_name: string
    item_category: 'Food' | 'Supplies' | 'Clothing' | 'SchoolMaterials' | 'Hygiene' | 'Furniture' | 'Medical'
    quantity: number
    unit_of_measure: 'pcs' | 'boxes' | 'kg' | 'sets' | 'packs'
    estimated_unit_value: number
    intended_use: 'Meals' | 'Education' | 'Shelter' | 'Hygiene' | 'Health'
    received_condition: 'New' | 'Good' | 'Fair'
  }
  
  export interface DonationAllocation {
    allocation_id: number
    donation_id: number
    safehouse_id: number
    program_area: 'Education' | 'Wellbeing' | 'Operations' | 'Transport' | 'Maintenance' | 'Outreach'
    amount_allocated: number
    allocation_date: string
    allocation_notes?: string
  }
  
  // ─── Residents ────────────────────────────────────────────────────────────────
  export type CaseStatus = 'Active' | 'Closed' | 'Transferred'
  export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical'
  export type ReintegrationStatus = 'Not Started' | 'In Progress' | 'Completed' | 'On Hold'
  
  export interface Resident {
    resident_id: number
    case_control_no: string
    internal_code: string
    safehouse_id: number
    case_status: CaseStatus
    sex: 'F'
    date_of_birth: string
    birth_status: 'Marital' | 'Non-Marital'
    place_of_birth: string
    religion: string
    case_category: 'Abandoned' | 'Foundling' | 'Surrendered' | 'Neglected'
    sub_cat_orphaned: boolean
    sub_cat_trafficked: boolean
    sub_cat_child_labor: boolean
    sub_cat_physical_abuse: boolean
    sub_cat_sexual_abuse: boolean
    sub_cat_osaec: boolean
    sub_cat_cicl: boolean
    sub_cat_at_risk: boolean
    sub_cat_street_child: boolean
    sub_cat_child_with_hiv: boolean
    is_pwd: boolean
    pwd_type?: string
    has_special_needs: boolean
    special_needs_diagnosis?: string
    family_is_4ps: boolean
    family_solo_parent: boolean
    family_indigenous: boolean
    family_parent_pwd: boolean
    family_informal_settler: boolean
    date_of_admission: string
    age_upon_admission: string
    present_age: string
    length_of_stay: string
    referral_source: 'Government Agency' | 'NGO' | 'Police' | 'Self-Referral' | 'Community' | 'Court Order'
    referring_agency_person: string
    date_colb_registered?: string
    date_colb_obtained?: string
    assigned_social_worker: string
    initial_case_assessment: string
    date_case_study_prepared?: string
    reintegration_type?: 'Family Reunification' | 'Foster Care' | 'Adoption (Domestic)' | 'Adoption (Inter-Country)' | 'Independent Living' | 'None'
    reintegration_status?: ReintegrationStatus
    initial_risk_level: RiskLevel
    current_risk_level: RiskLevel
    date_enrolled: string
    date_closed?: string
    created_at: string
    notes_restricted?: string
  }
  
  // ─── Process Recordings ───────────────────────────────────────────────────────
  export type EmotionalState = 'Calm' | 'Anxious' | 'Sad' | 'Angry' | 'Hopeful' | 'Withdrawn' | 'Happy' | 'Distressed'
  
  export interface ProcessRecording {
    recording_id: number
    resident_id: number
    session_date: string
    social_worker: string
    session_type: 'Individual' | 'Group'
    session_duration_minutes: number
    emotional_state_observed: EmotionalState
    emotional_state_end: EmotionalState
    session_narrative: string
    interventions_applied: string
    follow_up_actions: string
    progress_noted: boolean
    concerns_flagged: boolean
    referral_made: boolean
    notes_restricted?: string
  }
  
  // ─── Home Visitations ─────────────────────────────────────────────────────────
  export type VisitType = 'Initial Assessment' | 'Routine Follow-Up' | 'Reintegration Assessment' | 'Post-Placement Monitoring' | 'Emergency'
  export type VisitOutcome = 'Favorable' | 'Needs Improvement' | 'Unfavorable' | 'Inconclusive'
  
  export interface HomeVisitation {
    visitation_id: number
    resident_id: number
    visit_date: string
    social_worker: string
    visit_type: VisitType
    location_visited: string
    family_members_present: string
    purpose: string
    observations: string
    family_cooperation_level: 'Highly Cooperative' | 'Cooperative' | 'Neutral' | 'Uncooperative'
    safety_concerns_noted: boolean
    follow_up_needed: boolean
    follow_up_notes?: string
    visit_outcome: VisitOutcome
  }
  
  // ─── Education Records ────────────────────────────────────────────────────────
  export interface EducationRecord {
    education_record_id: number
    resident_id: number
    record_date: string
    program_name: 'Bridge Program' | 'Secondary Support' | 'Vocational Skills' | 'Literacy Boost'
    course_name: 'Math' | 'English' | 'Science' | 'Life Skills' | 'Computer Basics' | 'Livelihood'
    education_level: 'Primary' | 'Secondary' | 'Vocational' | 'CollegePrep'
    attendance_status: 'Present' | 'Late' | 'Absent'
    attendance_rate: number
    progress_percent: number
    completion_status: 'NotStarted' | 'InProgress' | 'Completed'
    gpa_like_score: number
    notes?: string
  }
  
  // ─── Health & Wellbeing ───────────────────────────────────────────────────────
  export interface HealthWellbeingRecord {
    health_record_id: number
    resident_id: number
    record_date: string
    weight_kg: number
    height_cm: number
    bmi: number
    nutrition_score: number
    sleep_score: number
    energy_score: number
    general_health_score: number
    medical_checkup_done: boolean
    dental_checkup_done: boolean
    psychological_checkup_done: boolean
    medical_notes_restricted?: string
  }
  
  // ─── Intervention Plans ───────────────────────────────────────────────────────
  export interface InterventionPlan {
    plan_id: number
    resident_id: number
    plan_category: 'Safety' | 'Psychosocial' | 'Education' | 'Physical Health' | 'Legal' | 'Reintegration'
    plan_description: string
    services_provided: string
    target_value?: number
    target_date: string
    status: 'Open' | 'In Progress' | 'Achieved' | 'On Hold' | 'Closed'
    case_conference_date?: string
    created_at: string
    updated_at: string
  }
  
  // ─── Incident Reports ─────────────────────────────────────────────────────────
  export interface IncidentReport {
    incident_id: number
    resident_id: number
    safehouse_id: number
    incident_date: string
    incident_type: 'Behavioral' | 'Medical' | 'Security' | 'RunawayAttempt' | 'SelfHarm' | 'ConflictWithPeer' | 'PropertyDamage'
    severity: 'Low' | 'Medium' | 'High'
    description: string
    response_taken: string
    resolved: boolean
    resolution_date?: string
    reported_by: string
    follow_up_required: boolean
  }
  
  // ─── Social Media Posts ───────────────────────────────────────────────────────
  export interface SocialMediaPost {
    post_id: number
    platform: 'Facebook' | 'Instagram' | 'Twitter' | 'TikTok' | 'LinkedIn' | 'YouTube' | 'WhatsApp'
    platform_post_id: string
    post_url: string
    created_at: string
    day_of_week: string
    post_hour: number
    post_type: 'ImpactStory' | 'Campaign' | 'EventPromotion' | 'ThankYou' | 'EducationalContent' | 'FundraisingAppeal'
    media_type: 'Photo' | 'Video' | 'Carousel' | 'Text' | 'Reel'
    caption: string
    hashtags: string
    num_hashtags: number
    mentions_count: number
    has_call_to_action: boolean
    call_to_action_type?: 'DonateNow' | 'LearnMore' | 'ShareStory' | 'SignUp'
    content_topic: string
    sentiment_tone: string
    caption_length: number
    features_resident_story: boolean
    campaign_name?: string
    is_boosted: boolean
    boost_budget_php?: number
    impressions: number
    reach: number
    likes: number
    comments: number
    shares: number
    saves: number
    click_throughs: number
    video_views?: number
    engagement_rate: number
    profile_visits: number
    donation_referrals: number
    estimated_donation_value_php: number
    follower_count_at_post: number
  }
  
  // ─── Safehouse Monthly Metrics ────────────────────────────────────────────────
  export interface SafehouseMonthlyMetric {
    metric_id: number
    safehouse_id: number
    month_start: string
    month_end: string
    active_residents: number
    avg_education_progress: number
    avg_health_score: number
    process_recording_count: number
    home_visitation_count: number
    incident_count: number
    notes?: string
  }
  
  // ─── Public Impact Snapshots ──────────────────────────────────────────────────
  export interface PublicImpactSnapshot {
    snapshot_id: number
    snapshot_date: string
    headline: string
    summary_text: string
    metric_payload_json: string
    is_published: boolean
    published_at?: string
  }