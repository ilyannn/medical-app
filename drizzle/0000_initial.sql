CREATE TABLE IF NOT EXISTS people(
  id TEXT PRIMARY KEY NOT NULL,
  label TEXT NOT NULL,
  display_name TEXT NOT NULL,
  accent TEXT NOT NULL,
  folder_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS care_areas(
  id TEXT PRIMARY KEY NOT NULL,
  person_id TEXT NOT NULL REFERENCES people(id),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL,
  notes TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS doctors(
  id TEXT PRIMARY KEY NOT NULL,
  person_id TEXT NOT NULL REFERENCES people(id),
  care_area_id TEXT NOT NULL REFERENCES care_areas(id),
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  practice_name TEXT NOT NULL,
  macos_contact_id TEXT,
  preferred_channel TEXT NOT NULL,
  notes TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notes(
  id TEXT PRIMARY KEY NOT NULL,
  person_id TEXT NOT NULL REFERENCES people(id),
  care_area_id TEXT REFERENCES care_areas(id),
  doctor_id TEXT REFERENCES doctors(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  visit_date TEXT NOT NULL,
  next_step TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS prescriptions(
  id TEXT PRIMARY KEY NOT NULL,
  person_id TEXT NOT NULL REFERENCES people(id),
  care_area_id TEXT NOT NULL REFERENCES care_areas(id),
  doctor_id TEXT NOT NULL REFERENCES doctors(id),
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  issued_on TEXT NOT NULL,
  renewal_due_on TEXT,
  status TEXT NOT NULL,
  notes TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bills(
  id TEXT PRIMARY KEY NOT NULL,
  person_id TEXT NOT NULL REFERENCES people(id),
  care_area_id TEXT REFERENCES care_areas(id),
  doctor_id TEXT REFERENCES doctors(id),
  label TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL,
  incurred_on TEXT NOT NULL,
  status TEXT NOT NULL,
  notes TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reimbursements(
  id TEXT PRIMARY KEY NOT NULL,
  person_id TEXT NOT NULL REFERENCES people(id),
  bill_id TEXT NOT NULL REFERENCES bills(id),
  payer_name TEXT NOT NULL,
  submitted_on TEXT NOT NULL,
  reimbursed_on TEXT,
  amount_cents INTEGER NOT NULL,
  reimbursed_cents INTEGER NOT NULL,
  status TEXT NOT NULL,
  notes TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS drafts(
  id TEXT PRIMARY KEY NOT NULL,
  person_id TEXT NOT NULL REFERENCES people(id),
  care_area_id TEXT REFERENCES care_areas(id),
  doctor_id TEXT REFERENCES doctors(id),
  intent TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  locale TEXT NOT NULL,
  ai_generated INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS documents(
  id TEXT PRIMARY KEY NOT NULL,
  person_id TEXT NOT NULL REFERENCES people(id),
  care_area_id TEXT REFERENCES care_areas(id),
  relative_path TEXT NOT NULL,
  semantic_name TEXT NOT NULL,
  document_date TEXT NOT NULL,
  document_type TEXT NOT NULL,
  source_kind TEXT NOT NULL,
  source_ref TEXT,
  extracted_text TEXT NOT NULL,
  imported_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS document_links(
  id TEXT PRIMARY KEY NOT NULL,
  document_id TEXT NOT NULL REFERENCES documents(id),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS appointment_links(
  id TEXT PRIMARY KEY NOT NULL,
  person_id TEXT NOT NULL REFERENCES people(id),
  external_event_id TEXT NOT NULL,
  doctor_id TEXT REFERENCES doctors(id),
  care_area_id TEXT REFERENCES care_areas(id),
  note TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS app_settings(
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_runs(
  id TEXT PRIMARY KEY NOT NULL,
  source TEXT NOT NULL,
  status TEXT NOT NULL,
  details TEXT NOT NULL,
  ran_at TEXT NOT NULL
);

CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(
  record_type,
  record_id UNINDEXED,
  person_id UNINDEXED,
  title,
  body,
  tokenize = 'trigram'
);
