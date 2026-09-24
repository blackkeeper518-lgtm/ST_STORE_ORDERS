from pathlib import Path
p = Path('/home/ubuntu/review_ST_STORE_ORDERS/client/src/pages/OrderControl.tsx')
s = p.read_text()
old = 'PRODUCT PAYLOAD</p><div className="space-y-2">{(selectedOrder.items.length ? selectedOrder.items : [{ id: 0, sku: selectedOrder.sku, th_name: selectedOrder.th_name, emoji: selectedOrder.emoji, display_for_packer: selectedOrder.display_for_packer, quantity: selectedOrder.items.length ? 0 : null, unit_price: selectedOrder.unit_price ?? selectedOrder.alien_unit_prices, expected_cod: selectedOrder.expected_cod }])'
new = 'PRODUCT PAYLOAD · for_packer_st_display</p><div className="space-y-2">{(selectedOrder.items.length ? selectedOrder.items : [{ id: 0, sku: selectedOrder.sku, th_name: selectedOrder.th_name, emoji: selectedOrder.emoji, for_packer_st_display: selectedOrder.for_packer_st_display, display_for_packer: selectedOrder.display_for_packer, quantity: selectedOrder.items.length ? 0 : null, unit_price: selectedOrder.unit_price ?? selectedOrder.alien_unit_prices, expected_cod: selectedOrder.expected_cod }])'
if s.count(old) != 1:
    raise SystemExit(f'expected one product card anchor, found {s.count(old)}')
p.write_text(s.replace(old, new, 1))
print('ST order product display fixed')
