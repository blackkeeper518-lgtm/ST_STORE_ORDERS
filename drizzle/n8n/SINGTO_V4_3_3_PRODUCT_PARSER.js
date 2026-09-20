// ============================================================
// SINGTO V4.3.2 - ENHANCED PRODUCT EXTRACTION ENGINE
// ============================================================
const inputItems = $input.all();

const PRODUCT_MASTER = [
  { id: 1, sku: 'VESS_MINT_COOL', name: 'เวสมินต์คูล', thName: 'เวสมินต์คูล', price: 350, emoji: '🟩', brand: ['vess'], variant: ['mint'], aliases: ['เวสมิ้นคูล','เวสมิ้นคูล1','เวสมิ้นคูล 1','เวสมิ้นคูล2','เวสมิ้นคูล 2','เวสมิ้นคูล3','เวสมิ้นคูล 3','เวสมิ้นคูล4','เวสมิ้นคูล 4','เวสมิ้นคูล5','เวสมิ้นคูล 5'] },
  { id: 2, sku: 'VESS_MINT_MENTHOL', name: 'เวสมินต์เมนทอล', thName: 'เวสมินต์เมนทอล', price: 350, emoji: '🟩', brand: ['vess'], variant: ['mint'], aliases: ['เวสมิ้นเมนทอล','เวสมิ้นเมนทอล1','เวสมิ้นเมนทอล 1','เวสมิ้นเมนทอล2','เวสมิ้นเมนทอล 2','เวสมิ้นเมนทอล3','เวสมิ้นเมนทอล 3','เวสมิ้นเมนทอล4','เวสมิ้นเมนทอล 4','เวสมิ้นเมนทอล5','เวสมิ้นเมนทอล 5'] },
  { id: 3, sku: 'GOLD_MOUNT_GREEN_WHITE', name: 'โกลด์เมาท์เขียวขาว', thName: 'โกลด์เมาท์เขียวขาว', price: 300, emoji: '🟩', brand: ['gold mount'], variant:['mount'], aliases:['โกเขียวขาว','โกเขียวขาว1','โกเขียวขาว 1','โกเขียวขาว2','โกเขียวขาว 2','โกเขียวขาว3','โกเขียวขาว 3','โกเขียวขาว4','โกเขียวขาว 4','โกเขียวขาว5','โกเขียวขาว 5'] },
  { id: 4, sku: 'MILANO_MENTHOL', name: 'มิลาโน่เมนทอล', thName: 'มิลาโน่เมนทอล', price: 250, emoji: '🟩', brand: ['milano'], variant: ['menthol'], aliases: ['มิลาโน่เมนทอล','มิลาโน่เมนทอล1','มิลาโน่เมนทอล 1','มิลาโน่เมนทอล2','มิลาโน่เมนทอล 2','มิลาโน่เมนทอล3','มิลาโน่เมนทอล 3','มิลาโน่เมนทอล4','มิลาโน่เมนทอล 4','มิลาโน่เมนทอล5','มิลาโน่เมนทอล 5'] },
  { id: 5, sku: 'MOND_GREEN', name: 'ม่อนเขียว', thName: 'ม่อนเขียว', price: 240, emoji: '🟩', brand: ['mond'], variant: ['green'], aliases: ['🟢 MOND_GREEN 1 คอต','MOND_GREEN ม่อนเขียว','ม่อนเขียว1','ม่อนเขียว 1','ม่อนเขียว2','ม่อนเขียว 2','ม่อนเขียว3','🟢MOND_GREEN ','ม่อนเขียว4','ม่อนเขียว 4','ม่อนเขียว5','ม่อนเขียว 5'] },
  { id: 6, sku: 'PLATINUM_GREEN', name: 'แพลตตินั่มเขียว', thName: 'แพลตตินั่มเขียว', price: 250, emoji: '🟩', brand: ['platinum'], variant: ['green'], aliases: ['แพตตินั่มเขียว','แพตตินั่มเขียว1','แพตตินั่มเขียว 1','แพตตินั่มเขียว2','แพตตินั่มเขียว 2','แพตตินั่มเขียว3','แพตตินั่มเขียว 3','แพตตินั่มเขียว4','แพตตินั่มเขียว 4','แพตตินั่มเขียว5','แพตตินั่มเขียว 5'] },
  { id: 7, sku: 'SEVIOS_GREEN', name: 'ซีวอสเขียว', thName: 'ซีวอสเขียว', price: 220, emoji: '🟩', brand: ['sevios'], variant: ['green'], aliases: ['ซีวอสเขียว','ซีวอสเขียว1','ซีวอสเขียว 1','ซีวอสเขียว2','ซีวอสเขียว 2','ซีวอสเขียว3','ซีวอสเขียว 3','ซีวอสเขียว4','ซีวอสเขียว 4','ซีวอสเขียว5','ซีวอสเขียว 5'] },
  { id: 8, sku: 'SMS_GREEN', name: 'เอสเอ็มเอสเขียว', thName: 'เอสเอ็มเอสเขียว', price: 250, emoji: '🟩', brand: ['sms'], variant: ['green'], aliases: ['เอสเอ็มเอสเขียว','เอสเอ็มเอสเขียว1','เอสเอ็มเอสเขียว 1','เอสเอ็มเอสเขียว2','เอสเอ็มเอสเขียว 2','เอสเอ็มเอสเขียว3','เอสเอ็มเอสเขียว 3','เอสเอ็มเอสเขียว4','เอสเอ็มเอสเขียว 4','เอสเอ็มเอสเขียว5','เอสเอ็มเอสเขียว 5'] },
  { id: 9, sku: 'TEXAS_GREEN', name: 'เท็กซัสเขียว', thName: 'เท็กซัสเขียว', price: 350, emoji: '🟩', brand: ['texas'], variant: ['green'], aliases: ['เท็กซัสเขียว','เท็กซัสเขียว1','เท็กซัสเขียว 1','เท็กซัสเขียว2','เท็กซัสเขียว 2','เท็กซัสเขียว3','เท็กซัสเขียว 3','เท็กซัสเขียว4','เท็กซัสเขียว 4','เท็กซัสเขียว5','เท็กซัสเขียว 5'] },
  { id: 10, sku: 'VESS_GREEN', name: 'เวสเขียว', thName: 'เวสเขียว', price: 260, emoji: '🟩', brand:['vess'], variant:['green'], aliases:['เวสเขียว','เวสเขียว1','เวสเขียว 1','เวสเขียว2','เวสเขียว 2','เวสเขียว3','เวสเขียว 3','เวสเขียว4','เวสเขียว 4','เวสเขียว5','เวสเขียว 5'] },
  { id: 11, sku: 'VESS_GREEN_SLIMS', name: 'เวสเขียวสลิม', thName: 'เวสเขียวสลิม', price: 230, emoji: '🟩', brand:['vess'], variant:['green'], aliases:['เวสเขียวเล็ก','เวสเขียวเล็ก1','เวสเขียวเล็ก 1','เวสเขียวเล็ก2','เวสเขียวเล็ก 2','เวสเขียวเล็ก3','เวสเขียวเล็ก 3','เวสเขียวเล็ก4','เวสเขียวเล็ก 4','เวสเขียวเล็ก5','เวสเขียวเล็ก 5'] },
  { id: 12, sku: 'VESS_MINT', name: 'เวสมินต์', thName: 'เวสมินต์', price: 250, emoji: '🟩', brand:['vess'], variant:['mint'], aliases:['เวสมิ้น','เวสมิ้น1','เวสมิ้น 1','เวสมิ้น2','เวสมิ้น 2','เวสมิ้น3','เวสมิ้น 3','เวสมิ้น4','เวสมิ้น 4','เวสมิ้น5','เวสมิ้น 5'] },
  { id: 13, sku: 'VOXX_GREEN', name: 'ว็อกซ์เขียว', thName: 'ว็อกซ์เขียว', price: 300, emoji: '🟩', brand:['voxx'], variant:['green'], aliases:['วอคเขียว','วอคเขียว1','วอคเขียว 1','วอคเขียว2','วอคเขียว 2','วอคเขียว3','วอคเขียว 3','วอคเขียว4','วอคเขียว 4','วอคเขียว5','วอคเขียว 5'] },
  { id: 14, sku: 'TEXAS_BLUE', name: 'เท็กซัสฟ้า', thName: 'เท็กซัสฟ้า', price: 350, emoji: '🟦', brand:['texas'], variant:['blue'], aliases:['เท็กซัสฟ้า','เท็กซัสฟ้า1','เท็กซัสฟ้า 1','เท็กซัสฟ้า2','เท็กซัสฟ้า 2','เท็กซัสฟ้า3','เท็กซัสฟ้า 3','เท็กซัสฟ้า4','เท็กซัสฟ้า 4','เท็กซัสฟ้า5','เท็กซัสฟ้า 5'] },
  { id: 15, sku: 'VESS_GREEN_BLACK', name: 'เวสเขียวดำ', thName: 'เวสเขียวดำ', price: 250, emoji: '⬛', brand:['vess'], variant:['green'], aliases:['เวสเขียวดำ','เวสเขียวดำ1','เวสเขียวดำ 1','เวสเขียวดำ2','เวสเขียวดำ 2','เวสเขียวดำ3','เวสเขียวดำ 3','เวสเขียวดำ4','เวสเขียวดำ 4','เวสเขียวดำ5','เวสเขียวดำ 5'] },
  { id: 16, sku: 'SIERRA_GREEN', name: 'เซียร์ร่าเขียว', thName: 'เซียร์ร่าเขียว', price: 220, emoji: '🟩', brand:['sierra'], variant:['green'], aliases:['เซียร่าเขียว','เซียร่าเขียว1','เซียร่าเขียว2','เซียร่าเขียว3','เซียร่าเขียว4','เซียร่าเขียว5','เซียร่าเขียว 1','เซียร่าเขียว 2','เซียร่าเขียว 3','เซียร่าเขียว 4','เซียร่าเขียว 5','เซียร์ร่าเขียว'] },
  { id: 17, sku: 'OS_BLUEBERRY', name: 'โอเอสบลูเบอร์รี่', thName: 'โอเอสบลูเบอร์รี่', price: 350, emoji: '🟪', brand:['os'], variant:['blueberry'], aliases:['OS บลูเบอร์รี่','OS บลูเบอร์รี่1','OS บลูเบอร์รี่ 1','OS บลูเบอร์รี่2','OS บลูเบอร์รี่ 2','OS บลูเบอร์รี่3','OS บลูเบอร์รี่ 3','OS บลูเบอร์รี่4','OS บลูเบอร์รี่ 4','OS บลูเบอร์รี่5','OS บลูเบอร์รี่ 5','OS บลู 1'] },
  { id: 18, sku: 'OS_MANGO', name: 'โอเอสมะม่วง', thName: 'โอเอสมะม่วง', price: 350, emoji: '🥭', brand:['os'], variant:['mango'], aliases:['OS มะม่วง','OS มะม่วง1','OS มะม่วง 1','OS มะม่วง2','OS มะม่วง 2','OS มะม่วง3','OS มะม่วง 3','OS มะม่วง4','OS มะม่วง 4','OS มะม่วง5','OS มะม่วง 5'] },
  { id: 19, sku: 'VESS_CRUSH_MINT.X.MANGO', name: 'เวสครัชมินต์มะม่วง', thName: 'เวสครัชมินต์มะม่วง', price: 350, emoji: '🥭', brand:['vess'], variant:['crush'], aliases:['เวสมะม่วง','เวสมะม่วง1','เวสมะม่วง 1','เวสมะม่วง2','เวสมะม่วง 2','เวสมะม่วง3','เวสมะม่วง 3','เวสมะม่วง4','เวสมะม่วง 4','เวสมะม่วง5','เวสมะม่วง 5'] },
  { id: 20, sku: 'OS_STRAWBERRY', name: 'โอเอสสตรอว์เบอร์รี่', thName: 'โอเอสสตรอว์เบอร์รี่', price: 350, emoji: '🍓', brand:['os'], variant:['strawberry'], aliases:['OS สตอเบอร์รี่','OS สตอเบอร์รี่1','OS สตอเบอร์รี่ 1','OS สตอเบอร์รี่2','OS สตอเบอร์รี่ 2','OS สตอเบอร์รี่3','OS สตอเบอร์รี่ 3','OS สตอเบอร์รี่4','OS สตอเบอร์รี่ 4','OS สตอเบอร์รี่5','OS สตอเบอร์รี่ 5'] },
  { id: 21, sku: 'MILANO_JAPAN', name: 'มิลาโน่เจแปน', thName: 'มิลาโน่เจแปน', price: 250, emoji: '🍎', brand:['milano'], variant:['japan'], aliases:['มิลาโน่ญี่ปุ่น','มิลาโน่ญี่ปุ่น1','มิลาโน่ญี่ปุ่น 1','มิลาโน่ญี่ปุ่น2','มิลาโน่ญี่ปุ่น 2','มิลาโน่ญี่ปุ่น3','มิลาโน่ญี่ปุ่น 3','มิลาโน่ญี่ปุ่น4','มิลาโน่ญี่ปุ่น 4','มิลาโน่ญี่ปุ่น5','มิลาโน่ญี่ปุ่น 5'] },
  { id: 22, sku: 'OS_PINEAPPLE', name: 'โอเอสสับปะรด', thName: 'โอเอสสับปะรด', price: 350, emoji: '🍍', brand:['os'], variant:['pineapple'], aliases:['OS สับปะรด','OS สับปะรด1','OS สับปะรด 1','OS สับปะรด2','OS สับปะรด 2','OS สับปะรด3','OS สับปะรด 3','OS สับปะรด4','OS สับปะรด 4','OS สับปะรด5','OS สับปะรด 5'] },
  { id: 23, sku: 'VESS_CRUSH_MINT.X.APPLE', name: 'เวสครัชมินต์แอปเปิ้ล', thName: 'เวสครัชมินต์แอปเปิ้ล', price: 350, emoji: '🍎', brand:['vess'], variant:['crush'], aliases:['เวสแอปเปิ้ล','เวสแอปเปิ้ล1','เวสแอปเปิ้ล 1','เวสแอปเปิ้ล2','เวสแอปเปิ้ล 2','เวสแอปเปิ้ล3','เวสแอปเปิ้ล 3','เวสแอปเปิ้ล4','เวสแอปเปิ้ล 4','เวสแอปเปิ้ล5','เวสแอปเปิ้ล 5'] },
  { id: 24, sku: 'OS_WATERMELON', name: 'โอเอสแตงโม', thName: 'โอเอสแตงโม', price: 350, emoji: '🍉', brand:['os'], variant:['watermelon'], aliases:['OS แตงโม','OS แตงโม1','OS แตงโม 1','OS แตงโม2','OS แตงโม 2','OS แตงโม3','OS แตงโม 3','OS แตงโม4','OS แตงโม 4','OS แตงโม5','OS แตงโม 5'] },
  { id: 25, sku: 'VESS_CRUSH_MINT.X.GRAPE', name: 'เวสครัชมินต์องุ่น', thName: 'เวสครัชมินต์องุ่น', price: 350, emoji: '🍇', brand:['vess'], variant:['crush'], aliases:['เวสองุ่นใหญ่','เวสองุ่นใหญ่1','เวสองุ่นใหญ่ 1','เวสองุ่นใหญ่2','เวสองุ่นใหญ่ 2','เวสองุ่นใหญ่3','เวสองุ่นใหญ่ 3','เวสองุ่นใหญ่4','เวสองุ่นใหญ่ 4','เวสองุ่นใหญ่5','เวสองุ่นใหญ่ 5'] },
  { id: 26, sku: 'VESS_GRAPE_SLIMS', name: 'เวสองุ่นสลิม', thName: 'เวสองุ่นสลิม', price: 350, emoji: '🍇', brand:['vess'], variant:['grape'], aliases:['เวสองุ่นสลิม','เวสองุ่นสลิม1','เวสองุ่นสลิม 1','เวสองุ่นสลิม2','เวสองุ่นสลิม 2','เวสองุ่นสลิม3','เวสองุ่นสลิม 3','เวสองุ่นสลิม4','เวสองุ่นสลิม 4','เวสองุ่นสลิม5','เวสองุ่นสลิม 5'] },
  { id: 27, sku: 'MOND_RAINBOW', name: 'ม่อนเรนโบว์', thName: 'ม่อนเรนโบว์', price: 450, emoji: '🌈', brand:['mond'], variant:['rainbow'], aliases:['ม่อนรุ้ง','ม่อนรุ้ง1','ม่อนรุ้ง 1','ม่อนรุ้ง2','ม่อนรุ้ง 2','ม่อนรุ้ง3','ม่อนรุ้ง 3','ม่อนรุ้ง4','ม่อนรุ้ง 4','ม่อนรุ้ง5','ม่อนรุ้ง 5'] },
  { id: 28, sku: 'SEVIOS_RED', name: 'ซีวอสแดง', thName: 'ซีวอสแดง', price: 220, emoji: '🟥', brand:['sevios'], variant:['red'], aliases:['SEVIOS_RED','ซีวอสแดง','ซีวอสแดง1','ซีวอสแดง 1','ซีวอสแดง2','ซีวอสแดง 2','ซีวอสแดง3','ซีวอสแดง 3','ซีวอสแดง4','ซีวอสแดง 4','ซีวอสแดง5','ซีวอสแดง 5'] },
  { id: 29, sku: 'SIERRA_RED', name: 'เซียร์ร่า', thName: 'เซียร์ร่า', price: 220, emoji: '🟥', brand:['sierra'], variant:['red'], aliases:['เซียร่า','เซียร่า1','เซียร่า 1','เซียร่า2','เซียร่า 2','เซียร่า3','เซียร่า 3','เซียร่า4','เซียร่า 4','เซียร่า5','เซียร่า 5'] },
  { id: 30, sku: 'MOND_GOLD', name: 'ม่อนทอง', thName: 'ม่อนทอง', price: 230, emoji: '🟨', brand:['mond'], variant:['gold'], aliases:['ม่อนทอง','ม่อนทอง1','ม่อนทอง 1','ม่อนทอง2','ม่อนทอง 2','ม่อนทอง3','ม่อนทอง 3','ม่อนทอง4','ม่อนทอง 4','ม่อนทอง5','ม่อนทอง 5','MOND Signature Gold'] },
  { id: 31, sku: 'VESS_GOLD', name: 'เวสทอง', thName: 'เวสทอง', price: 230, emoji: '🟨', brand:['vess'], variant:['gold'], aliases:['เวสทอง','เวสทอง1','เวสทอง 1','เวสทอง2','เวสทอง 2','เวสทอง3','เวสทอง 3','เวสทอง4','เวสทอง 4','เวสทอง5','เวสทอง 5'] },
  { id: 32, sku: 'MILANO_GOLD', name: 'มิลาโน่ทอง', thName: 'มิลาโน่ทอง', price: 250, emoji: '🟨', brand:['milano'], variant:['gold'], aliases:['มิลาโน่ทอง','มิลาโน่ทอง1','มิลาโน่ทอง 1','มิลาโน่ทอง2','มิลาโน่ทอง 2','มิลาโน่ทอง3','มิลาโน่ทอง 3','มิลาโน่ทอง4','มิลาโน่ทอง 4','มิลาโน่ทอง5','มิลาโน่ทอง 5'] },
  { id: 33, sku: 'CAVALLO_RED', name: 'คาวาโร่แดง', thName: 'คาวาโร่แดง', price: 250, emoji: '🟥', brand:['cavallo'], variant:['red'], aliases:['คาแดง','คาแดง1','คาแดง 1','คาแดง2','คาแดง 2','คาแดง3','คาแดง 3','คาแดง4','คาแดง 4','คาแดง5','คาแดง 5'] },
  { id: 34, sku: 'MILANO_KINGS', name: 'มิลาโน่คิง', thName: 'มิลาโน่คิง', price: 250, emoji: '🟥', brand:['milano'], variant:['kings'], aliases:['มิลาโน่คิง','มิลาโน่คิง1','มิลาโน่คิง 1','มิลาโน่คิง2','มิลาโน่คิง 2','มิลาโน่คิง3','มิลาโน่คิง 3','มิลาโน่คิง4','มิลาโน่คิง 4','มิลาโน่คิง5','มิลาโน่คิง 5'] },
  { id: 35, sku: 'PLATINUM_BLACK', name: 'แพตตินั่มดำ', thName: 'แพตตินั่มดำ', price: 250, emoji: '⬛', brand:['platinum'], variant:['black'], aliases:['แพตตินั่มดำ','แพตตินั่มดำ1','แพตตินั่มดำ 1','แพตตินั่มดำ2','แพตตินั่มดำ 2','แพตตินั่มดำ3','แพตตินั่มดำ 3','แพตตินั่มดำ4','แพตตินั่มดำ 4','แพตตินั่มดำ5','แพตตินั่มดำ 5'] },
  { id: 36, sku: 'GOLD_MOUNT_RED_WHITE', name: 'โกเม้าแดงขาว', thName: 'โกเม้าแดงขาว', price: 300, emoji: '🟥', brand:['gold mount'], variant:['mount'], aliases:['โกเม้าแดงขาว','โกเม้าแดงขาว1','โกเม้าแดงขาว 1','โกเม้าแดงขาว2','โกเม้าแดงขาว 2','โกเม้าแดงขาว3','โกเม้าแดงขาว 3','โกเม้าแดงขาว4','โกเม้าแดงขาว 4','โกเม้าแดงขาว5','โกเม้าแดงขาว 5'] },
  { id: 37, sku: 'WALTON_RED', name: 'วอลตันแดง', thName: 'วอลตันแดง', price: 300, emoji: '🟥', brand:['walton'], variant:['red'], aliases:['วอลตันแดง','วอลตันแดง1','วอลตันแดง 1','วอลตันแดง2','วอลตันแดง 2','วอลตันแดง3','วอลตันแดง 3','วอลตันแดง4','วอลตันแดง 4','วอลตันแดง5','วอลตันแดง 5'] },
  { id: 38, sku: 'VOXX_BLACK', name: 'วอคดำ', thName: 'วอคดำ', price: 300, emoji: '⬛', brand:['voxx'], variant:['black'], aliases:['วอคดำ','วอคดำ1','วอคดำ 1','วอคดำ2','วอคดำ 2','วอคดำ3','วอคดำ 3','วอคดำ4','วอคดำ 4','วอคดำ5','วอคดำ 5'] },
  { id: 39, sku: 'TEXAS_GOLD', name: 'เท็กซัสทอง', thName: 'เท็กซัสทอง', price: 350, emoji: '🟨', brand:['texas'], variant:['gold'], aliases:['เท็กซัสทอง','เท็กซัสทอง1','เท็กซัสทอง 1','เท็กซัสทอง2','เท็กซัสทอง 2','เท็กซัสทอง3','เท็กซัสทอง 3','เท็กซัสทอง4','เท็กซัสทอง 4','เท็กซัสทอง5','เท็กซัสทอง 5'] },
  { id: 40, sku: 'JOHN_RED', name: 'JHON', thName: 'JHON', price: 350, emoji: '🟥', brand:['john'], variant:['red'], aliases:['จอนแข็ง','จอนแข็ง1','จอนแข็ง 1','จอนแข็ง2','จอนแข็ง 2','จอนแข็ง3','จอนแข็ง 3','จอนแข็ง4','จอนแข็ง 4','จอนแข็ง5','จอนแข็ง 5'] },
  { id: 41, sku: 'TEXAS_RED', name: 'เท็กซัสแดง', thName: 'เท็กซัสแดง', price: 350, emoji: '🟥', brand:['texas'], variant:['red'], aliases:['เท็กซัสแดง','เท็กซัสแดง1','เท็กซัสแดง 1','เท็กซัสแดง2','เท็กซัสแดง 2','เท็กซัสแดง3','เท็กซัสแดง 3','เท็กซัสแดง4','เท็กซัสแดง 4','เท็กซัสแดง5','เท็กซัสแดง 5'] },
  { id: 42, sku: 'MILANO_PURPLE', name: 'มิลาโน่ม่วง', thName: 'มิลาโน่ม่วง', price: 350, emoji: '🟪', brand:['milano'], variant:['purple'], aliases:['มิลาโน่ม่วง','มิลาโน่ม่วง1','มิลาโน่ม่วง 1','มิลาโน่ม่วง2','มิลาโน่ม่วง 2','มิลาโน่ม่วง3','มิลาโน่ม่วง 3','มิลาโน่ม่วง4','มิลาโน่ม่วง 4','มิลาโน่ม่วง5','มิลาโน่ม่วง 5'] },
  { id: 43, sku: 'CAVALLO_TWIN_X_BALL', name: 'คาวาโร่ม่วง', thName: 'คาวาโร่ม่วง', price: 350, emoji: '🟪', brand:['cavallo'], variant:['twin'], aliases:['คาวาโล่ม่วงเม็ดบีบ','คาวาโล่ม่วงเม็ดบีบ1','คาวาโล่ม่วงเม็ดบีบ 1','🟣 CAVALLO ม่วง','คาวาโล่ม่วง 2','คาม่วง','คาม่วง 3','🍇 CAVALLO ม่วง','คาวาโล่ม่วงเม็ดบีบ 4','คาม่วง2','คาม่วง1 ','CAVALLO_ม่วง2'] },
  { id: 44, sku: 'BAROESAN', name: 'บารูซัน', thName: 'บารูซัน', price: 350, emoji: '🍫', brand:['baroesan'], variant:[''], aliases:['บารูอิซัน','บารูอิซัน1','บารูอิซัน 1','บารูอิซัน2','บารูอิซัน 2','บารูอิซัน3','บารูอิซัน 3','บารูอิซัน4','บารูอิซัน 4','บารูอิซัน5','บารูอิซัน 5'] },
  { id: 45, sku: 'CAVALLO_GREEN', name: 'คาวาโล่เขียว', thName: 'คาวาโล่เขียว', price: 250, emoji: '🟩', brand:['cavallo'], variant:['green'], aliases:['CAVALLO_GREEN','CAVALLO GREEN','คาเขียว','คาเขียว1','คาเขียว 1','คาเขียว2','คาเขียว 2','คาเขียว3','คาเขียว 3','คาเขียว4','คาเขียว 4','คาเขียว5'] },
  { id: 46, sku: 'ROYAL_GREEN', name: 'รอยัลเขียว', thName: 'รอยัลเขียว', price: 230, emoji: '🟩', brand:['royal'], variant:['green'], aliases:['รอยัลเขียว','รอยัลเขียว1','รอยัลเขียว 1','รอยัลเขียว2','รอยัลเขียว 2','รอยัลเขียว3','รอยัลเขียว 3','รอยัลเขียว4','รอยัลเขียว 4','รอยัลเขียว5','รอยัลเขียว 5'] },
  { id: 47, sku: '235_GREEN', name: '235 เขียว', thName: '235 เขียว', price: 300, emoji: '🟩', brand:['235'], variant:['green'], aliases:['235 เขียว','235 เขียว1','235 เขียว 1','235 เขียว2','235 เขียว 2','235 เขียว3','235 เขียว 3','235 เขียว4','235 เขียว 4','235 เขียว5','235 เขียว 5'] },
  { id: 48, sku: 'CANYON_GREEN', name: 'แคนยอนเขียว', thName: 'แคนยอนเขียว', price: 350, emoji: '🟩', brand:['canyon'], variant:['green'], aliases:['แคนยอนเขียว','แคนยอนเขียว1','แคนยอนเขียว 1','แคนยอนเขียว2','แคนยอนเขียว 2','แคนยอนเขียว3','แคนยอนเขียว 3','แคนยอนเขียว4','แคนยอนเขียว 4','แคนยอนเขียว5','แคนยอนเขียว 5'] },
  { id: 49, sku: 'GOLD_MOUNT_FULL_GREEN', name: 'โกลด์เมาท์เขียวล้วน', thName: 'โกลด์เมาท์เขียวล้วน', price: 300, emoji: '🟩', brand:['gold mount'], variant:['mount'], aliases:['โกเม้าเขียวล้วน','โกเม้าเขียวล้วน1','โกเม้าเขียวล้วน 1','โกเม้าเขียวล้วน2','โกเม้าเขียวล้วน 2','โกเม้าเขียวล้วน3','โกเม้าเขียวล้วน 3','โกเม้าเขียวล้วน4','โกเม้าเขียวล้วน 4','โกเม้าเขียวล้วน5','โกเม้าเขียวล้วน 5'] },
  { id: 50, sku: 'L&M_GREEN', name: 'แอลแอนด์เอ็มเขียว', thName: 'แอลแอนด์เอ็มเขียว', price: 300, emoji: '🟩', brand:['l&m'], variant:['green'], aliases:['แอลเอ็มเขียว','แอลเอ็มเขียว1','แอลเอ็มเขียว 1','แอลเอ็มเขียว2','แอลเอ็มเขียว 2','แอลเอ็มเขียว3','แอลเอ็มเขียว 3','แอลเอ็มเขียว4','แอลเอ็มเขียว 4','แอลเอ็มเขียว5','แอลเอ็มเขียว 5'] },
  { id: 51, sku: 'MARLBORO_MENTHOL', name: 'มาโบโร่เมนทอล', thName: 'มาโบโร่เมนทอล', price: 300, emoji: '🟩', brand:['marlboro'], variant:['menthol'], aliases:['มาโบโร่เขียว','มาโบโร่เขียว1','มาโบโร่เขียว 1','มาโบโร่เขียว2','มาโบโร่เขียว 2','มาโบโร่เขียว3','มาโบโร่เขียว 3','มาโบโร่เขียว4','มาโบโร่เขียว 4','มาโบโร่เขียว5','มาโบโร่เขียว 5'] },
  { id: 52, sku: 'WALTON_GREEN', name: 'วอลตันเขียว', thName: 'วอลตันเขียว', price: 300, emoji: '🟩', brand:['walton'], variant:['green'], aliases:['วอลตันเขียว','วอลตันเขียว1','วอลตันเขียว 1','วอลตันเขียว2','วอลตันเขียว 2','วอลตันเขียว3','วอลตันเขียว 3','วอลตันเขียว4','วอลตันเขียว 4','วอลตันเขียว5','วอลตันเขียว 5'] },
  { id: 53, sku: 'CAPITAL_BLUE', name: 'แคปิตอลฟ้า', thName: 'แคปิตอลฟ้า', price: 350, emoji: '🟦', brand:['capital'], variant:['blue'], aliases:['แคปปิตอลฟ้า','แคปปิตอลฟ้า1','แคปปิตอลฟ้า 1','แคปปิตอลฟ้า2','แคปปิตอลฟ้า 2','แคปปิตอลฟ้า3','แคปปิตอลฟ้า 3','แคปปิตอลฟ้า4','แคปปิตอลฟ้า 4','แคปปิตอลฟ้า5','แคปปิตอลฟ้า 5'] },
  { id: 54, sku: 'ORIS_STRAWBERRY', name: 'โอริสสตรอว์เบอร์รี่', thName: 'โอริสสตรอว์เบอร์รี่', price: 350, emoji: '🍓', brand:['oris'], variant:['strawberry'], aliases:['โอริสสตรอว์เบอร์รี่','โอริสสตรอว์เบอร์รี่1','โอริสสตรอว์เบอร์รี่ 1','โอริสสตรอว์เบอร์รี่2','โอริสสตรอว์เบอร์รี่ 2','โอริสสตรอว์เบอร์รี่3','โอริสสตรอว์เบอร์รี่ 3','โอริสสตรอว์เบอร์รี่4','โอริสสตรอว์เบอร์รี่ 4','โอริสสตรอว์เบอร์รี่5','โอริสสตรอว์เบอร์รี่ 5'] },
  { id: 55, sku: 'ORIS_STRAWBERRY_2CAPS', name: 'โอริสสตรอว์เบอร์รี่ 2 เม็ดบีบ', thName: 'โอริสสตรอว์เบอร์รี่ 2 เม็ดบีบ', price: 450, emoji: '🍓', brand:['oris'], variant:['strawberry'], aliases:['โอริสสตรอว์เบอร์รี่','โอริสสตรอว์เบอร์รี่1','โอริสสตรอว์เบอร์รี่ 1','โอริสสตรอว์เบอร์รี่2','โอริสสตรอว์เบอร์รี่ 2','โอริสสตรอว์เบอร์รี่3','โอริสสตรอว์เบอร์รี่ 3','โอริสสตรอว์เบอร์รี่4','โอริสสตรอว์เบอร์รี่ 4','โอริสสตรอว์เบอร์รี่5','โอริสสตรอว์เบอร์รี่ 5'] },
  { id: 56, sku: 'PLATINUM_STRAWBERRY', name: 'แพลตตินั่มสตรอว์เบอร์รี่', thName: 'แพลตตินั่มสตรอว์เบอร์รี่', price: 300, emoji: '🍓', brand:['platinum'], variant:['strawberry'], aliases:['แพลตตินั่มสตรอว์เบอร์รี่','แพลตตินั่มสตรอว์เบอร์รี่1','แพลตตินั่มสตรอว์เบอร์รี่ 1','แพลตตินั่มสตรอว์เบอร์รี่2','แพลตตินั่มสตรอว์เบอร์รี่ 2','แพลตตินั่มสตรอว์เบอร์รี่3','แพลตตินั่มสตรอว์เบอร์รี่ 3','แพลตตินั่มสตรอว์เบอร์รี่4','แพลตตินั่มสตรอว์เบอร์รี่ 4','แพลตตินั่มสตรอว์เบอร์รี่5','แพลตตินั่มสตรอว์เบอร์รี่ 5'] },
  { id: 57, sku: 'ORIS_CHERRY', name: 'โอริสเชอร์รี่', thName: 'โอริสเชอร์รี่', price: 350, emoji: '🍒', brand:['oris'], variant:['cherry'], aliases:['โอริสเชอร์รี่','โอริสเชอร์รี่1','โอริสเชอร์รี่ 1','โอริสเชอร์รี่2','โอริสเชอร์รี่ 2','โอริสเชอร์รี่3','โอริสเชอร์รี่ 3','โอริสเชอร์รี่4','โอริสเชอร์รี่ 4','โอริสเชอร์รี่5','โอริสเชอร์รี่ 5'] },
  { id: 58, sku: 'JOHN_APPLE_2CAPS', name: 'จอห์นแอปเปิ้ล 2 เม็ดบีบ', thName: 'จอห์นแอปเปิ้ล 2 เม็ดบีบ', price: 350, emoji: '🍎', brand:['john'], variant:['apple'], aliases:['จอนแอปเปิ้ล 2 เม็ดบีบ','จอนแอปเปิ้ล 2 เม็ดบีบ1','จอนแอปเปิ้ล 2 เม็ดบีบ 1','จอนแอปเปิ้ล 2 เม็ดบีบ2','จอนแอปเปิ้ล 2 เม็ดบีบ 2','จอนแอปเปิ้ล 2 เม็ดบีบ3','จอนแอปเปิ้ล 2 เม็ดบีบ 3','จอนแอปเปิ้ล 2 เม็ดบีบ4','จอนแอปเปิ้ล 2 เม็ดบีบ 4','จอนแอปเปิ้ล 2 เม็ดบีบ5','จอนแอปเปิ้ล 2 เม็ดบีบ 5'] },
  { id: 59, sku: 'MOND_APPLE_FRUIT', name: 'ม่อนแอปเปิ้ล', thName: 'ม่อนแอปเปิ้ล', price: 200, emoji: '🍎', brand:['mond'], variant:['apple'], aliases:['ม่อนแอปเปิ้ล','ม่อนแอปเปิ้ล1','ม่อนแอปเปิ้ล 1','ม่อนแอปเปิ้ล2','ม่อนแอปเปิ้ล 2','ม่อนแอปเปิ้ล3','ม่อนแอปเปิ้ล 3','ม่อนแอปเปิ้ล4','ม่อนแอปเปิ้ล 4','ม่อนแอปเปิ้ล5','ม่อนแอปเปิ้ล 5'] },
  { id: 60, sku: 'ORIS_APPLE', name: 'โอริสแอปเปิ้ล', thName: 'โอริสแอปเปิ้ล', price: 350, emoji: '🍎', brand:['oris'], variant:['apple'], aliases:['โอริสแอปเปิ้ล','โอริสแอปเปิ้ล1','โอริสแอปเปิ้ล 1','โอริสแอปเปิ้ล2','โอริสแอปเปิ้ล 2','โอริสแอปเปิ้ล3','โอริสแอปเปิ้ล 3','โอริสแอปเปิ้ล4','โอริสแอปเปิ้ล 4','โอริสแอปเปิ้ล5','โอริสแอปเปิ้ล 5'] },
  { id: 61, sku: 'PLATINUM_APPLE', name: 'แพลตตินั่มแอปเปิ้ล', thName: 'แพลตตินั่มแอปเปิ้ล', price: 300, emoji: '🍎', brand:['platinum'], variant:['apple'], aliases:['แพลตตินั่มแอปเปิ้ล','แพลตตินั่มแอปเปิ้ล1','แพลตตินั่มแอปเปิ้ล 1','แพลตตินั่มแอปเปิ้ล2','แพลตตินั่มแอปเปิ้ล 2','แพลตตินั่มแอปเปิ้ล3','แพลตตินั่มแอปเปิ้ล 3','แพลตตินั่มแอปเปิ้ล4','แพลตตินั่มแอปเปิ้ล 4','แพลตตินั่มแอปเปิ้ล5','แพลตตินั่มแอปเปิ้ล 5'] },
  { id: 62, sku: 'ORIS_GRAPE', name: 'โอริสองุ่น', thName: 'โอริสองุ่น', price: 350, emoji: '🍇', brand:['oris'], variant:['grape'], aliases:['โอริสองุ่น','โอริสองุ่น1','โอริสองุ่น 1','โอริสองุ่น2','โอริสองุ่น 2','โอริสองุ่น3','โอริสองุ่น 3','โอริสองุ่น4','โอริสองุ่น 4','โอริสองุ่น5','โอริสองุ่น 5'] },
  { id: 63, sku: 'JOHN_SPA', name: 'จอนสปา', thName: 'จอนสปา', price: 220, emoji: '🟥', brand:['john'], variant:['spa'], aliases:['จอนสปา','จอนสปา1','จอนสปา 1','จอนสปา2','จอนสปา 2','จอนสปา3','จอนสปา 3','จอนสปา4','จอนสปา 4','จอนสปา5','จอนสปา 5'] },
  { id: 64, sku: 'ROYAL_RED', name: 'รอยัลแดง', thName: 'รอยัลแดง', price: 230, emoji: '🟥', brand:['royal'], variant:['red'], aliases:['รอยัลแดง','รอยัลแดง1','รอยัลแดง 1','รอยัลแดง2','รอยัลแดง 2','รอยัลแดง3','รอยัลแดง 3','รอยัลแดง4','รอยัลแดง 4','รอยัลแดง5','รอยัลแดง 5'] },
  { id: 65, sku: 'GM_RED', name: 'จีเอ็มแดง', thName: 'จีเอ็มแดง', price: 250, emoji: '🟥', brand:['gm'], variant:['red'], aliases:['จีเอ็ม','จีเอ็ม1','จีเอ็ม 1','จีเอ็ม2','จีเอ็ม 2','จีเอ็ม3','จีเอ็ม 3','จีเอ็ม4','จีเอ็ม 4','จีเอ็ม5','จีเอ็ม 5'] },
  { id: 66, sku: 'KRONG_THIP_RED', name: 'กรองทิพย์', thName: 'กรองทิพย์', price: 250, emoji: '🟥', brand:['krong thip'], variant:['thip'], aliases:['กรองทิพย์','กรองทิพย์1','กรองทิพย์ 1','กรองทิพย์2','กรองทิพย์ 2','กรองทิพย์3','กรองทิพย์ 3','กรองทิพย์4','กรองทิพย์ 4','กรองทิพย์5','กรองทิพย์ 5'] },
  { id: 67, sku: 'SMS_RED', name: 'เอสเอ็มเอสแดง', thName: 'เอสเอ็มเอสแดง', price: 250, emoji: '🟥', brand:['sms'], variant:['red'], aliases:['เอสเอ็มเอสแดง','เอสเอ็มเอสแดง1','เอสเอ็มเอสแดง 1','เอสเอ็มเอสแดง2','เอสเอ็มเอสแดง 2','เอสเอ็มเอสแดง3','เอสเอ็มเอสแดง 3','เอสเอ็มเอสแดง4','เอสเอ็มเอสแดง 4','เอสเอ็มเอสแดง5','เอสเอ็มเอสแดง 5'] },
  { id: 68, sku: 'VESS_RED', name: 'เวสแดง', thName: 'เวสแดง', price: 260, emoji: '🟥', brand:['vess'], variant:['red'], aliases:['เวสแดง','เวสแดง1','เวสแดง 1','เวสแดง2','เวสแดง 2','เวสแดง3','เวสแดง 3','เวสแดง4','เวสแดง 4','เวสแดง5','เวสแดง 5'] },
  { id: 69, sku: 'VESS_RED_LIGHT', name: 'เวสแดงอ่อน', thName: 'เวสแดงอ่อน', price: 260, emoji: '🟥', brand:['vess'], variant:['red'], aliases:['เวสแดงอ่อน','เวสแดงอ่อน1','เวสแดงอ่อน 1','เวสแดงอ่อน2','เวสแดงอ่อน 2','เวสแดงอ่อน3','เวสแดงอ่อน 3','เวสแดงอ่อน4','เวสแดงอ่อน 4','เวสแดงอ่อน5','เวสแดงอ่อน 5'] },
  { id: 70, sku: 'MARLBORO_GOLD', name: 'มาโบโร่ทอง', thName: 'มาโบโร่ทอง', price: 300, emoji: '🟨', brand:['marlboro'], variant:['gold'], aliases:['มาโบโร่ขาว','มาโบโร่ขาว1','มาโบโร่ขาว 1','มาโบโร่ขาว2','มาโบโร่ขาว 2','มาโบโร่ขาว3','มาโบโร่ขาว 3','มาโบโร่ขาว4','มาโบโร่ขาว 4','มาโบโร่ขาว5','มาโบโร่ขาว 5'] },
  { id: 71, sku: '235_RED', name: '235 แดง', thName: '235 แดง', price: 300, emoji: '🟥', brand:['235'], variant:['red'], aliases:['235 แดง','235 แดง1','235 แดง 1','235 แดง2','235 แดง 2','235 แดง3','235 แดง 3','235 แดง4','235 แดง 4','235 แดง5','235 แดง 5'] },
  { id: 72, sku: 'GOLD_MOUNT_FULL_RED', name: 'โกลด์เมาท์แดงล้วน', thName: 'โกลด์เมาท์แดงล้วน', price: 300, emoji: '🟥', brand:['gold mount'], variant:['mount'], aliases:['โกเม้าแดงล้วน','โกเม้าแดงล้วน1','โกเม้าแดงล้วน 1','โกเม้าแดงล้วน2','โกเม้าแดงล้วน 2','โกเม้าแดงล้วน3','โกเม้าแดงล้วน 3','โกเม้าแดงล้วน4','โกเม้าแดงล้วน 4','โกเม้าแดงล้วน5','โกเม้าแดงล้วน 5'] },
  { id: 73, sku: 'JOHN_WHITE', name: 'จอนขาว', thName: 'จอนขาว', price: 300, emoji: '🟥', brand:['john'], variant:['white'], aliases:['จอนอ่อน','จอนอ่อน1','จอนอ่อน 1','จอนอ่อน2','จอนอ่อน 2','จอนอ่อน3','จอนอ่อน 3','จอนอ่อน4','จอนอ่อน 4','จอนอ่อน5','จอนอ่อน 5'] },
  { id: 74, sku: 'L&M_RED', name: 'เวสแดงพรีเมี่ยม', thName: 'เวสแดงพรีเมี่ยม', price: 300, emoji: '🟥', brand:['l&m'], variant:['red'], aliases:['แอลเอ็มแดง','แอลเอ็มแดง1','แอลเอ็มแดง 1','แอลเอ็มแดง2','แอลเอ็มแดง 2','แอลเอ็มแดง3','แอลเอ็มแดง 3','แอลเอ็มแดง4','แอลเอ็มแดง 4','แอลเอ็มแดง5','แอลเอ็มแดง 5'] },
  { id: 75, sku: 'MARLBORO_RED', name: 'มาโบโร่แดง', thName: 'มาโบโร่แดง', price: 300, emoji: '🟥', brand:['marlboro'], variant:['red'], aliases:['มาโบโร่แดง','มาโบโร่แดง1','มาโบโร่แดง 1','มาโบโร่แดง2','มาโบโร่แดง 2','มาโบโร่แดง3','มาโบโร่แดง 3','มาโบโร่แดง4','มาโบโร่แดง 4','มาโบโร่แดง5','มาโบโร่แดง 5'] },
  { id: 76, sku: 'VESS_RED_PREMIUM', name: 'เวสแดงพรีเมี่ยม', thName: 'เวสแดงพรีเมี่ยม', price: 300, emoji: '🟥', brand:['vess'], variant:['red'], aliases:['เวสแดงพรีเมี่ยม','เวสแดงพรีเมี่ยม1','เวสแดงพรีเมี่ยม 1','เวสแดงพรีเมี่ยม2','เวสแดงพรีเมี่ยม 2','เวสแดงพรีเมี่ยม3','เวสแดงพรีเมี่ยม 3','เวสแดงพรีเมี่ยม4','เวสแดงพรีเมี่ยม 4','เวสแดงพรีเมี่ยม5','เวสแดงพรีเมี่ยม 5'] },
  { id: 77, sku: 'CANYON_RED', name: 'แคนยอนแดง', thName: 'แคนยอนแดง', price: 350, emoji: '🟥', brand:['canyon'], variant:['red'], aliases:['แคนยอนแดง','แคนยอนแดง1','แคนยอนแดง 1','แคนยอนแดง2','แคนยอนแดง 2','แคนยอนแดง3','แคนยอนแดง 3','แคนยอนแดง4','แคนยอนแดง 4','แคนยอนแดง5','แคนยอนแดง 5'] },
  { id: 78, sku: 'PLATINUM_BLUE_COOL', name: 'แพลตตินั่มบลูคูล', thName: 'แพลตตินั่มบลูคูล', price: 350, emoji: '🟦', brand:['platinum'], variant:['blue'], aliases:['แพลตตินั่มฟ้าคูล','แพลตตินั่มฟ้าคูล1','แพลตตินั่มฟ้าคูล 1','แพลตตินั่มฟ้าคูล2','แพลตตินั่มฟ้าคูล 2','แพลตตินั่มฟ้าคูล3','แพลตตินั่มฟ้าคูล 3','แพลตตินั่มฟ้าคูล4','แพลตตินั่มฟ้าคูล 4','แพลตตินั่มฟ้าคูล5','แพลตตินั่มฟ้าคูล 5'] },
  { id: 79, sku: 'PLATINUM_BLUE_MINT_2CAPS', name: 'แพลตตินั่มบลูมินต์ 2 เม็ดบีบ', thName: 'แพลตตินั่มบลูมินต์ 2 เม็ดบีบ', price: 350, emoji: '🟦', brand:['platinum'], variant:['blue'], aliases:['แพลตตินั่มบลูมิ้นท์ 2 เม็ดบีบ','แพลตตินั่มบลูมิ้นท์ 2 เม็ดบีบ1','แพลตตินั่มบลูมิ้นท์ 2 เม็ดบีบ 1','แพลตตินั่มบลูมิ้นท์ 2 เม็ดบีบ2','แพลตตินั่มบลูมิ้นท์ 2 เม็ดบีบ 2','แพลตตินั่มบลูมิ้นท์ 2 เม็ดบีบ3','แพลตตินั่มบลูมิ้นท์ 2 เม็ดบีบ 3','แพลตตินั่มบลูมิ้นท์ 2 เม็ดบีบ4','แพลตตินั่มบลูมิ้นท์ 2 เม็ดบีบ 4','แพลตตินั่มบลูมิ้นท์ 2 เม็ดบีบ5','แพลตตินั่มบลูมิ้นท์ 2 เม็ดบีบ 5'] },
  { id: 80, sku: 'MILANO_FIZZ', name: 'มิลาโน่ฟิซ', thName: 'มิลาโน่ฟิซ', price: 350, emoji: '🍫', brand:['milano'], variant:['fizz'], aliases:['มิลาโน่ฟิซ','มิลาโน่ฟิซ1','มิลาโน่ฟิซ 1','มิลาโน่ฟิซ2','มิลาโน่ฟิซ 2','มิลาโน่ฟิซ3','มิลาโน่ฟิซ 3','มิลาโน่ฟิซ4','มิลาโน่ฟิซ 4','มิลาโน่ฟิซ5','มิลาโน่ฟิซ 5'] },
  { id: 81, sku: 'SUK_DEFAULT', name: 'สุขดั้งเดิม', thName: 'สุขดั้งเดิม', price: 350, emoji: '🍫', brand:['suk'], variant:['default'], aliases:['ซุค','ซุค1','ซุค 1','ซุค2','ซุค 2','ซุค3','ซุค 3','ซุค4','ซุค 4','ซุค5','ซุค 5'] },
  { id: 82, sku: 'ORIS_BLUE_1CAPS', name: 'โอริสฟ้า 1 เม็ดบีบ', thName: 'โอริสฟ้า 1 เม็ดบีบ', price: 400, emoji: '🟦', brand:['oris'], variant:['blue'], aliases:['โอริสฟ้า','โอริสฟ้า1','โอริสฟ้า 1','โอริสฟ้า2','โอริสฟ้า 2','โอริสฟ้า3','โอริสฟ้า 3','โอริสฟ้า4','โอริสฟ้า 4','โอริสฟ้า5','โอริสฟ้า 5'] },
  { id: 83, sku: 'ORIS_BLUE_2CAPS', name: 'โอริสฟ้า 2 เม็ดบีบ', thName: 'โอริสฟ้า 2 เม็ดบีบ', price: 450, emoji: '🟦', brand:['oris'], variant:['blue'], aliases:['โอริสบลู','โอริสบลู1','โอริสบลู 1','โอริสบลู2','โอริสบลู 2','โอริสบลู3','โอริสบลู 3','โอริสบลู4','โอริสบลู 4','โอริสบลู5','โอริสบลู 5'] },
  { id: 84, sku: 'BLUE_ICE_ICE_1CAPS', name: 'บลูไอซ์ ไอซ์ 1 เม็ดบีบ', thName: 'บลูไอซ์ ไอซ์ 1 เม็ดบีบ', price: 450, emoji: '🍫', brand:['blue ice'], variant:['ice'], aliases:['บลูไอซ์','บลูไอซ์1','บลูไอซ์ 1','บลูไอซ์2','บลูไอซ์ 2','บลูไอซ์3','บลูไอซ์ 3','บลูไอซ์4','บลูไอซ์ 4','บลูไอซ์5','บลูไอซ์ 5'] },
  { id: 85, sku: 'BLUE_ICE_ICE_2CAPS', name: 'บลูไอซ์ ไอซ์ 2 เม็ดบีบ', thName: 'บลูไอซ์ ไอซ์ 2 เม็ดบีบ', price: 450, emoji: '🍫', brand:['blue ice'], variant:['ice'], aliases:['บลูไอซ์','บลูไอซ์1','บลูไอซ์ 1','บลูไอซ์2','บลูไอซ์ 2','บลูไอซ์3','บลูไอซ์ 3','บลูไอซ์4','บลูไอซ์ 4','บลูไอซ์5','บลูไอซ์ 5'] },
  { id: 86, sku: 'D&J_DEFAULT', name: 'ดีแอนด์เจดั้งเดิม', thName: 'ดีแอนด์เจดั้งเดิม', price: 450, emoji: '🍫', brand:['d&j'], variant:['default'], aliases:['ดีแอนด์เจ','ดีแอนด์เจ1','ดีแอนด์เจ 1','ดีแอนด์เจ2','ดีแอนด์เจ 2','ดีแอนด์เจ3','ดีแอนด์เจ 3','ดีแอนด์เจ4','ดีแอนด์เจ 4','ดีแอนด์เจ5','ดีแอนด์เจ 5'] },
  { id: 87, sku: 'MOND_BLACK', name: 'ม่อนดำ', thName: 'ม่อนดำ', price: 450, emoji: '⬛', brand:['mond'], variant:['black'], aliases:['ม่อนดำ','ม่อนดำ1','ม่อนดำ 1','ม่อนดำ2','ม่อนดำ 2','ม่อนดำ3','ม่อนดำ 3','ม่อนดำ4','ม่อนดำ 4','ม่อนดำ5','ม่อนดำ 5'] },
  { id: 88, sku: 'CAVALLO_WATERMELON', name: 'คาวาโร่แตงโม', thName: 'คาวาโร่แตงโม', price: 350, emoji: '🍉', brand:['cavallo_watermelon'], variant:['watermelon'], aliases:['คาแตงโม','คา แตงโม1','CAVALLO_แตงโม','คาโรแตงโม','CAVALLO_WATERMELON','CAVALLO_WATERMELON '] },
  { id: 89, sku: 'CAVALLO_MANGO', name: 'คาวาโร่มะม่วง', thName: 'คาวาโร่มะม่วง', price: 350, emoji: '🥭', brand:['cavallo'], variant:['mango'], aliases:['CAVALLO_MANGO','คาวาโร่มะม่วง','คามะม่วง','คาม่วง','มะม่วง'] },
  { id: 90, sku: 'SEVIOS_WATERMELON', name: 'ซีวอสแตงโม', thName: 'ซีวอสแตงโม', price: 350, emoji: '🍉', brand:['sevios'], variant:['watermelon'], aliases:['SEVIOS_WATERMELON','ซีวอสแตงโม','ซีวอส แตงโม'] },
];

function value(r, k) { 
  const v = r?.[k]; 
  return v === undefined || v === null ? '' : String(v).trim(); 
}

function firstExisting(r, keys) { 
  for (const k of keys) { 
    const v = value(r, k); 
    if (v !== '') return v; 
  } 
  return ''; 
}

function parseNumber(raw) { 
  if (raw === undefined || raw === null || String(raw).trim() === '') return null; 
  const c = String(raw).replaceAll(',', '').replace(/[^0-9.-]/g, ''); 
  const n = Number(c); 
  return Number.isFinite(n) ? n : null; 
}

function formatBaht(n) { 
  const num = parseNumber(n); 
  if (num === null) return ''; 
  return new Intl.NumberFormat('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(num); 
}

function escapeHtml(v) { 
  return String(v ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;'); 
}

function formatOrderTime(row) {
  const raw = firstExisting(row, ['orderTimeDisplay', 'order_time_display', 'order_time', 'order_date']);
  if (raw && raw.includes('/')) return raw;
  const iso = firstExisting(row, ['created_at', 'updated_at', 'orderTimeIso']);
  if (!iso) return raw;
  try {
    const d = new Date(iso);
    const th = new Date(d.getTime() + (7 * 60 * 60 * 1000));
    const dd = String(th.getUTCDate()).padStart(2, '0');
    const mm = String(th.getUTCMonth() + 1).padStart(2, '0');
    const yyyy = th.getUTCFullYear() + 543;
    const hh = String(th.getUTCHours()).padStart(2, '0');
    const mi = String(th.getUTCMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${mi} น.`;
  } catch (e) { 
    return raw || iso; 
  }
}

function normalizeProductText(text) {
  return String(text ?? '').replace(/\r\n/g, '\n').replace(/[�□]/g, ' ').replace(/[ \t]+/g, ' ').trim();
}

function addProduct(map, sku, qty) {
  const cleanSku = String(sku ?? '').toUpperCase().trim().replace(/[ .-]+/g, '_').replace(/[^A-Z0-9_]/g, '').replace(/_+/g, '_').replace(/^_|_$/g, '');
  const quantity = parseNumber(qty) || 1;
  if (!cleanSku || !PRODUCT_MASTER[cleanSku] || quantity <= 0) return;
  const key = `${cleanSku}|${quantity}`;
  if (!map.has(key)) map.set(key, { sku: cleanSku, qty: String(quantity) });
}

function isNonProductLine(line) {
  const s = normalizeProductText(line);
  if (!s) return true;
  if (/\b0\d{9}\b|โทรศัพท์|โทร\s*[:：]?|เบอร์|รหัสไปรษณีย์|ป\.?\s*\d{5}|\b\d{5}\b/iu.test(s)) return true;
  if (/บ้านเลขที่|หมู่ที่|หมู่\s*\d+|ซอย|ถนน|ตำบล|ต\.|อำเภอ|อ\.|จังหวัด|จ\.|ที่อยู่|จัดส่ง|ไปรษณีย์/iu.test(s)) return true;
  if (/^(?:cod|ยอดรวม|รวม|ชื่อ|ผู้รับ|ที่อยู่|เบอร์|โทร|เวลา|วันที่)\b/iu.test(s)) return true;
  return false;
}

function extractBotProducts(text, map) {
  const value = normalizeProductText(text);
  const section = value.match(/รายการสินค้า\s*[:：]?([\s\S]*)/iu);
  if (!section) return;
  const body = section[1]
    .split(/🚚\s*ขนส่ง|ขนส่ง\s*[:：]|จัดส่งโดย|ค่าตัว|รวมส่ง/iu)[0]
    .split('\n')
    .filter(line => !isNonProductLine(line))
    .join('\n');
  const re = /(?:^|[^A-Z0-9_])([A-Z][A-Z0-9_]*(?:\s+[A-Z][A-Z0-9_]*)?)\s*(?:\([^|\n]*\))?\s*(?:\||[-–—]|x|×)?\s*(?:จำนวน\s*)?([0-9]+(?:\.[0-9]+)?)\s*(?:คอต|หีบ|กล่อง|ชิ้น|ซอง|แพ็ค|แพ็ก)?/giu;
  let m;
  while ((m = re.exec(body))) addProduct(map, m[1], m[2]);
}

function extractAdminProducts(text, map) {
  const value = normalizeProductText(text);
  const section = value.match(/รายการสินค้า\s*[:：]?/iu);
  const body = (section ? value.slice(0, section.index) : value)
    .split('\n')
    .filter(line => !isNonProductLine(line))
    .join('\n')
    .split(/(?:Cod\s*[:：]?|COD\s*[:：]?|ยอดรวม|ที่อยู่|เบอร์|โทร|รหัสไปรษณีย์)/iu)[0];
  const reSku = /(?:^|[^A-Z0-9_])([A-Z][A-Z0-9_]*(?:\s+[A-Z][A-Z0-9_]*)?)\s*(?:\([^|\n]*\))?\s*\|\s*(?:จำนวน\s*)?([0-9]+(?:\.[0-9]+)?)/giu;
  let m;
  while ((m = reSku.exec(body))) addProduct(map, m[1], m[2]);

  // เทมเพลตสรุปออเดอร์: � CAVALLO_WATERMELON - จำนวน 3 คอต | 1,050 บาท
  const reSummary = /(?:^|[^A-Z0-9_])([A-Z][A-Z0-9_]*(?:\s+[A-Z][A-Z0-9_]*)?)\s*[-–—]\s*(?:จำนวน\s*)?([0-9]+(?:\.[0-9]+)?)/giu;
  while ((m = reSummary.exec(body))) addProduct(map, m[1], m[2]);

  const aliases = [
    ['คาโรแตงโม|คาโร่แตงโม|คาวาโร่แตงโม|แตงโม', 'CAVALLO_WATERMELON'],
    ['ม่อนเขียว|มอนเขียว|ม่อนกรีน|มอนกรีน', 'MOND_GREEN'],
    ['ม่อนทอง|มอนทอง', 'MOND_GOLD'],
    ['เวสแดง', 'VESS_RED'],
    ['เวสเขียว', 'VESS_GREEN'],
    ['ซีวอสแดง|ชีวอสแดง', 'SEVIOS_RED'],
    ['ซีวอสเขียว|ชีวอสเขียว', 'SEVIOS_GREEN'],
  ];
  for (const [pattern, sku] of aliases) {
    const re = new RegExp(`(?:^|[^ก-๙])(?:${pattern})\\s*([0-9]+(?:\\.[0-9]+)?)`, 'iu');
    const hit = body.match(re);
    if (hit) addProduct(map, sku, hit[1]);
  }
}

function extractProductFromAnyText(texts) {
  const map = new Map();
  extractBotProducts(texts, map);
  extractAdminProducts(texts, map);
  return [...map.values()].map(f => {
    const master = PRODUCT_MASTER[f.sku];
    return `${master.emo} ${f.sku}(${master.th}) ${f.qty} คอต`;
  });
}

function getProductWithDeepBackups(row) {
  const candidates = [];
  const evidence = [];
  const addText = (text, label) => {
    if (!text) return;
    const found = extractProductFromAnyText(text);
    for (const line of found) {
      if (!candidates.includes(line)) candidates.push(line);
      evidence.push({ source: label, text: String(text).slice(0, 1000), product: line });
    }
  };

  // Priority 1: chat timeline is closest to the original customer/page evidence.
  const timelines = [];
  if (Array.isArray(row.chat_timeline)) timelines.push(...row.chat_timeline);
  if (Array.isArray(row.normalized_chat_timeline)) timelines.push(...row.normalized_chat_timeline);
  for (const message of timelines) addText(message, 'chat_timeline');

  // Priority 2: raw order/parser fields, never replacing the raw evidence.
  for (const [key, label] of [
    ['sniper_x_text_clean', 'sniper_x_text_clean'],
    ['clean_text', 'clean_text'],
    ['single_cleaned_block', 'single_cleaned_block'],
    ['full_chunk_text', 'full_chunk_text'],
    ['raw_text_with_phone', 'raw_text_with_phone'],
  ]) addText(value(row, key), label);

  // Priority 3: already-mapped fields only when raw evidence found nothing.
  if (!candidates.length) {
    const mappedSku = value(row, 'extracted_sku') || value(row, 'sku');
    const mappedQty = value(row, 'extracted_qty') || value(row, 'extracted_quantity') || value(row, 'qty') || value(row, 'quantity');
    const normalizedMappedSku = String(mappedSku || '').toUpperCase();
    const master = PRODUCT_MASTER[normalizedMappedSku];
    if (master && mappedQty && Number(mappedQty) > 0) {
      const line = `${master.emoji} ${normalizedMappedSku}(${master.thName}) ${mappedQty} คอต`;
      candidates.push(line);
      evidence.push({ source: 'mapped_fallback', text: normalizedMappedSku, product: line });
    }
    for (const line of [value(row, 'product_copy_text'), value(row, 'product_display_for_packer'), value(row, 'display_for_packer')].filter(Boolean)) {
      if (!/CHECK_SKU|ระบุสินค้าไม่ได้/i.test(line) && !candidates.includes(line)) {
        candidates.push(line);
        evidence.push({ source: 'mapped_display_fallback', text: line, product: line });
      }
    }
  }

  return {
    best: candidates[0] || '',
    backup1: candidates[1] || '',
    backup2: candidates[2] || '',
    candidates,
    evidence,
    source: evidence[0]?.source || 'none',
  };
}
function cleanLocationPart(raw, kind) {
  let value = String(raw || '').trim();
  if (!value) return '';
  // Remove labels accidentally included in the source field; the builder adds one canonical label.
  value = value.replace(/^(?:ต|ต\.|ตำบล|อ|อ\.|อำเภอ|จ|จ\.|จังหวัด)\s*/iu, '');
  if (kind === 'district') value = value.replace(/\s+อ\s*$/iu, '');
  if (kind === 'amphoe') value = value.replace(/\s+จ\s*$/iu, '');
  if (kind === 'province') value = value.replace(/\s+[ตอจ]\s*$/iu, '');
  return value.trim();
}

function normalizeAddressLabels(address) {
  return String(address || '')
    .replace(/ต\s*\.\s*ต\s*\./giu, 'ต.')
    .replace(/อ\s*\.\s*อ\s*\./giu, 'อ.')
    .replace(/จ\s*\.\s*จ\s*\./giu, 'จ.')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function addressCompleteness(address) {
  const s = String(address || '').trim();
  if (!s) return { score: -1, hasHouse: false, hasDistrict: false, hasAmphoe: false, hasProvince: false, hasZipcode: false };
  const hasHouse = /^\s*\d+[\/\-]?\d*/u.test(s) || /บ้านเลขที่\s*\d+/iu.test(s);
  const hasDistrict = /(?:ตำบล|ต\.)\s*[^\s]+/iu.test(s);
  const hasAmphoe = /(?:อำเภอ|อ\.)\s*[^\s]+/iu.test(s);
  const hasProvince = /(?:จังหวัด|จ\.)\s*[^\s]+/iu.test(s);
  const hasZipcode = /\b\d{5}\b/u.test(s);
  const score = (hasHouse ? 5 : 0) + (hasDistrict ? 2 : 0) + (hasAmphoe ? 2 : 0) + (hasProvince ? 2 : 0) + (hasZipcode ? 3 : 0);
  return { score, hasHouse, hasDistrict, hasAmphoe, hasProvince, hasZipcode };
}

function getAddressWithDeepBackups(row) {
  const p = row.source_payload || {};
  const sourceAddress = firstExisting(row, ['address_display_packer', 'addressclean', 'full_address'])
    || firstExisting(p, ['address_display_packer', 'addressclean', 'full_address']);
  const zipcode = firstExisting(row, ['zipcode', 'postal_code', 'postcode'])
    || firstExisting(p, ['zipcode', 'postal_code', 'postcode']);
  const rawFullAddress = sourceAddress;
  const directFullAddress = rawFullAddress && !/\d{5}/.test(rawFullAddress) && /^\d{5}$/.test(zipcode)
    ? `${rawFullAddress} ${zipcode}`
    : rawFullAddress;

  const structuredParts = [
    value(row, 'address_line_1') || value(p, 'address_line_1'),
    value(row, 'address_line_2') || value(p, 'address_line_2'),
    value(row, 'short_address') || value(p, 'short_address'),
    cleanLocationPart(value(row, 'district') || value(p, 'district'), 'district') ? `ต.${cleanLocationPart(value(row, 'district') || value(p, 'district'), 'district')}` : '',
    cleanLocationPart(value(row, 'amphoe') || value(p, 'amphoe'), 'amphoe') ? `อ.${cleanLocationPart(value(row, 'amphoe') || value(p, 'amphoe'), 'amphoe')}` : '',
    cleanLocationPart(value(row, 'province') || value(p, 'province'), 'province') && (value(row, 'province') || value(p, 'province')) !== 'DATA_MISSING' ? `จ.${cleanLocationPart(value(row, 'province') || value(p, 'province'), 'province')}` : '',
    zipcode,
  ].filter(Boolean).join(' ');

  const rawAddresses = [
    directFullAddress,
    sourceAddress,
    value(row, 'address_display_packer'),
    value(row, 'addressclean'),
    value(p, 'address_display_packer'),
    value(p, 'addressclean'),
    structuredParts,
    value(row, 'full_address'),
    value(p, 'full_address'),
    value(row, 'single_cleaned_block'),
  ];

  const candidates = [...new Set(rawAddresses.map(s => String(s || '').trim()).filter(Boolean))]
    .map(address => {
      let clean = normalizeAddressLabels(address.split('📦')[0].split('=-')[0].split('┌')[0].trim());
      if (/สถานะ|ปิดยอด|สำเร็จ|สรุปรายการ|เวลาสั่งซื้อ|ชื่อผู้รับ|เบอร์โทร|ยอดรวม|COD|รายการสินค้า/iu.test(clean)) clean = '';
      const completeness = addressCompleteness(clean);
      return { address: clean, ...completeness };
    })
    .filter(candidate => candidate.address.length > 5 && (candidate.hasDistrict || candidate.hasAmphoe || candidate.hasProvince || candidate.hasZipcode));

  // Highest completeness wins; preserve original order as tie-breaker.
  const ranked = candidates
    .map((candidate, index) => ({ ...candidate, index }))
    .sort((a, b) => b.score - a.score || a.index - b.index);
  const unique = ranked.map(candidate => candidate.address);
  const selected = ranked[0];
  return {
    full: selected?.address || '',
    backup1: unique[1] || '',
    backup2: unique[2] || '',
    all: unique,
    source: selected ? `completeness_score_${selected.score}` : 'none',
    completeness: selected ? {
      score: selected.score,
      hasHouse: selected.hasHouse,
      hasDistrict: selected.hasDistrict,
      hasAmphoe: selected.hasAmphoe,
      hasProvince: selected.hasProvince,
      hasZipcode: selected.hasZipcode,
    } : null,
  };
}

function timelinesForAudit(row) {
  const out = [];
  for (const key of ['chat_timeline', 'normalized_chat_timeline']) {
    if (Array.isArray(row[key])) out.push(...row[key].map(text => ({ source: key, text: String(text) })));
  }
  return out;
}

const groupedRows = new Map();
for (const item of inputItems) {
  const candidate = item.json ?? {};
  const key = value(candidate, 'upsert_key') || value(candidate, 'order_key') || value(candidate, 'order_number');
  if (!key) continue;
  if (!groupedRows.has(key)) groupedRows.set(key, { ...candidate });
  else {
    const current = groupedRows.get(key);
    if ((!current.full_address || current.full_address === 'DATA_MISSING') && candidate.full_address) current.full_address = candidate.full_address;
    if (!current.customer_name && candidate.customer_name) current.customer_name = candidate.customer_name;
    if (!current.phone && candidate.phone) current.phone = candidate.phone;
    if (!current.cod_amount && candidate.cod_amount) current.cod_amount = candidate.cod_amount;
    const timelines = [...(Array.isArray(current.chat_timeline) ? current.chat_timeline : []), ...(Array.isArray(candidate.chat_timeline) ? candidate.chat_timeline : [])];
    current.chat_timeline = [...new Set(timelines)];
  }
}

const output = [...groupedRows.values()].map(row => {
  const productInfo = getProductWithDeepBackups(row);
  const address = getAddressWithDeepBackups(row);

  // ยอดเงินจริงต้องเชื่อจากโหนดแรก: expected_cod ห้ามคำนวณจากราคาสินค้า
  const codRaw = firstExisting(row, ['expected_cod', 'raw_cod_amount', 'cod', 'total_cod', 'cod_amount']);
  let codNumber = parseNumber(codRaw);
  if (codNumber === null || codNumber === 0) {
    const fallback = parseNumber(firstExisting(row, ['expected_cod']));
    if (fallback) codNumber = fallback;
  }
  const codForDisplay = codNumber && codNumber > 0 ? formatBaht(codNumber) : '';

  const statusRaw = firstExisting(row, ['order_status', 'raw_order_status', 'status', 'bill_status']) || 'READY';
  const status = statusRaw === 'CHECK_DATA' ? 'READY' : statusRaw;
  const pageName = firstExisting(row, ['page_name', 'page_Name']);
  const facebookName = firstExisting(row, ['facebook_name']);
  const customer = value(row, 'customer_name');
  const phone = firstExisting(row, ['phone_norm', 'phone_clean', 'phone', 'extracted_phone']);
  const orderNumber = value(row, 'order_number');
  const orderTimePretty = formatOrderTime(row);
  const finalAddress = address.full;
  
  const routingTagBackup = value(row, 'routing_tag_backup');
  const isSafetyWhite = row.is_safety_white ?? false;

  const telegramMessage = [
    `🚀 <b>[บิลสมบูรณ์ - ${escapeHtml(status)}]</b>`,
    '━━━━━━━━━━━━━━━━━━━━',
    orderTimePretty ? `⏰ <b>เวลาสั่งซื้อ:</b> ${escapeHtml(orderTimePretty)}` : '',
    orderNumber ? `🆔 <b>เลขออเดอร์:</b> <code>${escapeHtml(orderNumber)}</code>` : '',
    pageName ? `📢 <b>ชื่อเพจ:</b> ${escapeHtml(pageName)}` : '',
    facebookName ? `👤 <b>Facebook:</b> ${escapeHtml(facebookName)}` : '',
    codForDisplay ? `💰 <b>ยอด COD:</b> <code>${escapeHtml(codForDisplay)}</code> บาท` : '',
    '━━━━━━━━━━━━━━━━━━━━',
    customer ? `<code>${escapeHtml(customer)}</code>` : '',
    phone ? `<code>${escapeHtml(phone)}</code>` : '',
    finalAddress ? `<code>${escapeHtml(finalAddress)}</code>` : '',
    '',
    '📦 <b>รายการสินค้า:</b>',
    productInfo.best ? `<code>${escapeHtml(productInfo.best)}</code>` : '',
    '━━━━━━━━━━━━━━━━━━━━',
  ].filter(Boolean).join('\n');

  const copyText = [
    orderNumber, orderTimePretty, codForDisplay ? `${codForDisplay} บาท` : '',
    customer, phone, finalAddress, productInfo.best
  ].filter(Boolean).join('\n');

  const telegramBody = {
    chat_id: value(row, 'telegram_chat_id') || 'REPLACE_WITH_TELEGRAM_CHAT_ID',
    text: telegramMessage,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  };
  
  if (copyText.length >= 1 && copyText.length <= 256) {
    telegramBody.reply_markup = { inline_keyboard: [[{ text: '📋 คัดลอกข้อมูลแพ็ก', copy_text: { text: copyText } }]] };
  }

  return {
    json: {
      ...row,
      routing_tag_backup: routingTagBackup,
      is_safety_white: isSafetyWhite,
      display_for_packer: productInfo.best,
      final_display_for_packer: productInfo.best,
      telegram_final_mapped: productInfo.best,
      product_display_candidates: productInfo.candidates,
      master_display_for_packer: value(row, 'master_display_for_packer') || null,
      product_source: productInfo.source,
      product_evidence: productInfo.evidence,
      raw_product_evidence: timelinesForAudit(row),
      product_backup_1: productInfo.backup1,
      product_backup_2: productInfo.backup2,
      full_address: finalAddress,
      full_address_backup_1: address.backup1,
      full_address_backup_2: address.backup2,
      address_candidates: address.all,
      address_source: address.source,
      address_completeness: address.completeness,
      final_address_for_bill: finalAddress,
      cod_amount: codNumber,
      expected_cod: codNumber,
      telegram_message: telegramMessage,
      telegram_copy_text: copyText,
      telegram_body: telegramBody,
    },
  };
});

return output;
