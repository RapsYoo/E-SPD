const SATUAN = [
  '',
  'Satu',
  'Dua',
  'Tiga',
  'Empat',
  'Lima',
  'Enam',
  'Tujuh',
  'Delapan',
  'Sembilan',
  'Sepuluh',
  'Sebelas',
];

function convertTerbilang(n) {
  const num = Math.floor(Math.abs(Number(n) || 0));
  if (num === 0) return '';
  if (num < 12) return SATUAN[num];
  if (num < 20) return `${convertTerbilang(num - 10)} Belas`;
  if (num < 100) return `${convertTerbilang(Math.floor(num / 10))} Puluh${num % 10 ? ` ${convertTerbilang(num % 10)}` : ''}`;
  if (num < 200) return `Seratus${num - 100 ? ` ${convertTerbilang(num - 100)}` : ''}`;
  if (num < 1000) return `${convertTerbilang(Math.floor(num / 100))} Ratus${num % 100 ? ` ${convertTerbilang(num % 100)}` : ''}`;
  if (num < 2000) return `Seribu${num - 1000 ? ` ${convertTerbilang(num - 1000)}` : ''}`;
  if (num < 1000000) return `${convertTerbilang(Math.floor(num / 1000))} Ribu${num % 1000 ? ` ${convertTerbilang(num % 1000)}` : ''}`;
  if (num < 1000000000) return `${convertTerbilang(Math.floor(num / 1000000))} Juta${num % 1000000 ? ` ${convertTerbilang(num % 1000000)}` : ''}`;
  if (num < 1000000000000) return `${convertTerbilang(Math.floor(num / 1000000000))} Miliar${num % 1000000000 ? ` ${convertTerbilang(num % 1000000000)}` : ''}`;
  return `${convertTerbilang(Math.floor(num / 1000000000000))} Triliun${num % 1000000000000 ? ` ${convertTerbilang(num % 1000000000000)}` : ''}`;
}

export function terbilangRupiah(amount) {
  const num = Math.round(Number(amount) || 0);
  if (num === 0) return 'Nol Rupiah';
  const prefix = num < 0 ? 'Minus ' : '';
  return `${prefix}${convertTerbilang(num).replace(/\s+/g, ' ').trim()} Rupiah`;
}

export function formatRupiah(amount) {
  const num = Math.round(Number(amount) || 0);
  return num.toLocaleString('id-ID');
}

export function calcRpdItemTotal(item) {
  const qty = Number(item?.jumlah_satuan) || 0;
  const pct = Number(item?.persentase ?? 100) || 0;
  const besaran = Number(item?.besaran) || 0;
  const kurs = item?.mata_uang === 'USD' ? (Number(item?.kurs) || 0) : 1;
  return Math.round(qty * (pct / 100) * besaran * kurs);
}
