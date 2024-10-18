const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create or connect to the database (stored in the 'database' folder)
const dbPath = path.join(__dirname, 'first_aid.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to the database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Create tables if they don't exist
db.serialize(() => {
    // Recreate the `daily_records` table
    db.run(`
      CREATE TABLE IF NOT EXISTS daily_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT,
        time_of_arrival TEXT,
        company TEXT,
        badge TEXT,
        name TEXT,
        age INTEGER,
        gender TEXT,
        incident TEXT,
        complaints TEXT,
        mobility TEXT,
        respiratory_rate TEXT,
        pulse TEXT,
        blood_pressure TEXT,
        temperature TEXT,
        avpu TEXT,
        oxygen_saturation TEXT,
        glucose TEXT,
        pain_score TEXT,
        final_triage TEXT,
        detained TEXT,
        treatment_given TEXT,
        disposition TEXT,
        disposition_time TEXT,
        reporting TEXT
      )
    `, (err) => {
      if (err) {
        console.error('Error creating daily_records table:', err.message);
      } else {
        console.log('Table daily_records created successfully.');
      }
    });

    // Drop the existing users table and recreate it with new columns
    db.run(`DROP TABLE IF EXISTS users`, (err) => {
      if (err) {
        console.error('Error dropping users table:', err.message);
      } else {
        console.log('Table users dropped successfully.');
      }
    });

    db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE,
          password TEXT,
          status TEXT DEFAULT 'pending',  -- User status: active, pending, etc.
          role TEXT DEFAULT 'user'        -- User role: admin, user, etc.
        )
    `, (err) => {
      if (err) {
        console.error('Error creating users table:', err.message);
      } else {
        console.log('Table users created successfully.');
      }
    });
});

// Export the db connection
module.exports = db;
