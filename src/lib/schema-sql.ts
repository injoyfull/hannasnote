// Idempotent schema bootstrap. On serverless (Vercel) there is no persistent
// disk, so the app runs against an ephemeral SQLite file (e.g. /tmp) that is
// empty on every cold start. This DDL recreates the tables, the FTS5 search
// index + sync triggers, and seeds the default categories so the app renders
// and is fully usable within an instance's lifetime. Data is NOT durable here
// — swap DATABASE_URL to a networked libSQL/Turso URL for real persistence.

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS "Category" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "color" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Note" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "type" TEXT NOT NULL DEFAULT 'text',
  "title" TEXT,
  "content" TEXT,
  "imagePath" TEXT,
  "categoryId" TEXT,
  "canvasX" REAL NOT NULL DEFAULT 0,
  "canvasY" REAL NOT NULL DEFAULT 0,
  "isStub" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Note_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Link" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sourceNoteId" TEXT NOT NULL,
  "targetNoteId" TEXT NOT NULL,
  "kind" TEXT NOT NULL DEFAULT 'wikilink',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Link_sourceNoteId_fkey" FOREIGN KEY ("sourceNoteId") REFERENCES "Note" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Link_targetNoteId_fkey" FOREIGN KEY ("targetNoteId") REFERENCES "Note" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Note_categoryId_idx" ON "Note"("categoryId");
CREATE INDEX IF NOT EXISTS "Note_createdAt_idx" ON "Note"("createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "Category_name_key" ON "Category"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "Link_sourceNoteId_targetNoteId_kind_key" ON "Link"("sourceNoteId", "targetNoteId", "kind");

CREATE VIRTUAL TABLE IF NOT EXISTS "NoteSearch" USING fts5(
  title,
  content,
  content='Note',
  content_rowid='rowid',
  tokenize='trigram'
);

CREATE TRIGGER IF NOT EXISTS "Note_ai" AFTER INSERT ON "Note" BEGIN
  INSERT INTO "NoteSearch"(rowid, title, content) VALUES (new.rowid, new.title, new.content);
END;

CREATE TRIGGER IF NOT EXISTS "Note_ad" AFTER DELETE ON "Note" BEGIN
  INSERT INTO "NoteSearch"("NoteSearch", rowid, title, content) VALUES('delete', old.rowid, old.title, old.content);
END;

CREATE TRIGGER IF NOT EXISTS "Note_au" AFTER UPDATE ON "Note" BEGIN
  INSERT INTO "NoteSearch"("NoteSearch", rowid, title, content) VALUES('delete', old.rowid, old.title, old.content);
  INSERT INTO "NoteSearch"(rowid, title, content) VALUES (new.rowid, new.title, new.content);
END;

INSERT OR IGNORE INTO "Category" ("id","name","color","createdAt") VALUES
  ('seed_reflect','성찰','#D9CBF2',CURRENT_TIMESTAMP),
  ('seed_emotion','감정','#F6C9C0',CURRENT_TIMESTAMP),
  ('seed_relation','관계','#BFE1F6',CURRENT_TIMESTAMP),
  ('seed_growth','성장','#D3E4C5',CURRENT_TIMESTAMP),
  ('seed_create','창작','#FBD8B0',CURRENT_TIMESTAMP),
  ('seed_memory','기억','#E3D9F0',CURRENT_TIMESTAMP),
  ('seed_gratitude','감사','#F7C6D9',CURRENT_TIMESTAMP),
  ('seed_intention','다짐','#C3EFE0',CURRENT_TIMESTAMP),
  ('seed_other','기타','#D9CDBF',CURRENT_TIMESTAMP);
`;
