import { jsPDF } from 'jspdf';
import { Product, ShoppingItem, UserPreferences, UserProfile } from '../types';
import { translations } from './i18n';
import { calculateProductStatus } from './barcodeService';

export function exportInventoryPDF(
  products: Product[],
  user: UserProfile,
  preferences: UserPreferences
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const t = translations[preferences.language];
  const lang = preferences.language;

  // Header Banner
  doc.setFillColor(0, 74, 33); // #004a21 Primary Green
  doc.rect(0, 0, 210, 32, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('PANTRY GUARD', 16, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(
    lang === 'es' ? 'Reporte de Inventario y Despensa' : 'Pantry & Inventory Report',
    16,
    25
  );

  // Date & User right-aligned
  const now = new Date();
  const dateStr = now.toLocaleDateString(lang === 'es' ? 'es-MX' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.setFontSize(9);
  doc.text(dateStr, 194, 16, { align: 'right' });
  doc.text(user.name, 194, 23, { align: 'right' });

  // Summary Metrics Banner
  let freshCount = 0;
  let expiringCount = 0;
  let expiredCount = 0;

  products.forEach((p) => {
    const { status } = calculateProductStatus(p.expiryDate, preferences.expiryAlertDays);
    if (status === 'fresh') freshCount++;
    else if (status === 'expiring') expiringCount++;
    else if (status === 'expired') expiredCount++;
  });

  // Draw 4 Metric cards
  const startY = 40;
  const cardWidth = 42;
  const cardHeight = 18;
  const gap = 6;

  const metrics = [
    {
      label: lang === 'es' ? 'Total Productos' : 'Total Items',
      val: products.length.toString(),
      color: [25, 28, 32],
      bg: [242, 243, 249],
    },
    {
      label: lang === 'es' ? 'Vigentes' : 'Fresh',
      val: freshCount.toString(),
      color: [0, 74, 33],
      bg: [235, 248, 238],
    },
    {
      label: lang === 'es' ? 'Próximos' : 'Expiring',
      val: expiringCount.toString(),
      color: [159, 66, 0],
      bg: [255, 243, 235],
    },
    {
      label: lang === 'es' ? 'Caducados' : 'Expired',
      val: expiredCount.toString(),
      color: [186, 26, 26],
      bg: [255, 234, 232],
    },
  ];

  metrics.forEach((m, idx) => {
    const x = 16 + idx * (cardWidth + gap);
    doc.setFillColor(m.bg[0], m.bg[1], m.bg[2]);
    doc.roundedRect(x, startY, cardWidth, cardHeight, 2, 2, 'F');

    doc.setTextColor(112, 122, 111);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(m.label, x + 4, startY + 6);

    doc.setTextColor(m.color[0], m.color[1], m.color[2]);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(m.val, x + 4, startY + 14);
  });

  // Table Header
  let tableY = 66;
  doc.setFillColor(236, 238, 243);
  doc.rect(16, tableY, 178, 8, 'F');

  doc.setTextColor(25, 28, 32);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');

  doc.text(lang === 'es' ? 'Producto' : 'Product', 20, tableY + 5.5);
  doc.text(lang === 'es' ? 'Categoría' : 'Category', 70, tableY + 5.5);
  doc.text(lang === 'es' ? 'Cantidad' : 'Qty', 110, tableY + 5.5);
  doc.text(lang === 'es' ? 'Ubicación' : 'Location', 135, tableY + 5.5);
  doc.text(lang === 'es' ? 'Estado / Caducidad' : 'Status / Expiry', 165, tableY + 5.5);

  tableY += 8;

  // Table Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  products.forEach((p, idx) => {
    if (tableY > 270) {
      doc.addPage();
      tableY = 20;
    }

    const { status, displayText } = calculateProductStatus(p.expiryDate, preferences.expiryAlertDays);

    // Alternate row background
    if (idx % 2 === 1) {
      doc.setFillColor(248, 249, 255);
      doc.rect(16, tableY, 178, 7.5, 'F');
    }

    // Status line indicator on left
    if (status === 'expired') doc.setFillColor(186, 26, 26);
    else if (status === 'expiring') doc.setFillColor(255, 122, 43);
    else doc.setFillColor(0, 74, 33);
    doc.rect(16, tableY, 1.5, 7.5, 'F');

    doc.setTextColor(25, 28, 32);
    doc.setFont('helvetica', 'bold');
    doc.text(p.name, 20, tableY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(64, 73, 64);
    const catLabel = t.categories[p.category] || p.category;
    doc.text(catLabel, 70, tableY + 5);

    doc.text(`${p.quantity} ${t.units[p.unit] || p.unit}`, 110, tableY + 5);
    const locLabel = t.locations[p.location] || p.location;
    doc.text(locLabel, 135, tableY + 5);

    // Status text & date
    if (status === 'expired') doc.setTextColor(186, 26, 26);
    else if (status === 'expiring') doc.setTextColor(159, 66, 0);
    else doc.setTextColor(0, 74, 33);
    doc.text(`${displayText[lang]} (${p.expiryDate})`, 165, tableY + 5);

    tableY += 7.5;
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Pantry Guard • ${lang === 'es' ? 'Página' : 'Page'} ${i} ${lang === 'es' ? 'de' : 'of'} ${pageCount}`,
      105,
      290,
      { align: 'center' }
    );
  }

  const filename = `Pantry_Guard_Inventario_${new Date().toISOString().split('T')[0]}.pdf`;
  deliverPdf(doc, filename);
}

async function deliverPdf(doc: jsPDF, filename: string) {
  const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor !== undefined;
  const isMobile = typeof window !== 'undefined' && /android|iphone|ipad/i.test(navigator.userAgent);

  // 1. Android WebView / Capacitor dataUri trigger (intercepted by MainActivity DownloadListener)
  // We prioritize this for Capacitor so the file saves directly to the Downloads folder
  if (isCapacitor) {
    try {
      const dataUri = doc.output('datauristring');
      const a = document.createElement('a');
      a.href = dataUri;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => document.body.removeChild(a), 400);
      return; // Exit here, let the Java DownloadListener handle it
    } catch {}
  }

  // 2. Mobile web browser share sheet if supported
  if (isMobile && typeof navigator !== 'undefined' && (navigator as any).canShare) {
    try {
      const blob = doc.output('blob');
      const file = new File([blob], filename, { type: 'application/pdf' });
      if ((navigator as any).canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: filename,
        });
        return;
      }
    } catch (e: any) {
      if (e.name === 'AbortError') return;
    }
  }

  // 3. Standard doc.save (triggers download on desktop web browsers)
  try {
    doc.save(filename);
  } catch {}
}

export function exportShoppingListPDF(
  shoppingItems: ShoppingItem[],
  user: UserProfile,
  preferences: UserPreferences
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const t = translations[preferences.language];
  const lang = preferences.language;

  // Header Banner
  doc.setFillColor(0, 74, 33);
  doc.rect(0, 0, 210, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(lang === 'es' ? 'LISTA DE COMPRAS' : 'SHOPPING LIST', 16, 16);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(
    lang === 'es' ? 'Pantry Guard • Despensa Inteligente' : 'Pantry Guard • Smart Pantry',
    16,
    23
  );

  const now = new Date();
  const dateStr = now.toLocaleDateString(lang === 'es' ? 'es-MX' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(dateStr, 194, 16, { align: 'right' });
  doc.text(user.name, 194, 23, { align: 'right' });

  let startY = 40;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(25, 28, 32);
  doc.text(
    lang === 'es'
      ? `Artículos a comprar (${shoppingItems.length})`
      : `Items to buy (${shoppingItems.length})`,
    16,
    startY
  );

  startY += 6;

  shoppingItems.forEach((item, idx) => {
    if (startY > 270) {
      doc.addPage();
      startY = 20;
    }

    doc.setFillColor(248, 249, 255);
    doc.roundedRect(16, startY, 178, 10, 2, 2, 'F');

    // Checkbox circle
    doc.setDrawColor(112, 122, 111);
    doc.roundedRect(20, startY + 2.5, 5, 5, 1, 1, 'S');

    if (item.checked) {
      doc.setFillColor(0, 74, 33);
      doc.roundedRect(21, startY + 3.5, 3, 3, 0.5, 0.5, 'F');
    }

    // Name
    doc.setFont('helvetica', item.checked ? 'normal' : 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(item.checked ? 140 : 25, item.checked ? 140 : 28, item.checked ? 140 : 32);
    doc.text(item.name, 28, startY + 6.5);

    // Quantity badge
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(64, 73, 64);
    const unitText = `${item.quantity} ${t.units[item.unit] || item.unit}`;
    doc.text(unitText, 140, startY + 6.5);

    // Category
    const catText = t.categories[item.category] || item.category;
    doc.text(catText, 170, startY + 6.5);

    startY += 12;
  });

  const filename = `Pantry_Guard_Compras_${new Date().toISOString().split('T')[0]}.pdf`;
  deliverPdf(doc, filename);
}
