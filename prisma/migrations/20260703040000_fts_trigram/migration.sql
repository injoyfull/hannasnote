-- Switch NoteSearch to the FTS5 trigram tokenizer for better substring
-- matching on Korean text (the default unicode61 tokenizer segments on
-- whitespace/punctuation and doesn't handle CJK word boundaries well).
-- Triggers stay as-is; they only reference the table name/columns.

DROP TABLE "NoteSearch";

CREATE VIRTUAL TABLE "NoteSearch" USING fts5(
  title,
  content,
  content='Note',
  content_rowid='rowid',
  tokenize='trigram'
);

INSERT INTO "NoteSearch"(rowid, title, content)
SELECT rowid, title, content FROM "Note";
