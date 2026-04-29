CREATE TABLE inquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    company TEXT,
    role TEXT,
    inquiry TEXT,
    message TEXT,
    form_type TEXT,
    dedupe_key TEXT,
    created_at INTEGER
);
