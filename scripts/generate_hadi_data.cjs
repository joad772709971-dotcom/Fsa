const fs = require('fs');
const path = require('path');

const part1 = require('./hadi_pages_part1.cjs');
const part2 = require('./hadi_pages_part2.cjs');

const allPages = [...part1, ...part2];
console.log(`Loaded ${allPages.length} pages.`);

const transactions = [];

function parseAmount(str) {
  if (!str) return 0;
  return parseFloat(str.replace(/,/g, '').trim());
}

allPages.forEach((pageText, pageIndex) => {
  const lines = pageText.split('\n').map(l => l.trim()).filter(Boolean);
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    
    // Check if line is a date YYYY-MM-DD
    const dateMatch = line.match(/^(\d{4}-\d{2}-\d{2})$/);
    if (dateMatch) {
      const date = dateMatch[1];
      const descLine = lines[i + 1] || '';
      const amountLine = lines[i + 2] || '';
      
      // Check amountLine: e.g., "2424 عليه 10,050.90" or "20000 له 20,066.90" or "447.7 عليه 7,925.20"
      const amtMatch = amountLine.match(/^([\d,]+(?:\.\d+)?)\s+(عليه|له)\s+([\d,]+(?:\.\d+)?)/);
      if (amtMatch) {
        const amount = parseAmount(amtMatch[1]);
        const type = amtMatch[2]; // عليه = debit (sales/expense), له = credit (deposit/purchase from Mayas)
        const balanceAfter = parseAmount(amtMatch[3]);
        
        // Extract phone number or details from descLine
        let phone = '';
        const phoneMatch = descLine.match(/(?:رقم التلفون|تلفون|رقم)\.?\s*(\d{7,10})/);
        if (phoneMatch) {
          phone = phoneMatch[1];
        }
        
        const isMayas = descLine.includes('محمد خالد مياس') || descLine.includes('ابو البراء') || descLine.includes('مياس');
        
        transactions.push({
          page: pageIndex + 1,
          date,
          description: descLine,
          amount,
          type, // 'عليه' (sales/packages/payments) or 'له' (purchase/transfer from Mayas or credit)
          balanceAfter,
          phone,
          isMayasPurchase: type === 'له' && isMayas,
          isMayasTransferOut: type === 'عليه' && isMayas
        });
        
        i += 3;
        continue;
      } else {
        console.warn(`[Page ${pageIndex + 1}] Unmatched amount line after date ${date}:`, amountLine);
      }
    }
    i++;
  }
});

console.log(`Parsed total ${transactions.length} transactions.`);

let totalAlayhi = 0;
let totalLe = 0;
transactions.forEach(t => {
  if (t.type === 'عليه') totalAlayhi += t.amount;
  if (t.type === 'له') totalLe += t.amount;
});

console.log(`Total عليه (Debit/Sales): ${totalAlayhi.toFixed(2)}`);
console.log(`Total له (Credit/Purchases): ${totalLe.toFixed(2)}`);
console.log(`Calculated balance: ${(totalLe - totalAlayhi).toFixed(2)}`);
console.log(`Target from statement: 602,411.10 عليه ، 622,537.30 له ، الرصيد: 20,126.20`);

// Group by Day
const dailyMap = {};
transactions.forEach(t => {
  if (!dailyMap[t.date]) {
    dailyMap[t.date] = {
      date: t.date,
      openingBalance: 0,
      purchasedFromMayas: 0,
      totalPurchases: 0,
      sales: 0,
      transfersOutToMayas: 0,
      closingBalance: 0,
      txCount: 0,
      transactions: []
    };
  }
  const day = dailyMap[t.date];
  day.txCount++;
  day.transactions.push(t);
  
  if (t.type === 'له') {
    day.totalPurchases += t.amount;
    if (t.isMayasPurchase) {
      day.purchasedFromMayas += t.amount;
    }
  } else if (t.type === 'عليه') {
    if (t.isMayasTransferOut) {
      day.transfersOutToMayas += t.amount;
    } else {
      day.sales += t.amount;
    }
  }
});

// Calculate opening and closing balances in chronological order
// Statement starts on 2026-08-01 with initial opening balance before first transaction
// Note: transactions in statement appear reverse-chronological or chronological?
console.log('First 3 transactions in parsed list:');
console.log(transactions.slice(0, 3).map(t => `${t.date} ${t.type} ${t.amount} bal:${t.balanceAfter}`));
console.log('Last 3 transactions in parsed list:');
console.log(transactions.slice(-3).map(t => `${t.date} ${t.type} ${t.amount} bal:${t.balanceAfter}`));

// Save parsed transactions to a json file
fs.writeFileSync(path.join(__dirname, 'hadi_parsed.json'), JSON.stringify(transactions, null, 2));
console.log('Saved parsed data to scripts/hadi_parsed.json');
