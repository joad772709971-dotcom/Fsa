import { getDocs, collection, doc, writeBatch } from 'firebase/firestore';
import { db } from '../src/lib/firebase';
import { syncTransactionIntoDays } from '../src/utils/ledgerUnification';
import { cleanPayloadForFirestore } from '../src/utils/syncService';
import { DayRecord } from '../src/types';
import fs from 'fs';

async function syncAllDays() {
  const txSnap = await getDocs(collection(db, 'transactions'));
  const allTxs = txSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
  
  let days: DayRecord[] = [];
  allTxs.forEach(t => {
    days = syncTransactionIntoDays(t, days);
  });

  console.log('Generated days count:', days.length);

  for (let i = 0; i < days.length; i += 400) {
    const chunk = days.slice(i, i + 400);
    const batch = writeBatch(db);
    chunk.forEach(d => {
      const sanitized = cleanPayloadForFirestore({
        ...d,
        updatedAt: new Date().toISOString()
      });
      batch.set(doc(db, 'days', d.id), sanitized, { merge: true });
    });
    await batch.commit();
    console.log('Committed days chunk of', chunk.length);
  }

  fs.writeFileSync('data/synced_days.json', JSON.stringify(days, null, 2), 'utf-8');
  console.log('data/synced_days.json updated.');
}

syncAllDays().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
