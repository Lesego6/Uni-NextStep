const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const mysql = require("mysql2/promise");

const dbHost = process.env.DB_HOST || "localhost";
const dbPort = Number(process.env.DB_PORT || 3306);
const dbUser = process.env.DB_USER || "root";
const dbPassword = process.env.DB_PASSWORD || "";
const dbName = process.env.DB_NAME || "uni_nextstep";

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

  const [tables] = await databaseConnection.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = ? LIMIT 1`,
    [dbName]
  );

  if (tables.length === 0) {
    const schemaSql = fs.readFileSync(path.join(__dirname, "db", "mysql.example.sql"), "utf8");
    const statements = schemaSql
      .split(/;\s*\n|;\s*$/m)
      .map((statement) => statement.trim())
      .filter(Boolean);

    for (const statement of statements) {
      await databaseConnection.query(statement);
    }
  }

  await databaseConnection.end();
}

(async () => {
  await ensureDatabaseAndSchema();
})();

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

console.log("Uni NextStep database connected successfully via MySQL adapter!");

module.exports = db;