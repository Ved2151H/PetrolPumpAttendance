const fs = require('fs');
const path = require('path');

const files = [
  'src/app/api/workers/route.ts',
  'src/app/api/workers/[id]/route.ts',
  'src/app/api/workers/trash/route.ts',
  'src/app/api/attendance/route.ts',
  'src/app/api/dashboard/route.ts',
  'src/app/api/notes/route.ts',
  'src/app/api/notes/[id]/route.ts',
  'src/app/api/notes/[id]/restore/route.ts',
  'src/app/api/notes/[id]/permanent/route.ts',
  'src/app/api/notes/trash/route.ts',
  'src/app/api/audit/route.ts'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let code = fs.readFileSync(file, 'utf8');

  // Regex to add firmId to where clause
  code = code.replace(/where:\s*\{/g, 'where: { firmId, ');
  
  // Regex to add firmId to data clause
  code = code.replace(/data:\s*\{/g, 'data: { firmId, ');

  // Exception for Attendance which doesn't have firmId directly
  if (file.includes('attendance/route.ts')) {
     code = code.replace(/worker:\s*\{\s*where:\s*\{\s*firmId,\s*deletedAt:\s*null\s*\}\s*\}/g, "worker: { deletedAt: null }"); 
     // Revert the firmId addition in attendance where it shouldn't be, 
     // actually attendance can be scoped by worker.firmId
     code = code.replace(/where:\s*\{\s*firmId,\s*(.*?)\}/g, "where: { worker: { firmId }, $1}");
  }

  // Dashboard route has some complicated raw queries or aggregates maybe?
  // Let's just not touch dashboard with regex, I'll fix it manually.

  if (!file.includes('dashboard') && !file.includes('attendance')) {
     fs.writeFileSync(file, code);
     console.log(`Updated Prisma queries in ${file}`);
  }
});
