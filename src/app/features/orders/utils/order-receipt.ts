import { Order } from '../../../core/models/order/order';

export function buildOrderReceiptHtml(order: Order): string {
  const escape = (value: unknown): string => String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  const money = (value: number | null | undefined): string =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(Number(value ?? 0));
  const date = (value?: string): string => {
    if (!value) return 'No informado';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? escape(value) : parsed.toLocaleString('es-CL');
  };
  const items = (order.items ?? []).map(item => {
    const unit = item.unitName || 'Unidad';
    const quantity = Number(item.quantity ?? 0);
    const factor = Number(item.conversionFactor ?? 1);
    const unitPrice = Number(item.unitPrice ?? 0);
    const total = Number(item.totalPrice ?? quantity * factor * unitPrice);
    return `<tr><td colspan="2" class="product">${escape(item.productName)}</td></tr>
      <tr><td>${quantity} ${escape(unit)} × ${money(unitPrice)}</td><td class="right">${money(total)}</td></tr>`;
  }).join('');

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>Pedido #${escape(order.id)} - Ferretería FC</title>
<style>
@page{size:80mm auto;margin:4mm}
*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#111;width:72mm;margin:0 auto;font-size:11px}
h1{font-size:19px;text-align:center;margin:0 0 4px}h2{font-size:13px;text-align:center;margin:2px 0}
p{margin:3px 0}.center{text-align:center}.muted{color:#444}.line{border-top:1px dashed #333;margin:8px 0}
table{width:100%;border-collapse:collapse}td{padding:3px 0;vertical-align:top}.right{text-align:right;white-space:nowrap}
.product{font-weight:bold;padding-top:6px}.total{font-size:15px;font-weight:bold}
.footer{text-align:center;margin-top:14px;font-size:10px}
@media screen{body{margin:12px auto;padding:10px;border:1px solid #ddd}}
</style></head><body>
<h1>FERRETERÍA FC</h1>
<h2>COMPROBANTE DE PEDIDO</h2>
<p class="center">RUT: XX.XXX.XXX-X</p>
<p class="center">Dirección: [Dirección de la empresa]</p>
<p class="center">Teléfono: [Teléfono de contacto]</p>
<div class="line"></div>
<p><b>Pedido:</b> #${escape(order.id)}</p>
<p><b>N° interno:</b> ${escape(order.orderNumber)}</p>
<p><b>Fecha:</b> ${date(order.createdAt)}</p>
<p><b>Estado:</b> ${escape(order.status)}</p>
<div class="line"></div>
<p><b>Cliente:</b> ${escape(order.customerName)}</p>
<p><b>Teléfono:</b> ${escape(order.phone || 'No informado')}</p>
<p><b>Dirección:</b> ${escape(order.address || 'No informado')}</p>
<p><b>Entrega:</b> ${date(order.deliveryDate)}</p>
<div class="line"></div>
<table><tbody>${items}</tbody></table>
<div class="line"></div>
<table><tbody><tr class="total"><td>TOTAL</td><td class="right">${money(order.totalAmount)}</td></tr></tbody></table>
<p><b>Medio de pago:</b> ${escape(order.paymentMethod)}</p>
<p><b>Registrado por:</b> ${escape(order.createdBy?.name || order.createdBy?.email || 'No informado')}</p>
${order.notes ? `<div class="line"></div><p><b>Observaciones:</b> ${escape(order.notes)}</p>` : ''}
<div class="line"></div>
<p class="footer">Gracias por preferir Ferretería FC<br>Documento de uso interno / comprobante de pedido.<br>No reemplaza una boleta tributaria electrónica.</p>
</body></html>`;
}
