from pathlib import Path
p = Path('/home/ubuntu/review_ST_STORE_ORDERS/client/src/pages/TelegramDeliveryRoom.tsx')
s = p.read_text()
s2 = s.replace(', FileWarning', '').replace('<FileWarning className="h-4 w-4" />', '<AlertTriangle className="h-4 w-4" />')
if s2 == s:
    raise SystemExit('no ST FileWarning occurrence changed')
p.write_text(s2)
print('ST FileWarning replaced')
