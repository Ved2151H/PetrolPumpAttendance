import prisma from './src/lib/prisma'

async function runTests() {
  console.log('--- STARTING VERIFICATION TESTS ---')
  
  // 1. Test Worker Creation
  console.log('\nTesting Worker Creation...')
  const worker = await prisma.worker.create({
    data: {
      name: 'Rahul Sharma',
      phone: '9998887776'
    }
  })
  console.log('PASS: Worker created ->', worker.id)

  // 2. Test Worker Update
  console.log('\nTesting Worker Update...')
  const updated = await prisma.worker.update({
    where: { id: worker.id },
    data: { name: 'Rahul Sharma Updated' }
  })
  if (updated.name === 'Rahul Sharma Updated') console.log('PASS: Worker updated')
  else console.log('FAIL: Worker update failed')

  // 3. Test Attendance Creation (Present)
  console.log('\nTesting Attendance Creation...')
  const date = new Date('2026-08-17T00:00:00.000Z')
  const att1 = await prisma.attendance.create({
    data: {
      workerId: worker.id,
      date: date,
      status: 'PRESENT'
    }
  })
  console.log('PASS: Attendance created')

  // 4. Test Duplicate Prevention (Upsert)
  console.log('\nTesting Duplicate Prevention...')
  try {
    const att2 = await prisma.attendance.upsert({
      where: {
        workerId_date: {
          workerId: worker.id,
          date: date
        }
      },
      update: {
        status: 'ABSENT'
      },
      create: {
        workerId: worker.id,
        date: date,
        status: 'ABSENT'
      }
    })
    console.log('PASS: Upsert successful without duplication. New status:', att2.status)
  } catch (e) {
    console.log('FAIL: Upsert failed', e)
  }

  // Count attendance records for this worker and date
  const count = await prisma.attendance.count({
    where: { workerId: worker.id, date: date }
  })
  if (count === 1) console.log('PASS: Only 1 record exists (no duplicates)')
  else console.log('FAIL: Duplicates found!')

  // 5. Test Worker Deactivation
  console.log('\nTesting Worker Deactivation...')
  const deactivated = await prisma.worker.update({
    where: { id: worker.id },
    data: { deletedAt: new Date() }
  })
  if (deactivated.deletedAt) console.log('PASS: Worker deactivated')
  
  const historyCount = await prisma.attendance.count({
    where: { workerId: worker.id }
  })
  if (historyCount > 0) console.log('PASS: Historical attendance preserved after deactivation')

  // Cleanup test data
  console.log('\nCleaning up test data...')
  await prisma.attendance.deleteMany({ where: { workerId: worker.id } })
  await prisma.worker.delete({ where: { id: worker.id } })
  console.log('--- TESTS COMPLETE ---')
  
  process.exit(0)
}

runTests().catch(e => {
  console.error(e)
  process.exit(1)
})
