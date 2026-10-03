import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, writeBatch, collection, getDocs } from 'firebase/firestore';
import config from '../firebase-applet-config.json';
import fs from 'fs';

interface RawItem {
  m: number;
  dateTime: string;
  recipient: string;
  account: string;
  desc: string;
  amount: number;
  ref: string;
}

const rawData: RawItem[] = [
  { m: 1, dateTime: '05/08/2026 14:19', recipient: 'خليل الأغبري', account: '777075001', desc: 'قطع غيار جوالات', amount: 12000, ref: '548992350810' },
  { m: 2, dateTime: '05/08/2026 21:54', recipient: 'المصنف (جمال المصنف)', account: '772851523', desc: 'إكسسوارات ومودمات تجارة', amount: 56500, ref: '097628123060' },
  { m: 3, dateTime: '05/08/2026 22:38', recipient: 'خليل الأغبري', account: '777075001', desc: 'قطع غيار جوالات', amount: 10000, ref: '479665906154' },
  { m: 4, dateTime: '06/08/2026 14:32', recipient: 'خليل الأغبري', account: '777075001', desc: 'قطع غيار جوالات', amount: 11000, ref: '082427956473' },
  { m: 5, dateTime: '06/08/2026 23:01', recipient: 'خليل الأغبري', account: '777075001', desc: 'قطع غيار جوالات', amount: 5000, ref: '030238571910' },
  { m: 6, dateTime: '07/08/2026 00:09', recipient: 'خليل الأغبري', account: '777075001', desc: 'قطع غيار جوالات', amount: 10000, ref: '399867480569' },
  { m: 7, dateTime: '08/08/2026 14:40', recipient: 'عمر القاسمي', account: '772730163', desc: 'قطع غيار جوال', amount: 9750, ref: '420656670698' },
  { m: 8, dateTime: '08/08/2026 18:16', recipient: 'عمر القاسمي', account: '772730163', desc: 'قطع غيار جوال', amount: 7500, ref: '637487377073' },
  { m: 9, dateTime: '09/08/2026 21:55', recipient: 'خليل الأغبري', account: '777075001', desc: 'قطع غيار جوالات', amount: 15000, ref: '051233326802' },
  { m: 10, dateTime: '10/08/2026 14:57', recipient: 'خليل الأغبري', account: '777075001', desc: 'قطع غيار جوالات', amount: 5500, ref: '566505765250' },
  { m: 11, dateTime: '12/08/2026 17:44', recipient: 'عمر القاسمي', account: '772730163', desc: 'قطع غيار جوال', amount: 18500, ref: '796738309690' },
  { m: 12, dateTime: '13/08/2026 22:09', recipient: 'مصعب الصوفي', account: '773120005', desc: 'عهدة مالك المحل', amount: 67000, ref: '767948386479' },
  { m: 13, dateTime: '15/08/2026 18:58', recipient: 'سداد مودم المحل (يمن فورجي)', account: '106395354', desc: 'سداد باقة مودم المحل', amount: 2400, ref: '482464035868' },
  { m: 14, dateTime: '15/08/2026 19:02', recipient: 'سداد مودم (يمن فورجي)', account: '106412373', desc: 'سداد باقة مودم فورجي', amount: 2400, ref: '724268339877' },
  { m: 15, dateTime: '16/08/2026 15:39', recipient: 'عمر القاسمي', account: '772730163', desc: 'قطع غيار جوال', amount: 14600, ref: '733355624239' },
  { m: 16, dateTime: '17/08/2026 15:25', recipient: 'عمر القاسمي', account: '772730163', desc: 'قطع غيار جوال', amount: 15000, ref: '389696429339' },
  { m: 17, dateTime: '17/08/2026 16:32', recipient: 'الوصابي (حسام الوصابي)', account: '774727171', desc: 'حزم برامج وبرمجة', amount: 14500, ref: '243698864009' },
  { m: 18, dateTime: '18/08/2026 02:15', recipient: 'مصعب الصوفي', account: '773120005', desc: 'عهدة مالك المحل', amount: 43000, ref: '142034011199' },
  { m: 19, dateTime: '18/08/2026 15:22', recipient: 'عمر القاسمي', account: '772730163', desc: 'قطع غيار جوال', amount: 7800, ref: '041790483665' },
  { m: 20, dateTime: '18/08/2026 15:50', recipient: 'العبصري (عبد الملك)', account: '772999679', desc: 'قطع غيار جوال', amount: 4000, ref: '482130385796' },
  { m: 21, dateTime: '19/08/2026 15:57', recipient: 'عمر القاسمي', account: '772730163', desc: 'قطع غيار جوال', amount: 18750, ref: '018700269456' },
  { m: 22, dateTime: '20/08/2026 15:43', recipient: 'عمر القاسمي', account: '772730163', desc: 'قطع غيار جوال', amount: 2000, ref: '977543884518' },
  { m: 23, dateTime: '20/08/2026 20:16', recipient: 'العبصري (عبد الملك)', account: '772999679', desc: 'قطع غيار جوال', amount: 4700, ref: '429128930579' },
  { m: 24, dateTime: '22/08/2026 23:42', recipient: 'فايز سرحان', account: '771388404', desc: 'رصيد تطبيق القمة', amount: 25000, ref: '876443217913' },
  { m: 25, dateTime: '23/08/2026 22:32', recipient: 'الوصابي (حسام الوصابي)', account: '774727171', desc: 'حزم برامج وبرمجة', amount: 1000, ref: '976803014832' },
  { m: 26, dateTime: '24/08/2026 15:48', recipient: 'عمر القاسمي', account: '772730163', desc: 'قطع غيار جوال', amount: 13000, ref: '829801798264' },
  { m: 27, dateTime: '24/08/2026 20:21', recipient: 'فايز سرحان', account: '771388404', desc: 'رصيد تطبيق القمة', amount: 20000, ref: '270610333814' },
  { m: 28, dateTime: '25/08/2026 16:31', recipient: 'خليل الأغبري', account: '777075001', desc: 'قطع غيار جوالات', amount: 2900, ref: '281546206510' },
  { m: 29, dateTime: '25/08/2026 18:04', recipient: 'العبصري (عبد الملك)', account: '772999679', desc: 'قطع غيار جوال', amount: 2900, ref: '398040572018' },
  { m: 30, dateTime: '26/08/2026 10:39', recipient: 'فايز سرحان', account: '771388404', desc: 'رصيد تطبيق القمة', amount: 10000, ref: '534745364928' },
  { m: 31, dateTime: '27/08/2026 09:17', recipient: 'فايز سرحان', account: '771388404', desc: 'رصيد تطبيق القمة', amount: 14000, ref: '024510988906' },
  { m: 32, dateTime: '27/08/2026 14:09', recipient: 'خليل الأغبري', account: '777075001', desc: 'قطع غيار جوالات', amount: 7000, ref: '474869970684' },
  { m: 33, dateTime: '30/08/2026 05:42', recipient: 'سداد مودم المحل (يمن فورجي)', account: '106458875', desc: 'سداد باقة مودم المحل', amount: 8000, ref: '010611501542' },
  { m: 34, dateTime: '31/08/2026 14:35', recipient: 'عمر القاسمي', account: '772730163', desc: 'قطع غيار جوال', amount: 3000, ref: '428367814042' },
  { m: 35, dateTime: '31/08/2026 14:35', recipient: 'خليل الأغبري', account: '777075001', desc: 'قطع غيار جوالات', amount: 4900, ref: '351733511437' },
  { m: 36, dateTime: '01/09/2026 15:29', recipient: 'عمر القاسمي', account: '772730163', desc: 'قطع غيار جوال', amount: 10000, ref: '936505764173' },
  { m: 37, dateTime: '02/09/2026 14:50', recipient: 'خليل الأغبري', account: '777075001', desc: 'قطع غيار جوالات', amount: 15000, ref: '767259294283' },
  { m: 38, dateTime: '02/09/2026 15:10', recipient: 'خليل الأغبري', account: '777075001', desc: 'قطع غيار جوالات', amount: 5000, ref: '506750208509' },
  { m: 39, dateTime: '02/09/2026 18:54', recipient: 'فايز سرحان', account: '771388404', desc: 'رصيد تطبيق القمة', amount: 20000, ref: '028156784480' },
  { m: 40, dateTime: '03/09/2026 15:49', recipient: 'فايز سرحان', account: '771388404', desc: 'رصيد تطبيق القمة', amount: 20000, ref: '561767769034' },
  { m: 41, dateTime: '03/09/2026 22:48', recipient: 'خليل الأغبري', account: '777075001', desc: 'قطع غيار جوالات', amount: 5000, ref: '661561658992' },
  { m: 42, dateTime: '08/09/2026 14:04', recipient: 'خليل الأغبري', account: '777075001', desc: 'قطع غيار جوالات', amount: 20000, ref: '990243710884' },
  { m: 43, dateTime: '09/09/2026 15:12', recipient: 'خليل الأغبري', account: '777075001', desc: 'قطع غيار جوالات', amount: 8000, ref: '145265157087' },
  { m: 44, dateTime: '10/09/2026 22:28', recipient: 'خليل الأغبري', account: '777075001', desc: 'قطع غيار جوالات', amount: 9000, ref: '737394198066' },
  { m: 45, dateTime: '13/09/2026 14:41', recipient: 'عمر القاسمي', account: '772730163', desc: 'قطع غيار جوال', amount: 4000, ref: '033390348351' },
  { m: 46, dateTime: '13/09/2026 15:16', recipient: 'المصنف (جمال المصنف)', account: '772851523', desc: 'إكسسوارات ومودمات تجارة', amount: 15000, ref: '272392920583' },
  { m: 47, dateTime: '13/09/2026 19:42', recipient: 'مصعب الصوفي', account: '773120005', desc: 'عهدة مالك المحل', amount: 5000, ref: '219715165731' },
  { m: 48, dateTime: '14/09/2026 14:52', recipient: 'خليل الأغبري', account: '777075001', desc: 'قطع غيار جوالات', amount: 16000, ref: '423427557336' },
  { m: 49, dateTime: '14/09/2026 15:57', recipient: 'خليل الأغبري', account: '777075001', desc: 'قطع غيار جوالات', amount: 3000, ref: '994586867985' },
  { m: 50, dateTime: '15/09/2026 15:27', recipient: 'عمر القاسمي', account: '772730163', desc: 'قطع غيار جوال', amount: 22100, ref: '177542230803' },
  { m: 51, dateTime: '20/09/2026 16:41', recipient: 'محمد القاسمي', account: '772505788', desc: 'قطع غيار جوال', amount: 8000, ref: '425645743477' },
  { m: 52, dateTime: '21/09/2026 22:17', recipient: 'خليل الأغبري', account: '777075001', desc: 'قطع غيار جوالات', amount: 20000, ref: '187740047275' },
  { m: 53, dateTime: '22/09/2026 21:11', recipient: 'خليل الأغبري', account: '777075001', desc: 'قطع غيار جوالات', amount: 15000, ref: '447159796533' },
  { m: 54, dateTime: '24/09/2026 00:15', recipient: 'خليل الأغبري', account: '777075001', desc: 'قطع غيار جوالات', amount: 15000, ref: '288962773553' },
  { m: 55, dateTime: '26/09/2026 15:19', recipient: 'عمر القاسمي (مشتريات جوالي)', account: '772730163', desc: 'قطع غيار جوال', amount: 4300, ref: '321207073980' },
  { m: 56, dateTime: '26/09/2026 15:38', recipient: 'عمر القاسمي', account: '772730163', desc: 'قطع غيار جوال', amount: 15500, ref: '712324928295' },
  { m: 57, dateTime: '27/09/2026 22:17', recipient: 'عمر القاسمي', account: '772730163', desc: 'قطع غيار جوال', amount: 12500, ref: '312664138918' },
  { m: 58, dateTime: '29/09/2026 14:33', recipient: 'خليل الأغبري', account: '777075001', desc: 'قطع غيار جوالات', amount: 9300, ref: '727490635989' },
  { m: 59, dateTime: '30/09/2026 15:30', recipient: 'خليل الأغبري', account: '777075001', desc: 'قطع غيار جوالات', amount: 10000, ref: '170490152953' },
  { m: 60, dateTime: '01/10/2026 23:33', recipient: 'خليل الأغبري', account: '777075001', desc: 'قطع غيار جوالات', amount: 17500, ref: '843235013132' }
];

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function importJawali() {
  console.log('--- STARTING IMPORT OF 60 JAWALI TRANSFERS ---');

  const parsedTxs = rawData.map(r => {
    const parts = r.dateTime.split(' ');
    const dPart = parts[0];
    const tPart = parts[1] || '12:00';
    const dSegments = dPart.split('/');
    const day = dSegments[0].padStart(2, '0');
    const month = dSegments[1].padStart(2, '0');
    const year = dSegments[2];
    const isoDate = `${year}-${month}-${day}`;
    const isoTime = tPart;
    const isoTimestamp = `${isoDate}T${isoTime}:00.000Z`;

    let type = 'transfer_to_supplier';
    let category = 'purchases';
    let supplierId: string | undefined = undefined;
    let supplierName: string | undefined = undefined;
    let party = r.recipient;

    if (r.recipient.includes('مصعب')) {
      type = 'mosaab_purchases_fund';
      category = 'mosaab';
      party = 'مصعب الصوفي';
    } else if (r.recipient.includes('مودم')) {
      type = 'expense_modem';
      category = 'expenses';
      party = 'يمن فورجي (مودم المحل)';
    } else if (r.recipient.includes('الوصابي')) {
      type = 'expense_shop';
      category = 'expenses';
      supplierId = 'sup_wassabi';
      supplierName = 'الوصابي (حسام الوصابي)';
      party = 'الوصابي (حسام الوصابي)';
    } else if (r.recipient.includes('فايز') || r.recipient.includes('سرحان')) {
      type = 'transfer_to_supplier';
      category = 'balance';
      supplierId = 'sup_5';
      supplierName = 'فايز أبو علي (شبكة القمة)';
      party = 'فايز سرحان';
    } else if (r.recipient.includes('المصنف')) {
      type = 'transfer_to_supplier';
      category = 'purchases';
      supplierId = 'sup_musannaf';
      supplierName = 'المصنف (جمال المصنف)';
      party = 'المصنف (جمال المصنف)';
    } else if (r.recipient.includes('محمد القاسمي')) {
      type = 'transfer_to_supplier';
      category = 'purchases';
      supplierId = 'sup_mohammed_qasimi';
      supplierName = 'محمد القاسمي';
      party = 'محمد القاسمي';
    } else if (r.recipient.includes('عمر القاسمي')) {
      type = 'transfer_to_supplier';
      category = 'purchases';
      supplierId = 'sup_2';
      supplierName = 'عمر القاسمي لقطع الصيانة';
      party = 'عمر القاسمي';
    } else if (r.recipient.includes('العبصري')) {
      type = 'transfer_to_supplier';
      category = 'purchases';
      supplierId = 'sup_1';
      supplierName = 'مؤسسة العبصري لقطع الغيار';
      party = 'مؤسسة العبصري لقطع الغيار';
    } else if (r.recipient.includes('خليل')) {
      type = 'transfer_to_supplier';
      category = 'purchases';
      supplierId = 'sup_3';
      supplierName = 'خليل الأغبري للإكسسوارات وقطع الغيار';
      party = 'خليل الأغبري';
    }

    const tx: Record<string, any> = {
      id: `tx_jawali_${r.ref}`,
      date: isoDate,
      time: isoTime,
      type: type,
      category: category,
      description: `${r.desc} - ${r.recipient} (${r.account})`,
      price: r.amount,
      amount: r.amount,
      profit: 0,
      party: party,
      paymentMethod: 'transfer',
      referenceNo: r.ref,
      notes: `حوالة محفظة جوالي (${r.recipient}) رقم الحساب: ${r.account} - كود المرجع: ${r.ref}`,
      status: 'completed',
      storeId: 'store_mosaab_alsoufi',
      ownerId: 'user_mosaab',
      updatedAt: isoTimestamp,
      createdAt: isoTimestamp
    };

    if (supplierId) tx.supplierId = supplierId;
    if (supplierName) tx.supplierName = supplierName;

    return tx;
  });

  console.log('Prepared', parsedTxs.length, 'transactions.');

  // Save to Firestore in batches
  for (let i = 0; i < parsedTxs.length; i += 400) {
    const chunk = parsedTxs.slice(i, i + 400);
    const batch = writeBatch(db);
    chunk.forEach(t => {
      batch.set(doc(db, 'transactions', t.id), t);
    });
    await batch.commit();
    console.log('Committed batch of', chunk.length, 'transactions to Firestore.');
  }

  // Calculate supplier transfer totals
  const supplierTotals: Record<string, number> = {};
  parsedTxs.forEach(t => {
    if (t.supplierId) {
      supplierTotals[t.supplierId] = (supplierTotals[t.supplierId] || 0) + (t.price || 0);
    }
  });
  console.log('Supplier transfer totals from Jawali:', supplierTotals);

  // Update Suppliers in Firestore
  const supBatch = writeBatch(db);
  const suppliersToUpdate = [
    { id: 'sup_1', name: 'مؤسسة العبصري لقطع الغيار', phone: '772999679', totalPaid: supplierTotals['sup_1'] || 0, remainingBalance: -(supplierTotals['sup_1'] || 0) },
    { id: 'sup_2', name: 'عمر القاسمي لقطع الصيانة', phone: '772730163', totalPaid: supplierTotals['sup_2'] || 0, remainingBalance: -(supplierTotals['sup_2'] || 0) },
    { id: 'sup_3', name: 'خليل الأغبري للإكسسوارات وقطع الغيار', phone: '777075001', totalPaid: supplierTotals['sup_3'] || 0, remainingBalance: -(supplierTotals['sup_3'] || 0) },
    { id: 'sup_5', name: 'فايز أبو علي (شبكة القمة)', phone: '771388404', totalPaid: supplierTotals['sup_5'] || 0, remainingBalance: -(supplierTotals['sup_5'] || 0) },
    { id: 'sup_musannaf', name: 'المصنف (جمال المصنف)', phone: '772851523', totalPaid: supplierTotals['sup_musannaf'] || 0, remainingBalance: -(supplierTotals['sup_musannaf'] || 0), type: 'spare_parts', location: 'صنعاء / ذمار', notes: 'إكسسوارات ومودمات تجارة' },
    { id: 'sup_mohammed_qasimi', name: 'محمد القاسمي', phone: '772505788', totalPaid: supplierTotals['sup_mohammed_qasimi'] || 0, remainingBalance: -(supplierTotals['sup_mohammed_qasimi'] || 0), type: 'spare_parts', location: 'صنعاء', notes: 'قطع غيار جوال وشاشات' },
    { id: 'sup_wassabi', name: 'الوصابي (حسام الوصابي)', phone: '774727171', totalPaid: supplierTotals['sup_wassabi'] || 0, remainingBalance: -(supplierTotals['sup_wassabi'] || 0), type: 'services', location: 'صنعاء', notes: 'حزم برامج وبرمجة وخدمات تقنية' }
  ];

  suppliersToUpdate.forEach(s => {
    supBatch.set(doc(db, 'suppliers', s.id), s, { merge: true });
  });
  await supBatch.commit();
  console.log('Suppliers updated in Firestore.');

  // Update server data/synced_transactions.json
  const allTxSnap = await getDocs(collection(db, 'transactions'));
  const allTxs = allTxSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  fs.writeFileSync('data/synced_transactions.json', JSON.stringify(allTxs, null, 2), 'utf-8');
  console.log('data/synced_transactions.json updated. Total transactions:', allTxs.length);

  console.log('--- JAWALI IMPORT COMPLETED SUCCESSFULLY ---');
}

importJawali().then(() => process.exit(0)).catch(e => { console.error('Error:', e); process.exit(1); });
