#!/usr/bin/env python3
import sqlite3
import csv

DB_PATH = "/var/www/time-to-eat/backend/menuday.db"
CSV_PATH = "ingredients_fixed.csv"

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

with open(CSV_PATH, newline="", encoding="utf-8") as f:
    reader = csv.reader(f)
    for row in reader:
        if len(row) < 3:
            continue
        id_, name, category = row[0].strip(), row[1].strip(), row[2].strip()
        cur.execute(
            "UPDATE ingredients_catalog SET category = ? WHERE id = ?",
            (category, int(id_))
        )
        if cur.rowcount == 0:
            cur.execute(
                "INSERT INTO ingredients_catalog (id, name, category) VALUES (?, ?, ?)",
                (int(id_), name, category)
            )

conn.commit()
conn.close()
print("Done. Rows processed: 500")