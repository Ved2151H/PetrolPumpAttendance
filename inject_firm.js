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

  // Add getFirmId import
  if (!code.includes("getFirmId")) {
    code = `import { getFirmId } from '@/lib/firm';\n` + code;
  }

  // Inject firmId check in all exported async functions
  const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
  methods.forEach(method => {
    const regex = new RegExp(`export async function ${method}\\((.*?)\\)\\s*{`, 'g');
    code = code.replace(regex, `export async function ${method}($1) {
  const firmId = await getFirmId();
  if (!firmId) return NextResponse.json({ success: false, error: { message: 'Unauthorized - No firm selected' } }, { status: 401 });
`);
  });

  // Inject firmId into prisma calls where applicable (rudimentary)
  // For Worker, Note, AuditLog, we can blindly add firmId to where and data.
  // This is too risky to regex. I'll just write it manually for the files.

  fs.writeFileSync(file, code);
  console.log(`Updated ${file}`);
});
