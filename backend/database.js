const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const mysql = require("mysql2/promise");

const dbHost = process.env.DB_HOST || "localhost";
const dbPort = Number(process.env.DB_PORT || 3306);
const dbUser = process.env.DB_USER || "root";
const dbPassword = process.env.DB_PASSWORD || "";
const dbName = process.env.DB_NAME || "uni_nextstep";

async function ensureColumn(connection, tableName, columnName, definition) {
  const [columns] = await connection.query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = ? AND table_name = ? AND column_name = ?
      LIMIT 1
    `,
    [dbName, tableName, columnName]
  );

  if (columns.length === 0) {
    await connection.query(`ALTER TABLE \`${tableName}\` ADD COLUMN ${definition}`);
  }
}

async function ensureUsersEmailUniqueIndex(connection) {
  const [indexes] = await connection.query(
    `
      SELECT index_name
      FROM information_schema.statistics
      WHERE table_schema = ?
        AND table_name = 'users'
        AND column_name = 'email'
        AND non_unique = 0
      LIMIT 1
    `,
    [dbName]
  );

  if (indexes.length > 0) {
    return;
  }

  const [duplicates] = await connection.query(`
    SELECT lower(email) AS email, COUNT(*) AS total
    FROM users
    GROUP BY lower(email)
    HAVING COUNT(*) > 1
    LIMIT 5
  `);

  if (duplicates.length > 0) {
    console.warn("Could not add a unique email index because duplicate user emails already exist.");
    return;
  }

  await connection.query("ALTER TABLE users ADD UNIQUE KEY idx_users_email_unique (email)");
}

async function ensureDatabaseAndSchema() {
  const connectionConfig = {
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    multipleStatements: false
  };

  const rootConnection = await mysql.createConnection(connectionConfig);
  await rootConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
  await rootConnection.end();

  const databaseConnection = await mysql.createConnection({
    ...connectionConfig,
    database: dbName,
    namedPlaceholders: false
  });

  const schemaPath = path.join(__dirname, "db", "schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf8");
  const statements = schemaSql
    .split(/;\s*\n|;\s*$/m)
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await databaseConnection.query(statement);
  }

  await ensureColumn(databaseConnection, "applications", "rejection_reason", "`rejection_reason` VARCHAR(255)");
  await ensureColumn(databaseConnection, "applications", "status_note", "`status_note` TEXT");
  await ensureColumn(databaseConnection, "applications", "status_updated_at", "`status_updated_at` TIMESTAMP NULL DEFAULT NULL");
  await ensureUsersEmailUniqueIndex(databaseConnection);

  await databaseConnection.end();
}

const ready = ensureDatabaseAndSchema();

const pool = mysql.createPool({
  host: dbHost,
  port: dbPort,
  user: dbUser,
  password: dbPassword,
  database: dbName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  namedPlaceholders: false
});

const db = {
  prepare(sql) {
    return {
      async get(...values) {
        const [rows] = await pool.execute(sql, values);
        return rows[0] || undefined;
      },
      async all(...values) {
        const [rows] = await pool.execute(sql, values);
        return rows;
      },
      async run(...values) {
        const [result] = await pool.execute(sql, values);
        return {
          changes: result.affectedRows || 0,
          lastInsertRowid: result.insertId || 0
        };
      }
    };
  },
  async exec(sql) {
    await pool.query(sql);
  },
  async transaction(callback) {
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    try {
      const tx = {
        prepare(sql) {
          return {
            async get(...values) {
              const [rows] = await connection.execute(sql, values);
              return rows[0] || undefined;
            },
            async all(...values) {
              const [rows] = await connection.execute(sql, values);
              return rows;
            },
            async run(...values) {
              const [result] = await connection.execute(sql, values);
              return {
                changes: result.affectedRows || 0,
                lastInsertRowid: result.insertId || 0
              };
            }
          };
        }
      };

      const result = await callback(tx);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
};

db.ready = ready;

module.exports = db;
module.exports.ready = ready;
