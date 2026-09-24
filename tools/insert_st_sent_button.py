from pathlib import Path
path = Path('/home/ubuntu/review_ST_STORE_ORDERS/client/src/pages/TelegramDeliveryRoom.tsx')
text = path.read_text()
needle = '<Button onClick={copyMessage} disabled={!order} variant="outline" className="border-orange-400/20 text-orange-200">'
insert = '<Button onClick={markCurrentOrderSent} disabled={!order || isSent(order)} className="border border-cyan-300/50 bg-cyan-500/20 text-cyan-100"><CheckCircle2 className="mr-2 h-4 w-4" />{isSent(order) ? "ส่งแล้ว" : "ติ๊กว่าส่งแล้ว"}</Button>' + needle
if text.count(needle) != 1:
    raise SystemExit(f'expected one anchor, found {text.count(needle)}')
path.write_text(text.replace(needle, insert, 1))
print('inserted ST sent button')
