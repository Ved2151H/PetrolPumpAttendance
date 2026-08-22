const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log('Creating firms...');
    await pool.query(`
      INSERT INTO "Firm" (id, name, "updatedAt") 
      VALUES 
        ('narmata', 'Narmata Construction', NOW()),
        ('patil', 'Patil Petroleum', NOW())
      ON CONFLICT (id) DO NOTHING;
    `);

    console.log('Updating records...');
    const w = await pool.query(`UPDATE "Worker" SET "firmId" = 'narmata' WHERE "firmId" IS NULL;`);
    console.log(`Updated ${w.rowCount} workers`);

    const n = await pool.query(`UPDATE "Note" SET "firmId" = 'narmata' WHERE "firmId" IS NULL;`);
    console.log(`Updated ${n.rowCount} notes`);

    const a = await pool.query(`UPDATE "AuditLog" SET "firmId" = 'narmata' WHERE "firmId" IS NULL;`);
    console.log(`Updated ${a.rowCount} audit logs`);

  } finally {
    await pool.end();
  }
}

main().catch(console.error);
