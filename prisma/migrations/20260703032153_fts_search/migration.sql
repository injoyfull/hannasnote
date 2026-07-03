-- Full-text search over Note title/content using SQLite FTS5.
-- Kept in sync with the Note table via triggers (external-content approach).

CREATE VIRTUAL TABLE "NoteSearch" USING fts5(
  title,
  content,
  content='Note',
  content_rowid='rowid'
);

-- Populate FTS index for any existing notes.
INSERT INTO "NoteSearch"(rowid, title, content)
SELECT rowid, title, content FROM "Note";

-- Keep FTS index in sync on insert.
CREATE TRIGGER "Note_ai" AFTER INSERT ON "Note" BEGIN
  INSERT INTO "NoteSearch"(rowid, title, content) VALUES (new.rowid, new.title, new.content);
END;

-- Keep FTS index in sync on delete.
CREATE TRIGGER "Note_ad" AFTER DELETE ON "Note" BEGIN
  INSERT INTO "NoteSearch"("NoteSearch", rowid, title, content) VALUES('delete', old.rowid, old.title, old.content);
END;

-- Keep FTS index in sync on update.
CREATE TRIGGER "Note_au" AFTER UPDATE ON "Note" BEGIN
  INSERT INTO "NoteSearch"("NoteSearch", rowid, title, content) VALUES('delete', old.rowid, old.title, old.content);
  INSERT INTO "NoteSearch"(rowid, title, content) VALUES (new.rowid, new.title, new.content);
END;