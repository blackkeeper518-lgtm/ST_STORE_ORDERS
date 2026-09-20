// ⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘
// 🎯 ORDER_SNIPER_X : V75 SINGLE UNIFIED PAYLOAD MASTER (Zero-Error Tolerance)
// ⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘

const ARMY_APP_ID = "2166169297530889";
const BUBBLE_WINDOW = 20;
const items = $input.all();
const output = []; 

const MASTERCONFIG = [
  { "page_index": "BB_01", "page_id": "103411062505149", "page_name": "🎀BBεїзเบอร์หนึ่งสโตร์", "system_status": "ON", "assigned_agent": "#ไนท์รา", "assigned_hashtag": "🔮#BB_ORDER_01" },
  { "page_index": "BB_02", "page_id": "113923148350742", "page_name": "🎶BB ↠ STORE", "system_status": "ON", "assigned_agent": "#Venika", "assigned_hashtag": "🔮#BB_ORDER_02" },
  { "page_index": "BB_03", "page_id": "111414924711459", "page_name": "🍇BBสโตร์.", "system_status": "ON", "assigned_agent": "#Mali", "assigned_hashtag": "🔮#BB_ORDER_03" },
  { "page_index": "BB_04", "page_id": "1047257891810878", "page_name": "💗Bb store๐", "system_status": "ON", "assigned_agent": "#🍉TANGMO", "assigned_hashtag": "🔮#BB_ORDER_04" },
  { "page_index": "BB_05", "page_id": "1064404466767377", "page_name": "เจ๊บี 🅱🅱", "system_status": "ON", "assigned_agent": "#👑เจ๊บี", "assigned_hashtag": "🔮#BB_ORDER_05" },
  { "page_index": "BB_06", "page_id": "1235719106287717", "page_name": "🛒ร้าน:เจ๊บี", "system_status": "ON", "assigned_agent": "#🍀ใบบัว", "assigned_hashtag": "🔮#BB_ORDER_06" },
  { "page_index": "BB_07", "page_id": "1032290633303246", "page_name": "💬ร้าน:เจ๊ B", "system_status": "ON", "assigned_agent": "💬#", "assigned_hashtag": "🔮#BB_ORDER_07" }
];

const PRODUCT_MASTER_ARR = [
  { sku:'VESS_MINT_COOL', name:'เวสมินต์คูล', thName:'เวสมินต์คูล', price:350, emoji:'🟩', brand:['vess'], variant:['mint'], aliases:['เวสมิ้นคูล','เวสมิ้นคูล1','เวสมิ้นคูล 1','เวสมิ้นคูล2','เวสมิ้นคูล 2','เวสมิ้นคูล3','เวสมิ้นคูล 3','เวสมิ้นคูล4','เวสมิ้นคูล 4','เวสมิ้นคูล5','เวสมิ้นคูล 5'] },
  { sku:'VESS_MINT_MENTHOL', name:'เวสมินต์เมนทอล', thName:'เวสมินต์เมนทอล', price:350, emoji:'🟩', brand:['vess'], variant:['mint'], aliases:['เวสมิ้นเมนทอล','เวสมิ้นเมนทอล1','เวสมิ้นเมนทอล 1','เวสมิ้นเมนทอล2','เวสมิ้นเมนทอล 2','เวสมิ้นเมนทอล3','เวสมิ้นเมนทอล 3','เวสมิ้นเมนทอล4','เวสมิ้นเมนทอล 4','เวสมิ้นเมนทอล5','เวสมิ้นเมนทอล 5'] },
  { sku:'GOLD_MOUNT_GREEN_WHITE', name:'โกลด์เมาท์เขียวขาว', thName:'โกลด์เมาท์เขียวขาว', price:300, emoji:'🟩', brand:['gold mount'], variant:['mount'], aliases:['โกเขียวขาว','โกเขียวขาว1','โกเขียวขาว 1','โกเขียวขาว2','โกเขียวขาว 2','โกเขียวขาว3','โกเขียวขาว 3','โกเขียวขาว4','โกเขียวขาว 4','โกเขียวขาว5','โกเขียวขาว 5'] },
  { sku:'MILANO_MENTHOL', name:'มิลาโน่เมนทอล', thName:'มิลาโน่เมนทอล', price:250, emoji:'🟩', brand:['milano'], variant:['menthol'], aliases:['มิลาโน่เมนทอล','มิลาโน่เมนทอล1','มิลาโน่เมนทอล 1','มิลาโน่เมนทอล2','มิลาโน่เมนทอล 2','มิลาโน่เมนทอล3','มิลาโน่เมนทอล 3','มิลาโน่เมนทอล4','มิลาโน่เมนทอล 4','มิลาโน่เมนทอล5','มิลาโน่เมนทอล 5'] },
  { sku:'MOND_GREEN', name:'ม่อนเขียว', thName:'ม่อนเขียว', price:240, emoji:'🟩', brand:['mond'], variant:['green'], aliases:['🟢 MOND_GREEN 1 คอต','MOND_GREEN ม่อนเขียว','ม่อนเขียว1','ม่อนเขียว 1','ม่อนเขียว2','ม่อนเขียว 2','ม่อนเขียว3','🟢MOND_GREEN ','ม่อนเขียว4','ม่อนเขียว 4','ม่อนเขียว5','ม่อนเขียว 5'] },
  { sku:'PLATINUM_GREEN', name:'แพลตตินั่มเขียว', thName:'แพลตตินั่มเขียว', price:250, emoji:'🟩', brand:['platinum'], variant:['green'], aliases:['แพตตินั่มเขียว','แพตตินั่มเขียว1','แพตตินั่มเขียว 1','แพตตินั่มเขียว2','แพตตินั่มเขียว 2','แพตตินั่มเขียว3','แพตตินั่มเขียว 3','แพตตินั่มเขียว4','แพตตินั่มเขียว 4','แพตตินั่มเขียว5','แพตตินั่มเขียว 5'] },
  { sku:'SEVIOS_GREEN', name:'ซีวอสเขียว', thName:'ซีวอสเขียว', price:220, emoji:'🟩', brand:['sevios'], variant:['green'], aliases:['ซีวอสเขียว','ซีวอสเขียว1','ซีวอสเขียว 1','ซีวอสเขียว2','ซีวอสเขียว 2','ซีวอสเขียว3','ซีวอสเขียว 3','ซีวอสเขียว4','ซีวอสเขียว 4','ซีวอสเขียว5','🟩 SIERRA_GREEN'] },
  { sku:'SMS_GREEN', name:'เอสเอ็มเอสเขียว', thName:'เอสเอ็มเอสเขียว', price:250, emoji:'🟩', brand:['sms'], variant:['green'], aliases:['เอสเอ็มเอสเขียว','เอสเอ็มเอสเขียว1','เอสเอ็มเอสเขียว 1','เอสเอ็มเอสเขียว2','เอสเอ็มเอสเขียว 2','เอสเอ็มเอสเขียว3','เอสเอ็มเอสเขียว 3','เอสเอ็มเอสเขียว4','เอสเอ็มเอสเขียว 4','เอสเอ็มเอสเขียว5','เอสเอ็มเอสเขียว 5'] },
  { sku:'TEXAS_GREEN', name:'เท็กซัสเขียว', thName:'เท็กซัสเขียว', price:350, emoji:'🟩', brand:['texas'], variant:['green'], aliases:['เท็กซัสเขียว','เท็กซัสเขียว1','เท็กซัสเขียว 1','เท็กซัสเขียว2','เท็กซัสเขียว 2','เท็กซัสเขียว3','เท็กซัสเขียว 3','เท็กซัสเขียว4','เท็กซัสเขียว 4','เท็กซัสเขียว5','เท็กซัสเขียว 5'] },
  { sku:'VESS_GREEN', name:'เวสเขียว', thName:'เวสเขียว', price:260, emoji:'🟩', brand:['vess'], variant:['green'], aliases:['เวสเขียว','เวสเขียว1','เวสเขียว 1','เวสเขียว2','เวสเขียว 2','เวสเขียว3','เวสเขียว 3','เวสเขียว4','เวสเขียว 4','เวสเขียว5','เวสเขียว 5'] },
  { sku:'VESS_GREEN_SLIMS', name:'เวสเขียวสลิม', thName:'เวสเขียวสลิม', price:230, emoji:'🟩', brand:['vess'], variant:['green'], aliases:['เวสเขียวเล็ก','เวสเขียวเล็ก1','เวสเขียวเล็ก 1','เวสเขียวเล็ก2','เวสเขียวเล็ก 2','เวสเขียวเล็ก3','เวสเขียวเล็ก 3','เวสเขียวเล็ก4','เวสเขียวเล็ก 4','เวสเขียวเล็ก5','เวสเขียวเล็ก 5'] },
  { sku:'VESS_MINT', name:'เวสมินต์', thName:'เวสมินต์', price:250, emoji:'🟩', brand:['vess'], variant:['mint'], aliases:['เวสมิ้น','เวสมิ้น1','เวสมิ้น 1','เวสมิ้น2','เวสมิ้น 2','เวสมิ้น3','เวสมิ้น 3','เวสมิ้น4','เวสมิ้น 4','เวสมิ้น5','เวสมิ้น 5'] },
  { sku:'VOXX_GREEN', name:'ว็อกซ์เขียว', thName:'ว็อกซ์เขียว', price:300, emoji:'🟩', brand:['voxx'], variant:['green'], aliases:['วอคเขียว','วอคเขียว1','วอคเขียว 1','วอคเขียว2','วอคเขียว 2','วอคเขียว3','วอคเขียว 3','วอคเขียว4','วอคเขียว 4','วอคเขียว5','วอคเขียว 5'] },
  { sku:'TEXAS_BLUE', name:'เท็กซัสฟ้า', thName:'เท็กซัสฟ้า', price:350, emoji:'🟦', brand:['texas'], variant:['blue'], aliases:['เท็กซัสฟ้า','เท็กซัสฟ้า1','เท็กซัสฟ้า 1','เท็กซัสฟ้า2','เท็กซัสฟ้า 2','เท็กซัสฟ้า3','เท็กซัสฟ้า 3','เท็กซัสฟ้า4','เท็กซัสฟ้า 4','เท็กซัสฟ้า5','เท็กซัสฟ้า 5'] },
  { sku:'VESS_GREEN_BLACK', name:'เวสเขียวดำ', thName:'เวสเขียวดำ', price:250, emoji:'⬛', brand:['vess'], variant:['green'], aliases:['เวสเขียวดำ','เวสเขียวดำ1','เวสเขียวดำ 1','เวสเขียวดำ2','เวสเขียวดำ 2','เวสเขียวดำ3','เวสเขียวดำ 3','เวสเขียวดำ4','เวสเขียวดำ 4','เวสเขียวดำ5','เวสเขียวดำ 5'] },
  { sku:'SIERRA_GREEN', name:'เซียร์ร่าเขียว', thName:'เซียร์ร่าเขียว', price:220, emoji:'🟩', brand:['sierra'], variant:['green'], aliases:['เซียร่าเขียว','เซียร่าเขียว1','เซียร่าเขียว2','เซียร่าเขียว3','เซียร่าเขียว4','เซียร่าเขียว5','เซียร่าเขียว 1','เซียร่าเขียว 2','เซียร่าเขียว 3','เซียร่าเขียว 4','เซียร่าเขียว 5','เซียร์ร่าเขียว'] },
  { sku:'OS_BLUEBERRY', name:'โอเอสบลูเบอร์รี่', thName:'โอเอสบลูเบอร์รี่', price:350, emoji:'🟪', brand:['os'], variant:['blueberry'], aliases:['OS บลูเบอร์รี่','OS บลูเบอร์รี่1','OS บลูเบอร์รี่ 1','OS บลูเบอร์รี่2','OS บลูเบอร์รี่ 2','OS บลูเบอร์รี่3','OS บลูเบอร์รี่ 3','OS บลูเบอร์รี่4','OS บลูเบอร์รี่ 4','OS บลูเบอร์รี่5','OS บลูเบอร์รี่ 5','OS บลู 1'] },
  { sku:'OS_MANGO', name:'โอเอสมะม่วง', thName:'โอเอสมะม่วง', price:350, emoji:'🥭', brand:['os'], variant:['mango'], aliases:['OS มะม่วง','OS มะม่วง1','OS มะม่วง 1','OS มะม่วง2','OS มะม่วง 2','OS มะม่วง3','OS มะม่วง 3','OS มะม่วง4','OS มะม่วง 4','OS มะม่วง5','OS มะม่วง 5'] },
  { sku:'VESS_CRUSH_MINT.X.MANGO', name:'เวสครัชมินต์มะม่วง', thName:'เวสครัชมินต์มะม่วง', price:350, emoji:'🥭', brand:['vess'], variant:['crush'], aliases:['เวสมะม่วง','เวสมะม่วง1','เวสมะม่วง 1','เวสมะม่วง2','เวสมะม่วง 2','เวสมะม่วง3','เวสมะม่วง 3','เวสมะม่วง4','เวสมะม่วง 4','เวสมะม่วง5','เวสมะม่วง 5'] },
  { sku:'OS_STRAWBERRY', name:'โอเอสสตรอว์เบอร์รี่', thName:'โอเอสสตรอว์เบอร์รี่', price:350, emoji:'🍓', brand:['os'], variant:['strawberry'], aliases:['OS สตอเบอร์รี่','OS สตอเบอร์รี่1','OS สตอเบอร์รี่ 1','OS สตอเบอร์รี่2','OS สตอเบอร์รี่ 2','OS สตอเบอร์รี่3','OS สตอเบอร์รี่ 3','OS สตอเบอร์รี่4','OS สตอเบอร์รี่ 4','OS สตอเบอร์รี่5','OS สตอเบอร์รี่ 5'] },
  { sku:'MILANO_JAPAN', name:'มิลาโน่เจแปน', thName:'มิลาโน่เจแปน', price:250, emoji:'🍎', brand:['milano'], variant:['japan'], aliases:['มิลาโน่ญี่ปุ่น','มิลาโน่ญี่ปุ่น1','มิลาโน่ญี่ปุ่น 1','มิลาโน่ญี่ปุ่น2','มิลาโน่ญี่ปุ่น 2','มิลาโน่ญี่ปุ่น3','มิลาโน่ญี่ปุ่น 3','มิลาโน่ญี่ปุ่น4','มิลาโน่ญี่ปุ่น 4','มิลาโน่ญี่ปุ่น5','มิลาโน่ญี่ปุ่น 5'] },
  { sku:'OS_PINEAPPLE', name:'โอเอสสับปะรด', thName:'โอเอสสับปะรด', price:350, emoji:'🍍', brand:['os'], variant:['pineapple'], aliases:['OS สับปะรด','OS สับปะรด1','OS สับปะรด 1','OS สับปะรด2','OS สับปะรด 2','OS สับปะรด3','OS สับปะรด 3','OS สับปะรด4','OS สับปะรด 4','OS สับปะรด5','OS สับปะรด 5'] },
  { sku:'VESS_CRUSH_MINT.X.APPLE', name:'เวสครัชมินต์แอปเปิ้ล', thName:'เวสครัชมินต์แอปเปิ้ล', price:350, emoji:'🍎', brand:['vess'], variant:['crush'], aliases:['เวสแอปเปิ้ล','เวสแอปเปิ้ล1','เวสแอปเปิ้ล 1','เวสแอปเปิ้ล2','เวสแอปเปิ้ล 2','เวสแอปเปิ้ล3','เวสแอปเปิ้ล 3','เวสแอปเปิ้ล4','เวสแอปเปิ้ล 4','เวสแอปเปิ้ล5','เวสแอปเปิ้ล 5'] },
  { sku:'OS_WATERMELON', name:'โอเอสแตงโม', thName:'โอเอสแตงโม', price:350, emoji:'🍉', brand:['os'], variant:['watermelon'], aliases:['OS แตงโม','OS แตงโม1','OS แตงโม 1','OS แตงโม2','OS แตงโม 2','OS แตงโม3','OS แตงโม 3','OS แตงโม4','OS แตงโม 4','OS แตงโม5','OS แตงโม 5'] },
  { sku:'VESS_CRUSH_MINT.X.GRAPE', name:'เวสครัชมินต์องุ่น', thName:'เวสครัชมินต์องุ่น', price:350, emoji:'🍇', brand:['vess'], variant:['crush'], aliases:['เวสองุ่นใหญ่','เวสองุ่นใหญ่1','เวสองุ่นใหญ่ 1','เวสองุ่นใหญ่2','เวสองุ่นใหญ่ 2','เวสองุ่นใหญ่3','เวสองุ่นใหญ่ 3','เวสองุ่นใหญ่4','เวสองุ่นใหญ่ 4','เวสองุ่นใหญ่5','เวสองุ่นใหญ่ 5'] },
  { sku:'VESS_GRAPE_SLIMS', name:'เวสองุ่นสลิม', thName:'เวสองุ่นสลิม', price:350, emoji:'🍇', brand:['vess'], variant:['grape'], aliases:['เวสองุ่นสลิม','เวสองุ่นสลิม1','เวสองุ่นสลิม 1','เวสองุ่นสลิม2','เวสองุ่นสลิม 2','เวสองุ่นสลิม3','เวสองุ่นสลิม 3','เวสองุ่นสลิม4','เวสองุ่นสลิม 4','เวสองุ่นสลิม5','เวสองุ่นสลิม 5'] },
  { sku:'MOND_RAINBOW', name:'ม่อนเรนโบว์', thName:'ม่อนเรนโบว์', price:450, emoji:'🌈', brand:['mond'], variant:['rainbow'], aliases:['ม่อนรุ้ง','ม่อนรุ้ง1','ม่อนรุ้ง 1','ม่อนรุ้ง2','ม่อนรุ้ง 2','ม่อนรุ้ง3','ม่อนรุ้ง 3','ม่อนรุ้ง4','ม่อนรุ้ง 4','ม่อนรุ้ง5','ม่อนรุ้ง 5'] },
  { sku:'SEVIOS_RED', name:'ซีวอสแดง', thName:'ซีวอสแดง', price:220, emoji:'🟥', brand:['sevios'], variant:['red'], aliases:['SEVIOS_RED','ซีวอสแดง','ซีวอสแดง1','ซีวอสแดง 1','ซีวอสแดง2','ซีวอสแดง 2','ซีวอสแดง3','ซีวอสแดง 3','ซีวอสแดง4','ซีวอสแดง 4','ซีวอสแดง5','ซีวอสแดง 5'] },
  { sku:'SIERRA_RED', name:'เซียร์ร่า', thName:'เซียร์ร่า', price:220, emoji:'🟥', brand:['sierra'], variant:['red'], aliases:['เซียร่า','เซียร่า1','เซียร่า 1','เซียร่า2','เซียร่า 2','เซียร่า3','เซียร่า 3','เซียร่า4','เซียร่า 4','เซียร่า5','เซียร่า 5'] },
  { sku:'MOND_GOLD', name:'ม่อนทอง', thName:'ม่อนทอง', price:230, emoji:'🟨', brand:['mond'], variant:['gold'], aliases:['ม่อนทอง','ม่อนทอง1','ม่อนทอง 1','ม่อนทอง2','ม่อนทอง 2','ม่อนทอง3','ม่อนทอง 3','ม่อนทอง4','ม่อนทอง 4','ม่อนทอง5','ม่อนทอง 5','MOND Signature Gold'] },
  { sku:'VESS_GOLD', name:'เวสทอง', thName:'เวสทอง', price:230, emoji:'🟨', brand:['vess'], variant:['gold'], aliases:['เวสทอง','เวสทอง1','เวสทอง 1','เวสทอง2','เวสทอง 2','เวสทอง3','เวสทอง 3','เวสทอง4','เวสทอง 4','เวสทอง5','เวสทอง 5'] },
  { sku:'MILANO_GOLD', name:'มิลาโน่ทอง', thName:'มิลาโน่ทอง', price:250, emoji:'🟨', brand:['milano'], variant:['gold'], aliases:['มิลาโน่ทอง','มิลาโน่ทอง1','มิลาโน่ทอง 1','มิลาโน่ทอง2','มิลาโน่ทอง 2','มิลาโน่ทอง3','มิลาโน่ทอง 3','มิลาโน่ทอง4','มิลาโน่ทอง 4','มิลาโน่ทอง5','มิลาโน่ทอง 5'] },
  { sku:'CAVALLO_RED', name:'คาวาโร่แดง', thName:'คาวาโร่แดง', price:250, emoji:'🟥', brand:['cavallo'], variant:['red'], aliases:['คาแดง','คาแดง1','คาแดง 1','คาแดง2','คาแดง 2','คาแดง3','คาแดง 3','คาแดง4','คาแดง 4','คาแดง5','คาแดง 5'] },
  { sku:'MILANO_KINGS', name:'มิลาโน่คิง', thName:'มิลาโน่คิง', price:250, emoji:'🟥', brand:['milano'], variant:['kings'], aliases:['มิลาโน่คิง','มิลาโน่คิง1','มิลาโน่คิง 1','มิลาโน่คิง2','มิลาโน่คิง 2','มิลาโน่คิง3','มิลาโน่คิง 3','มิลาโน่คิง4','มิลาโน่คิง 4','มิลาโน่คิง5','มิลาโน่คิง 5'] },
  { sku:'PLATINUM_BLACK', name:'แพตตินั่มดำ', thName:'แพตตินั่มดำ', price:250, emoji:'⬛', brand:['platinum'], variant:['black'], aliases:['แพตตินั่มดำ','แพตตินั่มดำ1','แพตตินั่มดำ 1','แพตตินั่มดำ2','แพตตินั่มดำ 2','แพตตินั่มดำ3','แพตตินั่มดำ 3','แพตตินั่มดำ4','แพตตินั่มดำ 4','แพตตินั่มดำ5','แพตตินั่มดำ 5'] },
  { sku:'GOLD_MOUNT_RED_WHITE', name:'โกเม้าแดงขาว', thName:'โกเม้าแดงขาว', price:300, emoji:'🟥', brand:['gold mount'], variant:['mount'], aliases:['โกเม้าแดงขาว','โกเม้าแดงขาว1','โกเม้าแดงขาว 1','โกเม้าแดงขาว2','โกเม้าแดงขาว 2','โกเม้าแดงขาว3','โกเม้าแดงขาว 3','โกเม้าแดงขาว4','โกเม้าแดงขาว 4','โกเม้าแดงขาว5','โกเม้าแดงขาว 5'] },
  { sku:'WALTON_RED', name:'วอลตันแดง', thName:'วอลตันแดง', price:300, emoji:'🟥', brand:['walton'], variant:['red'], aliases:['วอลตันแดง','วอลตันแดง1','วอลตันแดง 1','วอลตันแดง2','วอลตันแดง 2','วอลตันแดง3','วอลตันแดง 3','วอลตันแดง4','วอลตันแดง 4','วอลตันแดง5','วอลตันแดง 5'] },
  { sku:'VOXX_BLACK', name:'วอคดำ', thName:'วอคดำ', price:300, emoji:'⬛', brand:['voxx'], variant:['black'], aliases:['วอคดำ','วอคดำ1','วอคดำ 1','วอคดำ2','วอคดำ 2','วอคดำ3','วอคดำ 3','วอคดำ4','วอคดำ 4','วอคดำ5','วอคดำ 5'] },
  { sku:'TEXAS_GOLD', name:'เท็กซัสทอง', thName:'เท็กซัสทอง', price:350, emoji:'🟨', brand:['texas'], variant:['gold'], aliases:['เท็กซัสทอง','เท็กซัสทอง1','เท็กซัสทอง 1','เท็กซัสทอง2','เท็กซัสทอง 2','เท็กซัสทอง3','เท็กซัสทอง 3','เท็กซัสทอง4','เท็กซัสทอง 4','เท็กซัสทอง5','เท็กซัสทอง 5'] },
  { sku:'JOHN_RED', name:'JHON', thName:'JHON', price:350, emoji:'🟥', brand:['john'], variant:['red'], aliases:['จอนแข็ง','จอนแข็ง1','จอนแข็ง 1','จอนแข็ง2','จอนแข็ง 2','จอนแข็ง3','จอนแข็ง 3','จอนแข็ง4','จอนแข็ง 4','จอนแข็ง5','จอนแข็ง 5'] },
  { sku:'TEXAS_RED', name:'เท็กซัสแดง', thName:'เท็กซัสแดง', price:350, emoji:'🟥', brand:['texas'], variant:['red'], aliases:['เท็กซัสแดง','เท็กซัสแดง1','เท็กซัสแดง 1','เท็กซัสแดง2','เท็กซัสแดง 2','เท็กซัสแดง3','เท็กซัสแดง 3','เท็กซัสแดง4','เท็กซัสแดง 4','เท็กซัสแดง5','เท็กซัสแดง 5'] },
  { sku:'MILANO_PURPLE', name:'มิลาโน่ม่วง', thName:'มิลาโน่ม่วง', price:350, emoji:'🟪', brand:['milano'], variant:['purple'], aliases:['มิลาโน่ม่วง','มิลาโน่ม่วง1','มิลาโน่ม่วง 1','มิลาโน่ม่วง2','มิลาโน่ม่วง 2','มิลาโน่ม่วง3','มิลาโน่ม่วง 3','มิลาโน่ม่วง4','มิลาโน่ม่วง 4','มิลาโน่ม่วง5','มิลาโน่ม่วง 5'] },
  { sku:'CAVALLO_TWIN_X_BALL', name:'คาวาโร่ม่วง', thName:'คาวาโร่ม่วง', price:350, emoji:'🟪', brand:['cavallo'], variant:['twin'], aliases:['คาวาโล่ม่วงเม็ดบีบ','คาวาโล่ม่วงเม็ดบีบ1','คาวาโล่ม่วงเม็ดบีบ 1','🟣 CAVALLO ม่วง','คาวาโล่ม่วง 2','คาม่วง','คาม่วง 3','🍇 CAVALLO ม่วง','คาวาโล่ม่วงเม็ดบีบ 4','คาม่วง2','คาม่วง1 ','CAVALLO_ม่วง2' ] },
  { sku:'BAROESAN', name:'บารูซัน', thName:'บารูซัน', price:350, emoji:'🍫', brand:['baroesan'], variant:[''], aliases:['บารูอิซัน','บารูอิซัน1','บารูอิซัน 1','บารูอิซัน2','บารูอิซัน 2','บารูอิซัน3','บารูอิซัน 3','บารูอิซัน4','บารูอิซัน 4','บารูอิซัน5','บารูอิซัน 5'] },
  { sku:'CAVALLO_GREEN', name:'คาวาโล่เขียว', thName:'คาวาโล่เขียว', price:250, emoji:'🟩', brand:['cavallo'], variant:['green'], aliases:['CAVALLO_GREEN','CAVALLO GREEN','คาเขียว','คาเขียว1','คาเขียว 1','คาเขียว2','คาเขียว 2','คาเขียว3','คาเขียว 3','คาเขียว4','คาเขียว 4','คาเขียว5'] },
  { sku:'ROYAL_GREEN', name:'รอยัลเขียว', thName:'รอยัลเขียว', price:230, emoji:'🟩', brand:['royal'], variant:['green'], aliases:['รอยัลเขียว','รอยัลเขียว1','รอยัลเขียว 1','รอยัลเขียว2','รอยัลเขียว 2','รอยัลเขียว3','รอยัลเขียว 3','รอยัลเขียว4','รอยัลเขียว 4','รอยัลเขียว5','รอยัลเขียว 5'] },
  { sku:'235_GREEN', name:'235 เขียว', thName:'235 เขียว', price:300, emoji:'🟩', brand:['235'], variant:['green'], aliases:['235 เขียว','235 เขียว1','235 เขียว 1','235 เขียว2','235 เขียว 2','235 เขียว3','235 เขียว 3','235 เขียว4','235 เขียว 4','235 เขียว5','235 เขียว 5'] },
  { sku:'CANYON_GREEN', name:'แคนยอนเขียว', thName:'แคนยอนเขียว', price:350, emoji:'🟩', brand:['canyon'], variant:['green'], aliases:['แคนยอนเขียว','แคนยอนเขียว1','แคนยอนเขียว 1','แคนยอนเขียว2','แคนยอนเขียว 2','แคนยอนเขียว3','แคนยอนเขียว 3','แคนยอนเขียว4','แคนยอนเขียว 4','แคนยอนเขียว5','แคนยอนเขียว 5'] },
  { sku:'GOLD_MOUNT_FULL_GREEN', name:'โกลด์เมาท์เขียวล้วน', thName:'โกลด์เมาท์เขียวล้วน', price:300, emoji:'🟩', brand:['gold mount'], variant:['mount'], aliases:['โกเม้าเขียวล้วน','โกเม้าเขียวล้วน1','โกเม้าเขียวล้วน 1','โกเม้าเขียวล้วน2','โกเม้าเขียวล้วน 2','โกเม้าเขียวล้วน3','โกเม้าเขียวล้วน 3','โกเม้าเขียวล้วน4','โกเม้าเขียวล้วน 4','โกเม้าเขียวล้วน5','โกเม้าเขียวล้วน 5'] },
  { sku:'L&M_GREEN', name:'แอลแอนด์เอ็มเขียว', thName:'แอลแอนด์เอ็มเขียว', price:300, emoji:'🟩', brand:['l&m'], variant:['green'], aliases:['แอลเอ็มเขียว','แอลเอ็มเขียว1','แอลเอ็มเขียว 1','แอลเอ็มเขียว2','แอลเอ็มเขียว 2','แอลเอ็มเขียว3','แอลเอ็มเขียว 3','แอลเอ็มเขียว4','แอลเอ็มเขียว 4','แอลเอ็มเขียว5','แอลเอ็มเขียว 5'] },
  { sku:'MARLBORO_MENTHOL', name:'มาโบโร่เมนทอล', thName:'มาโบโร่เมนทอล', price:300, emoji:'🟩', brand:['marlboro'], variant:['menthol'], aliases:['มาโบโร่เขียว','มาโบโร่เขียว1','มาโบโร่เขียว 1','มาโบโร่เขียว2','มาโบโร่เขียว 2','มาโบโร่เขียว3','มาโบโร่เขียว 3','มาโบโร่เขียว4','มาโบโร่เขียว 4','มาโบโร่เขียว5','มาโบโร่เขียว 5'] },
  { sku:'WALTON_GREEN', name:'วอลตันเขียว', thName:'วอลตันเขียว', price:300, emoji:'🟩', brand:['walton'], variant:['green'], aliases:['วอลตันเขียว','วอลตันเขียว1','วอลตันเขียว 1','วอลตันเขียว2','วอลตันเขียว 2','วอลตันเขียว3','วอลตันเขียว 3','วอลตันเขียว4','วอลตันเขียว 4','วอลตันเขียว5','วอลตันเขียว 5'] },
  { sku:'CAPITAL_BLUE', name:'แคปิตอลฟ้า', thName:'แคปิตอลฟ้า', price:350, emoji:'🟦', brand:['capital'], variant:['blue'], aliases:['แคปปิตอลฟ้า','แคปปิตอลฟ้า1','แคปปิตอลฟ้า 1','แคปปิตอลฟ้า2','แคปปิตอลฟ้า 2','แคปปิตอลฟ้า3','แคปปิตอลฟ้า 3','แคปปิตอลฟ้า4','แคปปิตอลฟ้า 4','แคปปิตอลฟ้า5','แคปปิตอลฟ้า 5'] },
  { sku:'ORIS_STRAWBERRY', name:'โอริสสตรอว์เบอร์รี่', thName:'โอริสสตรอว์เบอร์รี่', price:350, emoji:'🍓', brand:['oris'], variant:['strawberry'], aliases:['โอริสสตรอว์เบอร์รี่','โอริสสตรอว์เบอร์รี่1','โอริสสตรอว์เบอร์รี่ 1','โอริสสตรอว์เบอร์รี่2','โอริสสตรอว์เบอร์รี่ 2','โอริสสตรอว์เบอร์รี่3','โอริสสตรอว์เบอร์รี่ 3','โอริสสตรอว์เบอร์รี่4','โอริสสตรอว์เบอร์รี่ 4','โอริสสตรอว์เบอร์รี่5','โอริสสตรอว์เบอร์รี่ 5'] },
  { sku:'ORIS_STRAWBERRY_2CAPS', name:'โอริสสตรอว์เบอร์รี่ 2 เม็ดบีบ', thName:'โอริสสตรอว์เบอร์รี่ 2 เม็ดบีบ', price:450, emoji:'🍓', brand:['oris'], variant:['strawberry'], aliases:['โอริสสตรอว์เบอร์รี่','โอริสสตรอว์เบอร์รี่1','โอริสสตรอว์เบอร์รี่ 1','โอริสสตรอว์เบอร์รี่2','โอริสสตรอว์เบอร์รี่ 2','โอริสสตรอว์เบอร์รี่3','โอริสสตรอว์เบอร์รี่ 3','โอริสสตรอว์เบอร์รี่4','โอริสสตรอว์เบอร์รี่ 4','โอริสสตรอว์เบอร์รี่5','โอริสสตรอว์เบอร์รี่ 5'] },
  { sku:'PLATINUM_STRAWBERRY', name:'แพลตตินั่มสตรอว์เบอร์รี่', thName:'แพลตตินั่มสตรอว์เบอร์รี่', price:300, emoji:'🍓', brand:['platinum'], variant:['strawberry'], aliases:['แพลตตินั่มสตรอว์เบอร์รี่','แพลตตินั่มสตรอว์เบอร์รี่1','แพลตตินั่มสตรอว์เบอร์รี่ 1','แพลตตินั่มสตรอว์เบอร์รี่2','แพลตตินั่มสตรอว์เบอร์รี่ 2','แพลตตินั่มสตรอว์เบอร์รี่3','แพลตตินั่มสตรอว์เบอร์รี่ 3','แพลตตินั่มสตรอว์เบอร์รี่4','แพลตตินั่มสตรอว์เบอร์รี่ 4','แพลตตินั่มสตรอว์เบอร์รี่5','แพลตตินั่มสตรอว์เบอร์รี่ 5'] },
  { sku:'ORIS_CHERRY', name:'โอริสเชอร์รี่', thName:'โอริสเชอร์รี่', price:350, emoji:'🍒', brand:['oris'], variant:['cherry'], aliases:['โอริสเชอร์รี่','โอริสเชอร์รี่1','โอริสเชอร์รี่ 1','โอริสเชอร์รี่2','โอริสเชอร์รี่ 2','โอริสเชอร์รี่3','โอริสเชอร์รี่ 3','โอริสเชอร์รี่4','โอริสเชอร์รี่ 4','โอริสเชอร์รี่5','โอริสเชอร์รี่ 5'] },
  { sku:'JOHN_APPLE_2CAPS', name:'จอห์นแอปเปิ้ล 2 เม็ดบีบ', thName:'จอห์นแอปเปิ้ล 2 เม็ดบีบ', price:350, emoji:'🍎', brand:['john'], variant:['apple'], aliases:['จอนแอปเปิ้ล 2 เม็ดบีบ','จอนแอปเปิ้ล 2 เม็ดบีบ1','จอนแอปเปิ้ล 2 เม็ดบีบ 1','จอนแอปเปิ้ล 2 เม็ดบีบ2','จอนแอปเปิ้ล 2 เม็ดบีบ 2','จอนแอปเปิ้ล 2 เม็ดบีบ3','จอนแอปเปิ้ล 2 เม็ดบีบ 3','จอนแอปเปิ้ล 2 เม็ดบีบ4','จอนแอปเปิ้ล 2 เม็ดบีบ 4','จอนแอปเปิ้ล 2 เม็ดบีบ5','จอนแอปเปิ้ล 2 เม็ดบีบ 5'] },
  { sku:'MOND_APPLE_FRUIT', name:'ม่อนแอปเปิ้ล', thName:'ม่อนแอปเปิ้ล', price:200, emoji:'🍎', brand:['mond'], variant:['apple'], aliases:['ม่อนแอปเปิ้ล','ม่อนแอปเปิ้ล1','ม่อนแอปเปิ้ล 1','ม่อนแอปเปิ้ล2','ม่อนแอปเปิ้ล 2','ม่อนแอปเปิ้ล3','ม่อนแอปเปิ้ล 3','ม่อนแอปเปิ้ล4','ม่อนแอปเปิ้ล 4','ม่อนแอปเปิ้ล5','ม่อนแอปเปิ้ล 5'] },
  { sku:'ORIS_APPLE', name:'โอริสแอปเปิ้ล', thName:'โอริสแอปเปิ้ล', price:350, emoji:'🍎', brand:['oris'], variant:['apple'], aliases:['โอริสแอปเปิ้ล','โอริสแอปเปิ้ล1','โอริสแอปเปิ้ล 1','โอริสแอปเปิ้ล2','โอริสแอปเปิ้ล 2','โอริสแอปเปิ้ล3','โอริสแอปเปิ้ล 3','โอริสแอปเปิ้ล4','โอริสแอปเปิ้ล 4','โอริสแอปเปิ้ล5','โอริสแอปเปิ้ล 5'] },
  { sku:'PLATINUM_APPLE', name:'แพลตตินั่มแอปเปิ้ล', thName:'แพลตตินั่มแอปเปิ้ล', price:300, emoji:'🍎', brand:['platinum'], variant:['apple'], aliases:['แพลตตินั่มแอปเปิ้ล','แพลตตินั่มแอปเปิ้ล1','แพลตตินั่มแอปเปิ้ล 1','แพลตตินั่มแอปเปิ้ล2','แพลตตินั่มแอปเปิ้ล 2','แพลตตินั่มแอปเปิ้ล3','แพลตตินั่มแอปเปิ้ล 3','แพลตตินั่มแอปเปิ้ล4','แพลตตินั่มแอปเปิ้ล 4','แพลตตินั่มแอปเปิ้ล5','แพลตตินั่มแอปเปิ้ล 5'] },
  { sku:'ORIS_GRAPE', name:'โอริสองุ่น', thName:'โอริสองุ่น', price:350, emoji:'🍇', brand:['oris'], variant:['grape'], aliases:['โอริสองุ่น','โอริสองุ่น1','โอริสองุ่น 1','โอริสองุ่น2','โอริสองุ่น 2','โอริสองุ่น3','โอริสองุ่น 3','โอริสองุ่น4','โอริสองุ่น 4','โอริสองุ่น5','โอริสองุ่น 5'] },
  { sku:'JOHN_SPA', name:'จอนสปา', thName:'จอนสปา', price:220, emoji:'🟥', brand:['john'], variant:['spa'], aliases:['จอนสปา','จอนสปา1','จอนสปา 1','จอนสปา2','จอนสปา 2','จอนสปา3','จอนสปา 3','จอนสปา4','จอนสปา 4','จอนสปา5','จอนสปา 5'] },
  { sku:'ROYAL_RED', name:'รอยัลแดง', thName:'รอยัลแดง', price:230, emoji:'🟥', brand:['royal'], variant:['red'], aliases:['รอยัลแดง','รอยัลแดง1','รอยัลแดง 1','รอยัลแดง2','รอยัลแดง 2','รอยัลแดง3','รอยัลแดง 3','รอยัลแดง4','รอยัลแดง 4','รอยัลแดง5','รอยัลแดง 5'] },
  { sku:'GM_RED', name:'จีเอ็มแดง', thName:'จีเอ็มแดง', price:250, emoji:'🟥', brand:['gm'], variant:['red'], aliases:['จีเอ็ม','จีเอ็ม1','จีเอ็ม 1','จีเอ็ม2','จีเอ็ม 2','จีเอ็ม3','จีเอ็ม 3','จีเอ็ม4','จีเอ็ม 4','จีเอ็ม5','จีเอ็ม 5'] },
  { sku:'KRONG_THIP_RED', name:'กรองทิพย์', thName:'กรองทิพย์', price:250, emoji:'🟥', brand:['krong thip'], variant:['thip'], aliases:['กรองทิพย์','กรองทิพย์1','กรองทิพย์ 1','กรองทิพย์2','กรองทิพย์ 2','กรองทิพย์3','กรองทิพย์ 3','กรองทิพย์4','กรองทิพย์ 4','กรองทิพย์5','กรองทิพย์ 5'] },
  { sku:'SMS_RED', name:'เอสเอ็มเอสแดง', thName:'เอสเอ็มเอสแดง', price:250, emoji:'🟥', brand:['sms'], variant:['red'], aliases:['เอสเอ็มเอสแดง','เอสเอ็มเอสแดง1','เอสเอ็มเอสแดง 1','เอสเอ็มเอสแดง2','เอสเอ็มเอสแดง 2','เอสเอ็มเอสแดง3','เอสเอ็มเอสแดง 3','เอสเอ็มเอสแดง4','เอสเอ็มเอสแดง 4','เอสเอ็มเอสแดง5','เอสเอ็มเอสแดง 5'] },
  { sku:'VESS_RED', name:'เวสแดง', thName:'เวสแดง', price:260, emoji:'🟥', brand:['vess'], variant:['red'], aliases:['เวสแดง','เวสแดง1','เวสแดง 1','เวสแดง2','เวสแดง 2','เวสแดง3','เวสแดง 3','เวสแดง4','เวสแดง 4','เวสแดง5','เวสแดง 5'] },
  { sku:'VESS_RED_LIGHT', name:'เวสแดงอ่อน', thName:'เวสแดงอ่อน', price:260, emoji:'🟥', brand:['vess'], variant:['red'], aliases:['เวสแดงอ่อน','เวสแดงอ่อน1','เวสแดงอ่อน 1','เวสแดงอ่อน2','เวสแดงอ่อน 2','เวสแดงอ่อน3','เวสแดงอ่อน 3','เวสแดงอ่อน4','เวสแดงอ่อน 4','เวสแดงอ่อน5','เวสแดงอ่อน 5'] },
  { sku:'MARLBORO_GOLD', name:'มาโบโร่ทอง', thName:'มาโบโร่ทอง', price:300, emoji:'🟨', brand:['marlboro'], variant:['gold'], aliases:['มาโบโร่ขาว','มาโบโร่ขาว1','มาโบโร่ขาว 1','มาโบโร่ขาว2','มาโบโร่ขาว 2','มาโบโร่ขาว3','มาโบโร่ขาว 3','มาโบโร่ขาว4','มาโบโร่ขาว 4','มาโบโร่ขาว5','มาโบโร่ขาว 5'] },
  { sku:'235_RED', name:'235 แดง', thName:'235 แดง', price:300, emoji:'🟥', brand:['235'], variant:['red'], aliases:['235 แดง','235 แดง1','235 แดง 1','235 แดง2','235 แดง 2','235 แดง3','235 แดง 3','235 แดง4','235 แดง 4','235 แดง5','235 แดง 5'] },
  { sku:'GOLD_MOUNT_FULL_RED', name:'โกลด์เมาท์แดงล้วน', thName:'โกลด์เมาท์แดงล้วน', price:300, emoji:'🟥', brand:['gold mount'], variant:['mount'], aliases:['โกเม้าแดงล้วน','โกเม้าแดงล้วน1','โกเม้าแดงล้วน 1','โกเม้าแดงล้วน2','โกเม้าแดงล้วน 2','โกเม้าแดงล้วน3','โกเม้าแดงล้วน 3','โกเม้าแดงล้วน4','โกเม้าแดงล้วน 4','โกเม้าแดงล้วน5','โกเม้าแดงล้วน 5'] },
  { sku:'JOHN_WHITE', name:'จอนขาว', thName:'จอนขาว', price:300, emoji:'🟥', brand:['john'], variant:['white'], aliases:['จอนอ่อน','จอนอ่อน1','จอนอ่อน 1','จอนอ่อน2','จอนอ่อน 2','จอนอ่อน3','จอนอ่อน 3','จอนอ่อน4','จอนอ่อน 4','จอนอ่อน5','จอนอ่อน 5'] },
  { sku:'L&M_RED', name:'เวสแดงพรีเมี่ยม', thName:'เวสแดงพรีเมี่ยม', price:300, emoji:'🟥', brand:['l&m'], variant:['red'], aliases:['แอลเอ็มแดง','แอลเอ็มแดง1','แอลเอ็มแดง 1','แอลเอ็มแดง2','แอลเอ็มแดง 2','แอลเอ็มแดง3','แอลเอ็มแดง 3','แอลเอ็มแดง4','แอลเอ็มแดง 4','แอลเอ็มแดง5','แอลเอ็มแดง 5'] },
  { sku:'MARLBORO_RED', name:'มาโบโร่แดง', thName:'มาโบโร่แดง', price:300, emoji:'🟥', brand:['marlboro'], variant:['red'], aliases:['มาโบโร่แดง','มาโบโร่แดง1','มาโบโร่แดง 1','มาโบโร่แดง2','มาโบโร่แดง 2','มาโบโร่แดง3','มาโบโร่แดง 3','มาโบโร่แดง4','มาโบโร่แดง 4','มาโบโร่แดง5','มาโบโร่แดง 5'] },
  { sku:'VESS_RED_PREMIUM', name:'เวสแดงพรีเมี่ยม', thName:'เวสแดงพรีเมี่ยม', price:300, emoji:'🟥', brand:['vess'], variant:['red'], aliases:['เวสแดงพรีเมี่ยม','เวสแดงพรีเมี่ยม1','เวสแดงพรีเมี่ยม 1','เวสแดงพรีเมี่ยม2','เวสแดงพรีเมี่ยม 2','เวสแดงพรีเมี่ยม3','เวสแดงพรีเมี่ยม 3','เวสแดงพรีเมี่ยม4','เวสแดงพรีเมี่ยม 4','เวสแดงพรีเมี่ยม5','เวสแดงพรีเมี่ยม 5'] },
  { sku:'CANYON_RED', name:'แคนยอนแดง', thName:'แคนยอนแดง', price:350, emoji:'🟥', brand:['canyon'], variant:['red'], aliases:['แคนยอนแดง','แคนยอนแดง1','แคนยอนแดง 1','แคนยอนแดง2','แคนยอนแดง 2','แคนยอนแดง3','แคนยอนแดง 3','แคนยอนแดง4','แคนยอนแดง 4','แคนยอนแดง5','แคนยอนแดง 5'] },
  { sku:'PLATINUM_BLUE_COOL', name:'แพลตตินั่มบลูคูล', thName:'แพลตตินั่มบลูคูล', price:350, emoji:'🟦', brand:['platinum'], variant:['blue'], aliases:['แพลตตินั่มฟ้าคูล','แพลตตินั่มฟ้าคูล1','แพลตตินั่มฟ้าคูล 1','แพลตตินั่มฟ้าคูล2','แพลตตินั่มฟ้าคูล 2','แพลตตินั่มฟ้าคูล3','แพลตตินั่มฟ้าคูล 3','แพลตตินั่มฟ้าคูล4','แพลตตินั่มฟ้าคูล 4','แพลตตินั่มฟ้าคูล5','แพลตตินั่มฟ้าคูล 5'] },
  { sku:'PLATINUM_BLUE_MINT_2CAPS', name:'แพลตตินั่มบลูมินต์ 2 เม็ดบีบ', thName:'แพลตตินั่มบลูมินต์ 2 เม็ดบีบ', price:350, emoji:'🟦', brand:['platinum'], variant:['blue'], aliases:['แพลตตินั่มบลูมิ้นท์ 2 เม็ดบีบ','แพลตตินั่มบลูมิ้นท์ 2 เม็ดบีบ1','แพลตตินั่มบลูมิ้นท์ 2 เม็ดบีบ 1','แพลตตินั่มบลูมิ้นท์ 2 เม็ดบีบ2','แพลตตินั่มบลูมิ้นท์ 2 เม็ดบีบ 2','แพลตตินั่มบลูมิ้นท์ 2 เม็ดบีบ3','แพลตตินั่มบลูมิ้นท์ 2 เม็ดบีบ 3','แพลตตินั่มบลูมิ้นท์ 2 เม็ดบีบ4','แพลตตินั่มบลูมิ้นท์ 2 เม็ดบีบ 4','แพลตตินั่มบลูมิ้นท์ 2 เม็ดบีบ5','แพลตตินั่มบลูมิ้นท์ 2 เม็ดบีบ 5'] },
  { sku:'MILANO_FIZZ', name:'มิลาโน่ฟิซ', thName:'มิลาโน่ฟิซ', price:350, emoji:'🍫', brand:['milano'], variant:['fizz'], aliases:['มิลาโน่ฟิซ','มิลาโน่ฟิซ1','มิลาโน่ฟิซ 1','มิลาโน่ฟิซ2','มิลาโน่ฟิซ 2','มิลาโน่ฟิซ3','มิลาโน่ฟิซ 3','มิลาโน่ฟิซ4','มิลาโน่ฟิซ 4','มิลาโน่ฟิซ5','มิลาโน่ฟิซ 5'] },
  { sku:'SUK_DEFAULT', name:'สุขดั้งเดิม', thName:'สุขดั้งเดิม', price:350, emoji:'🍫', brand:['suk'], variant:['default'], aliases:['ซุค','ซุค1','ซุค 1','ซุค2','ซุค 2','ซุค3','ซุค 3','ซุค4','ซุค 4','ซุค5','ซุค 5'] },
  { sku:'ORIS_BLUE_1CAPS', name:'โอริสฟ้า 1 เม็ดบีบ', thName:'โอริสฟ้า 1 เม็ดบีบ', price:400, emoji:'🟦', brand:['oris'], variant:['blue'], aliases:['โอริสฟ้า','โอริสฟ้า1','โอริสฟ้า 1','โอริสฟ้า2','โอริสฟ้า 2','โอริสฟ้า3','โอริสฟ้า 3','โอริสฟ้า4','โอริสฟ้า 4','โอริสฟ้า5','โอริสฟ้า 5'] },
  { sku:'ORIS_BLUE_2CAPS', name:'โอริสฟ้า 2 เม็ดบีบ', thName:'โอริสฟ้า 2 เม็ดบีบ', price:450, emoji:'🟦', brand:['oris'], variant:['blue'], aliases:['โอริสบลู','โอริสบลู1','โอริสบลู 1','โอริสบลู2','โอริสบลู 2','โอริสบลู3','โอริสบลู 3','โอริสบลู4','โอริสบลู 4','โอริสบลู5','โอริสบลู 5'] },
  { sku:'BLUE_ICE_ICE_1CAPS', name:'บลูไอซ์ ไอซ์ 1 เม็ดบีบ', thName:'บลูไอซ์ ไอซ์ 1 เม็ดบีบ', price:450, emoji:'🍫', brand:['blue ice'], variant:['ice'], aliases:['บลูไอซ์','บลูไอซ์1','บลูไอซ์ 1','บลูไอซ์2','บลูไอซ์ 2','บลูไอซ์3','บลูไอซ์ 3','บลูไอซ์4','บลูไอซ์ 4','บลูไอซ์5','บลูไอซ์ 5'] },
  { sku:'BLUE_ICE_ICE_2CAPS', name:'บลูไอซ์ ไอซ์ 2 เม็ดบีบ', thName:'บลูไอซ์ ไอซ์ 2 เม็ดบีบ', price:450, emoji:'🍫', brand:['blue ice'], variant:['ice'], aliases:['บลูไอซ์','บลูไอซ์1','บลูไอซ์ 1','บลูไอซ์2','บลูไอซ์ 2','บลูไอซ์3','บลูไอซ์ 3','บลูไอซ์4','บลูไอซ์ 4','บลูไอซ์5','บลูไอซ์ 5'] },
  { sku:'D&J_DEFAULT', name:'ดีแอนด์เจดั้งเดิม', thName:'ดีแอนด์เจดั้งเดิม', price:450, emoji:'🍫', brand:['d&j'], variant:['default'], aliases:['ดีแอนด์เจ','ดีแอนด์เจ1','ดีแอนด์เจ 1','ดีแอนด์เจ2','ดีแอนด์เจ 2','ดีแอนด์เจ3','ดีแอนด์เจ 3','ดีแอนด์เจ4','ดีแอนด์เจ 4','ดีแอนด์เจ5','ดีแอนด์เจ 5'] },
  { sku:'MOND_BLACK', name:'ม่อนดำ', thName:'ม่อนดำ', price:450, emoji:'⬛', brand:['mond'], variant:['black'], aliases:['ม่อนดำ','ม่อนดำ1','ม่อนดำ 1','ม่อนดำ2','ม่อนดำ 2','ม่อนดำ3','ม่อนดำ 3','ม่อนดำ4','ม่อนดำ 4','ม่อนดำ5','ม่อนดำ 5'] },
  { sku:'CAVALLO_WATERMELON', name:'คาวาโร่แตงโม', thName:'คาวาโร่แตงโม', price:350, emoji:'🍉', brand:['cavallo_watermelon'], variant:['watermelon'], aliases:['คาแตงโม','คา แตงโม1','CAVALLO_แตงโม','CAVALLO_WATERMELON'] },
  { sku:'CAVALLO_MANGO', name:'คาวาโร่มะม่วง', thName:'คาวาโร่มะม่วง', price:350, emoji:'🥭', brand:['cavallo'], variant:['mango'], aliases:['CAVALLO_MANGO','คาวาโร่มะม่วง','คามะม่วง','คาม่วง','มะม่วง'] },
  { sku:'SEVIOS_WATERMELON', name:'ซีวอสแตงโม', thName:'ซีวอสแตงโม', price:350, emoji:'🍉', brand:['sevios'], variant:['watermelon'], aliases:['SEVIOS_WATERMELON','ซีวอสแตงโม','ซีวอส แตงโม'] },
];

// PART 1: Indexing Master Data พร้อมเก็บ id และ price
const PRODUCT_MASTER = {}; 
const PRICE_MASTER = {};
for (let p of PRODUCT_MASTER_ARR) { 
  PRODUCT_MASTER[p.sku] = {
    id: p.id,
    sku: p.sku,
    name: p.name,
    thName: p.thName,
    price: p.price,
    emoji: p.emoji,
    aliases: p.aliases
  }; 
  PRICE_MASTER[p.sku] = p.price; 
}

function cleanAlias(raw){ if(!raw) return ""; return String(raw).replace(/\|+/g," ").replace(/_{2,}/g," ").replace(/`+/g,"").replace(/<code>|<\/code>/gi,"").replace(/^[^\wก-๙🍉🥭🟩🟥]+/g,"").replace(/\s{2,}/g," ").trim(); }
function toNorm(raw){ return cleanAlias(raw).toLowerCase(); }
function normProductText(value){ return String(value||"").toLowerCase().replace(/[|_\-]+/g," ").replace(/\s+/g," ").trim(); }


// PART 2: เตรียม Keywords สำหรับการค้นหาปกติ
let ALL_PRODUCT_KEYWORDS = [];
for (let skuKey in PRODUCT_MASTER) {  
  const p = PRODUCT_MASTER[skuKey] || {};
  const explicit = [...(Array.isArray(p.aliases) ? p.aliases : []), p.name, p.sku].filter(Boolean);
  for (let kw of explicit) {
    const keyword = normProductText(kw);
    if (keyword.length >= 2) {
      ALL_PRODUCT_KEYWORDS.push({
        id: p.id,
        skuKey: skuKey, 
        keyword: keyword, 
        raw_keyword: String(kw)
      });
    }
  }
}
ALL_PRODUCT_KEYWORDS.sort((a,b)=>b.keyword.length-a.keyword.length);

function extractMessages(obj, pageIdFromParent=""){  
  let messages=[];  
  if(Array.isArray(obj)){  
    obj.forEach(item=>{ messages=messages.concat(extractMessages(item, pageIdFromParent)); });  
  } else if(typeof obj==='object' && obj!==null){  
    if(obj.message && obj.id){  
      let cleanedMsg=obj.message.replace(/udfe[0-9a-fA-F]{0,4}/gi,"").replace(/\\?ud[0-9a-fA-F]+/gi,"");  
      messages.push({...obj, message:cleanedMsg, page_id_inherited:pageIdFromParent});  
    }  
    let currentPageId=pageIdFromParent;  
    if(obj.participants?.data){  
      const pageP=obj.participants.data.find(p=>p.id?.length>10);  
      if(pageP) currentPageId=pageP.id;  
    }  
    for(const key in obj){ messages=messages.concat(extractMessages(obj[key], currentPageId)); }  
  }  
  return messages;  
}

let threads = {};
for(const w of items){
  for(const conv of (w.json.data || [])){
    if(!conv.id) continue;
    if(!threads[conv.id]) threads[conv.id] = { msgs: [], parts: conv.participants?.data || [] };
    threads[conv.id].msgs.push(...extractMessages(conv));
  }
}

function fmt(iso){
  if(!iso) return "";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getFullYear()).slice(-2)} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
}

for(const tid in threads){
  let msgs = threads[tid].msgs.sort((a,b)=>new Date(a.created_time)-new Date(b.created_time));
  const pagePart = threads[tid].parts.find(p => MASTERCONFIG.some(c => String(c.page_id) === String(p.id)));
  const masterConfigNode = MASTERCONFIG.find(c => String(c.page_id) === String(pagePart?.id)) || MASTERCONFIG[6];
  
  for(let i=0; i<msgs.length; i++){
    const m = msgs[i];
    let SNIPER_X_TEXT = m.message || ""; 
    SNIPER_X_TEXT = SNIPER_X_TEXT.replace(/\\n/g,'\n').replace(/\\\s*n/gi,'\n');
    
    if(!/cod/i.test(SNIPER_X_TEXT)) continue;
    
    let fbCustomerName = ""; let realTargetId = ""; let threadId = tid;
    if(threads[tid].parts){
      const custPart = threads[tid].parts.find(p => p.id !== masterConfigNode.page_id);
      if(custPart){ fbCustomerName = custPart.name || ""; realTargetId = custPart.id || ""; }
    }
    
    const codMatch = SNIPER_X_TEXT.match(/(?:COD|ยอดรวมCOD|ยอดเงิน|ยอด)\s*[:：]?\s*(?:\s*\[\s*([0-9,]+)\s*\]|\s*([0-9,]+))/i); 
    const rawCodValue = codMatch ? (codMatch[1] || codMatch[2]) : "0"; 
    const hascodAmount = parseInt(rawCodValue.replace(/,/g,'')) || 0; 
    
    if(hascodAmount < 200) continue;

    let ev = [], evTime = [], full = [], fullTime = [];
    for(let j = i - 1; j >= Math.max(0, i - BUBBLE_WINDOW); j--){
      const up = msgs[j];
      const isUp = MASTERCONFIG.some(c => String(c.page_id) === String(up.from?.id)) || up.is_echo === true;
      if(isUp) continue;
      const txt = up.message || "";
      if(!txt.trim()) continue;
      const t = fmt(up.created_time);
      ev.unshift(`[ลูกค้า: ${txt}]`);
      evTime.unshift(`${t} [ลูกค้า: ${txt}]`);
      full.unshift(txt);
      fullTime.unshift(`${t} ${txt}`);
      if(!fbCustomerName) fbCustomerName = up.from?.name || "";
    }
    const codT = fmt(m.created_time);
    ev.push(`[เพจ: ${SNIPER_X_TEXT.slice(0,300)}]`);
    evTime.push(`${codT} [เพจ: ${SNIPER_X_TEXT.slice(0,300)}]`);

    let validatedPhone = "";
    const text = SNIPER_X_TEXT || '';
    let customer_name="ไม่ระบุชื่อ"; 
    const nameMatch=SNIPER_X_TEXT.match(/(?:👤\s*ชื่อ|ชื่อ)\s*[:：]?\s*((?:พระ|หลวงพ่อ|หลวงตา|หลวงพี่|ครูบา|พระมหา|ท่านเจ้าคุณ)?\s*[ก-๙a-zA-Z\.\s]+?)(?=\s*📱|\s*📍|\s*📮|$)/i); 
    if(nameMatch&&nameMatch[1]) customer_name=nameMatch[1].replace(/^(?:คุณ|นาย|นาง|นางสาว|น\.ส\.|K\.)\s*/i,"").trim(); 
    if((!customer_name||customer_name==="ไม่ระบุชื่อ")&&fbCustomerName) customer_name=fbCustomerName.replace(/^(?:คุณ|นาย|นาง|นางสาว|น\.ส\.|K\.)\s*/i,"").trim();
      
    const lines = text.split('\n');
    for(let line of lines){
      if(/ORD|ออเดอร์|ORDER|recipient_id|thread_id|page_id/i.test(line)) continue;
      if(/เบอร์/.test(line)){
        const matchPhone = line.match(/0[689]\d{1}[\s\-]*\d{3}[\s\-]*\d{4}/);
        if(matchPhone){
          let clean = matchPhone[0].replace(/[^0-9]/g,"");
          if(clean.length===10){ validatedPhone = clean; break; }
        }
      }
    }

    if(!validatedPhone){
      const all = [...text.matchAll(/(?<!\d)0[689]\d[\s\-]*\d{3}[\s\-]*\d{4}(?!\d)/g)];
      for(let p of all){
        let clean = p[0].replace(/[^0-9]/g,"");
        if(clean.length!==10) continue;
        const idx = p.index || 0;
        const before = text.substring(Math.max(0, idx-30), idx);
        if(/ORD|ออเดอร์|ORDER|รหัส|เลขที่/.test(before)) continue;
        if(/LINE|@/.test(before)) continue;
        validatedPhone = clean;
        break;
      }
    }

    let addrLines = [];
    for(let l of lines){
      if(/สรุปรายการสั่งซื้อ|COD|⏰|💰|รายการสินค้า|ORDER_MYSTORY|CAVALLO|St_Singto|เจ๊บี/i.test(l)) continue;
      let onlyDigits = l.replace(/[-\s\.]/g,"");
      if(/^0\d{9}$/.test(onlyDigits)) continue;
      if(/^\d{5}$/.test(l) && addrLines.length===0) continue;
      if(/^ชื่อ\.?/.test(l) && l.length < 15 &&!/\d/.test(l)) continue;
      if(/^(ขวัญ|วันนา)$/.test(l)) continue;
      if(l.length > 3) addrLines.push(l);
    }

    let finalAddressClean = addrLines.join(" ")
    .replace(/ชื่อ\.วันนา|ขวัญ/g, "")
    .replace(/(\d{5})\.(\d+)/g, "$1 $2")
    .replace(/ซอย\./g, "ซอย ")
    .replace(/\s{2,}/g, " ")
    .trim();

    let rawAddressBody = finalAddressClean
    .replace(/◦+/g, " ")
    .replace(/[⊱✿✧･ﾟ*💗🌸🍇🎯💜🟣🍁🚨👑「」┌┐└┘✦🆔]/g, " ")
    .replace(/#.*ORDER_MYSTORY.*/gi, " ")
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, " ")
    .replace(/[\uDC00-\uDFFF\uD800-\uDBFF\uFFFD\uDCB0]/g, " ")
    .replace(/[─━═][=-=-───────────=-=-=-]{3,}.*?เลขที่ออเดอร์.*?["─━═]{3,}/gi, " ")
    .replace(/เลขที่ออเดอร์.*/gi, " ")
    .replace(/```/g, "")
    .replace(/\[\s*สถานะ.*?\]/g, "")
    .replace(/⏰.*?(?:น\.|น)/g, "")
    .replace(/💰.*?(?:บาท)?/gi, "")
    .replace(/🤖\s*\[.*?\]/g, "")
    .replace(/\b(COD|ยอดรวม|สรุปรายการ|รายการสินค้า|เวลาสั่งซื้อ)\b.*$/gims, "")
    .replace(/(?:ชื่อ\.?|เบอร์โทร\.?|เบอร์)\s*[0-9\-]{9,}/gi, " ")
    .replace(/\b0\d{1}[-\s]?\d{3}[-\s]?\d{4}\b/g, " ")
    .replace(/เลขไปรษณีย์|รหัสไปรษณีย์|ไปรษณีย์/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

    if(!rawAddressBody || rawAddressBody.length < 10) rawAddressBody = finalAddressClean;
    finalAddressClean = rawAddressBody;

    let houseStart = finalAddressClean.match(/(\d+\/\d+|\d+\s*ม\.\s*\d+|\d+\s*หมู่\s*\d+)/);
    if(houseStart){
      let idx = finalAddressClean.indexOf(houseStart[0]);
      if(idx > 0 && idx < 30) finalAddressClean = finalAddressClean.substring(idx);
    }

    let hasshipping_zipcode = (finalAddressClean.match(/\b([1-9][0-9]{4})\b/)||[])[1] || "";
    let spacedAddr = finalAddressClean
    .replace(/(ตำบล|อำเภอ|จังหวัด|ต\.|อ\.|จ\.)/g, " $1 ")
    .replace(/\./g, " ")
    .replace(/(\d{5})/g, " $1 ")
    .replace(/\s{2,}/g, " ")
    .trim();

    if (customer_name && finalAddressClean.includes(customer_name)) {
      finalAddressClean = finalAddressClean.replace(customer_name, "").trim();
    }
    finalAddressClean = finalAddressClean.replace(/(?:โทร|เบอร์)?\s*[:：]?\s*0[0-9\s-]{8,13}\d/g, "").trim();
    const houseNumMatch = finalAddressClean.match(/\d+[\/\d]*\s+/);
    if (houseNumMatch && houseNumMatch.index > 0 && houseNumMatch.index < 15) {
      finalAddressClean = finalAddressClean.substring(houseNumMatch.index).trim();
    }

    let hassubDistrict = (spacedAddr.match(/(?:^|\s)(?:ตำบล|ต)\s+([ก-๙]{2,})/)||[])[1] || "";
    let hasdistrict = (spacedAddr.match(/(?:^|\s)(?:อำเภอ|อ)\s+([ก-๙]{2,})/)||[])[1] || "";
    let hasgetProvince = (spacedAddr.match(/(?:^|\s)(?:จังหวัด|จ)\s+([ก-๙]{2,}(?:\s[ก-๙]+)?)/)||[])[1] || "";

    if(!hasgetProvince){
      if(/กทม|กรุงเทพ/i.test(spacedAddr)) hasgetProvince = "กรุงเทพมหานคร";
      else {
        let provList = ["กระบี่","กาญจนบุรี","กาฬสินธุ์","กำแพงเพชร","ขอนแก่น","จันทบุรี","ฉะเชิงเทรา","ชลบุรี","ชัยนาท","ชัยภูมิ","ชุมพร","เชียงราย","เชียงใหม่","ตรัง","ตราด","ตาก","นครนายก","นครปฐม","นครพนม","นครราชสีมา","นครศรีธรรมราช","นครสวรรค์","นนทบุรี","นราธิวาส","น่าน","บึงกาฬ","บุรีรัมย์","ปทุมธานี","ประจวบคีรีขันธ์","ปราจีนบุรี","ปัตตานี","พระนครศรีอยุธยา","อยุธยา","พังงา","พัทลุง","พิจิตร","พิษณุโลก","เพชรบุรี","เพชรบูรณ์","แพร่","ภูเก็ต","มหาสารคาม","มุกดาหาร","แม่ฮ่องสอน","ยโสธร","ยะลา","ร้อยเอ็ด","ระนอง","ระยอง","ราชบุรี","ลพบุรี","ลำปาง","ลำพูน","เลย","ศรีสะเกษ","สกลนคร","สงขลา","สตูล","สมุทรปราการ","สมุทรสงคราม","สมุทรสาคร","สระแก้ว","สระบุรี","สิงห์บุรี","สุโขทัย","สุพรรณบุรี","สุราษฎร์ธานี","สุรินทร์","หนองคาย","หนองบัวลำภู","อ่างทอง","อำนาจเจริญ","อุดรธานี","อุตรดิตถ์","อุทัยธานี","อุบลราชธานี"];
        for(let p of provList){
          if(spacedAddr.includes(p)){
            hasgetProvince = p==="อยุธยา"?"พระนครศรีอยุธยา":p;
            break;
          }
        }
      }
    }

    let shortAddressClean = "";
    let mHouse = spacedAddr.match(/(\d+\/\d+|\d+)\s*(?:หมู่|ม)\s*\d+/i);
    if(mHouse) shortAddressClean = mHouse[0].trim();
    else {
      let noZip = spacedAddr.replace(/^\d{5}\s+/, "").replace(/\s+\d{5}(\s|$)/, " ");
      if(hasgetProvince) noZip = noZip.replace(hasgetProvince, "").replace(/กรุงเทพ.*/, "").trim();
      shortAddressClean = noZip.split(/\s+(?:ตำบล|ต|อำเภอ|อ|จังหวัด|จ)\s+/)[0].trim().substring(0,50);
      shortAddressClean = shortAddressClean.split(/\s+บ้าน/)[0].trim();
      if(!shortAddressClean) shortAddressClean = noZip.substring(0,40);
    }

    let pureCleanAddress = shortAddressClean;
    if(hassubDistrict &&!pureCleanAddress.includes(hassubDistrict)) pureCleanAddress += ` ต.${hassubDistrict}`;
    if(hasdistrict &&!pureCleanAddress.includes(hasdistrict)) pureCleanAddress += ` อ.${hasdistrict}`;
    if(hasgetProvince &&!pureCleanAddress.includes(hasgetProvince) &&!pureCleanAddress.includes("กรุงเทพ")) pureCleanAddress += ` จ.${hasgetProvince}`;
    if(hasshipping_zipcode &&!pureCleanAddress.includes(hasshipping_zipcode)) pureCleanAddress += ` ${hasshipping_zipcode}`;
    
    // 🛑 กวาดชื่อพระ/คำนำหน้าออกจาก address_display_packer เด็ดขาด
    pureCleanAddress = pureCleanAddress
      .replace(/^(พระ|หลวงพ่อ|หลวงตา|หลวงพี่|ครูบา|พระมหา|ท่านเจ้าคุณ|คุณ|นาย|นาง|นางสาว)\s+[ก-๙\.\s]+/i, "")
      .replace(/\s*จ\.กรุงเทพมหานคร/, " จ.กรุงเทพมหานคร")
      .trim();

    pureCleanAddress = [...new Set(pureCleanAddress.split(/\s+/))].join(" ").trim();

    let orderItems = []; let codeBlockLines = []; let rawFrontLines = []; let totalQty = 0;
    const rawLines = SNIPER_X_TEXT.split('\n').map(l=>l.trim()).filter(Boolean);

    let lineCounter = 1;
    for(const line of rawLines){
      if(!line) continue;
      const lowerLine = line.toLowerCase().trim();
      const lineUpper = line.toUpperCase();

      // 🛑 ป้องกันไม่ให้บรรทัดชื่อคน คำนำหน้าทางสงฆ์ หรือขยะไหลเข้ามาเป็นสินค้า
      if (
          /^(พระ|หลวงพ่อ|หลวงตา|หลวงพี่|ครูบา|พระมหา|ท่านเจ้าคุณ|คุณ|นาย|นาง|นางสาว|น\.ส\.|K\.)/i.test(line) ||
          lowerLine.includes("line") || lowerLine.includes("@") || lowerLine.includes("http") || 
          lowerLine.includes("lin.ee") || lowerLine.includes("ก่อนเปิดกล่อง") || lowerLine.includes("นายท่าน") ||
          lowerLine.includes("รบกวนอัดคลิป") || lowerLine.includes("พัสดุเสียหาย") || lowerLine.includes("สรุปรายการสั่งซื้อ") ||
          lowerLine.includes("ยอดรวม") || lowerLine.includes("ชื่อ-นามสกุล") || lowerLine.includes("เบอร์โทรศัพท์") ||
          /^[•\.\-\*\s]+$/.test(line) || lineUpper.includes("COD") || lineUpper.includes("ยอด") || 
          lineUpper.includes("ชื่อ") || lineUpper.includes("ที่อยู่") || lineUpper.includes("โทร") || lineUpper.includes("สถานะ")
      ) {
          continue;
      }




// PART 3: ประมวลผลข้อความแชททีละบรรทัด พร้อมระบบ 2-Pass Matching
let orderItems = []; 
let codeBlockLines = []; 
let rawFrontLines = []; 
let totalQty = 0;
const rawLines = SNIPER_X_TEXT.split('\n').map(l=>l.trim()).filter(Boolean);

let lineCounter = 1; // ตัวนับบรรทัดเริ่มต้นที่ 1 และเพิ่มขึ้นถูกต้อง
for (const line of rawLines) {
  if (!line) continue;
  const lowerLine = line.toLowerCase().trim();
  const lineUpper = line.toUpperCase();

  if (
      lowerLine.includes("line") || lowerLine.includes("@") || lowerLine.includes("http") || 
      lowerLine.includes("lin.ee") || lowerLine.includes("ก่อนเปิดกล่อง") || lowerLine.includes("นายท่าน") ||
      lowerLine.includes("รบกวนอัดคลิป") || lowerLine.includes("พัสดุเสียหาย") || lowerLine.includes("สรุปรายการสั่งซื้อ") ||
      lowerLine.includes("ยอดรวม") || lowerLine.includes("ชื่อ-นามสกุล") || lowerLine.includes("เบอร์โทรศัพท์") ||
      /^[•\.\-\*\s]+$/.test(line) || lineUpper.includes("COD") || lineUpper.includes("ยอด") || 
      lineUpper.includes("ชื่อ") || lineUpper.includes("ที่อยู่") || lineUpper.includes("โทร") || lineUpper.includes("สถานะ")
  ) {
      continue;
  }

  let matchedKey = null;

  // PASS 1: ค้นหาด้วย Keyword ปกติ
  for (let kwObj of ALL_PRODUCT_KEYWORDS) { 
    if (lineUpper.includes(kwObj.keyword.toUpperCase())) { 
      matchedKey = kwObj.skuKey; 
      break; 
    } 
  }

  // PASS 2: ถ้า Pass 1 ไม่เจอ ให้ใช้ Fallback / Hardcore Typo Matching ค้นหาคำวิบัติ
  if (!matchedKey) {
    const isHardcoreTypoMatch = /(gold|green|red|แดง|เหลือง|ชิวาส|บลู|เขียว|ผลไม้|🟢|🟣|🥭|🍍|🍓|🍉|🔴|🍇|🟡|🍎|ม่อนทอง|ซีวอสแดง|เซียร่า|จอนสปา|รอยัลแดง|เวสทอง|คาแดง|แพตตินั่มดำ|มิลาโน่คิง|มิลาโน่ทอง|มิลาโน่ญี่ปุ่น|mond ทอง|จีเอ็ม|กรองทิพย์|เวสแดง|เวสแดงอ่อน|แอลเอ็มแดง|จอนอ่อน|วอคดำ|วอกดำ|มาโบโร่แดง|มาโบโร่ขาว|235 แดง|เวสแดงพรีเมี่ยม|เวสแดงล้วน|แตงโม1|วอลตันแดง|โกเม้าแดงขาว|โกเม้าแดงล้วน|จอนแข็ง|เท็กซัสแดง|เท็กซัสทอง|เวสเเดง|os องุ่น|รอยัลเขียว|ซีวอสเขียว|ม่อนเขียว|เวสเขียวเล็ก|คาเขียว|เวสเขียวดำ|เอสเอ็มเอสเขียว|มิลาโน่เมนทอล|เวสมิ้น|แพตตินั่มเขียว|เวสเขียว|แอลเอ็มเขียว|มาโบโร่เขียว|วอคเขียว|วอลตันเขียว|235 เขียว|โกเขียวขาว|วอต้นเขียว|โกเม้าเขียวล้วน|แคนยอนเขียว|เท็กซัสฟ้า|เท็กซัสเขียว|แคปปิตอลฟ้า|ม่อนแอปเปิ้ล|แพลตตินั่มแอปเปิ้ล|แพลตตินั่มสตรอว์เบอร์รี่|จอนแอปเปิ้ล|os มะม่วง|os สับปะรด|os บลูเบอร์รี่|os สตอเบอร์รี่|os แตงโม|แพลตตินั่มฟ้าคูล|คาวาโล่ม่วงเม็ดบีบ|มิลาโน่ฟิซ|แพลตตินั่มบลูมิ้นท์|โอริสแอปเปิ้ล|โอริสสตรอว์เบอร์รี่|โอริสองุ่น|โอริสเชอร์รี่|ชีวอสเเดง|บารูอิซัน|ซุค|เวสองุ่นสลิม|เวสมิ้นคูล|เวสมิ้นเมนทอล|มิลาโน่ม่วง|โอริสฟ้า|ดีแอนด์เจ|ซีวอสฟ้า|ม่อนดำ|บลูไอซ์|โอริสบลู|ม่อนรุ้ง|เวสองุ่นใหญ่|เวสมะม่วง)/.test(lowerLine);
    
    if (isHardcoreTypoMatch) {
      for (let kwObj of ALL_PRODUCT_KEYWORDS) {
        if (lineUpper.includes(kwObj.keyword.toUpperCase())) {
          matchedKey = kwObj.skuKey;
          break;
        }
      }
    }

    if (!matchedKey) {
      if (lowerLine.includes('แตงโม') || line.includes('🍉')) matchedKey = 'CAVALLO_WATERMELON';
      else if (lowerLine.includes('มะม่วง') || line.includes('🥭')) matchedKey = 'CAVALLO_MANGO';
      else if (lowerLine.includes('ม่วง') || line.includes('🟣') || line.includes('🍇')) matchedKey = 'CAVALLO_TWIN_X_BALL';
    }
  }

  if (!matchedKey) continue;

  const p = PRODUCT_MASTER[matchedKey]; 
  if (!p) continue;

  let allNums = lowerLine.match(/\d+/g);
  let lineSum = 0;
  if (allNums) {
    for (let numStr of allNums) {
      let parsedNum = parseInt(numStr, 10);
      let cleanNum = (parsedNum === 10) ? 1 : parsedNum;
      if (cleanNum < 100) lineSum += cleanNum;
    }
  }
  let qty = (lineSum > 0) ? lineSum : 1;
  let itemPrice = p.price || 240;
  // PART 4: บันทึกข้อมูล orderItem พร้อมแนบ id และรัน line_no แบบถูกต้อง
  orderItems.push({
    line_no: lineCounter++,      // 👈 แก้ไขให้รันนับเพิ่มทีละ 1 ถูกต้อง
    id: p.id,                    // 👈 ดึงค่า id ออกมาแสดงเรียบร้อย
    raw_product_text: line,
    sku: p.sku,
    product_name: p.name,
    th_name: p.thName,
    quantity: qty,
    unit_price: itemPrice,
    line_total: qty * itemPrice,
    emoji: p.emoji
  });

  codeBlockLines.push(`${p.emoji} ${p.sku}(${p.thName}) ${qty} คอต`);
  rawFrontLines.push(line.replace(/^[^\w\u0E00-\u0E7F🍉🥭🟩🟥]+/,'').trim());
  totalQty += qty;
}

    const combinedSku = orderItems.length > 0 ? orderItems.map(i => i.sku).join(", ") : "CHECK_SKU";
    const combinedEmoji = orderItems.length > 0 ? orderItems.map(i => i.emoji).join("") : "📦";
    const masterPrice = (orderItems.length > 0 && PRICE_MASTER[orderItems[0].sku]) ? PRICE_MASTER[orderItems[0].sku] : 240; 
    let finalQty = totalQty || Math.round(hascodAmount/masterPrice) || 1; 

    const finalDisplay = codeBlockLines.length > 0 ? codeBlockLines.join(" + ") : "📦 CHECK_SKU 1 คอต";
    const finalDisplayLocked = finalDisplay.replace(/\d+\s*คอต/g, `${finalQty} คอต`);
    const finalAliasDisplay = rawFrontLines.length > 0 ? rawFrontLines.join(" + ") : finalDisplayLocked;

    const realCreatedTime = m.created_time ? new Date(m.created_time) : new Date(); 
    const thDate = new Date(realCreatedTime.getTime() + (7 * 60 * 60 * 1000));
    const day = String(thDate.getUTCDate()).padStart(2, '0');
    const month = String(thDate.getUTCMonth() + 1).padStart(2, '0');
    const year = String(thDate.getUTCFullYear()).slice(-2);
    const timeStr = thDate.toTimeString().split(' ')[0].replace(/:/g, '');
    const dynamicOrderNumber = `ORD-${day}${month}${year}-${timeStr}`;
    const realOrderTimeStr = thDate.toTimeString().split(' ')[0];

    // 🛑 บรรจุข้อมูลทั้งหมดไว้ใน JSON Object เดียว (Single Unified Payload) ส่งเข้าโหนดหลักรวดเดียวจบ
    output.push({ 
      json: { 
        upsert_key: `${m.id || threadId || ""}_${cleanAlias(fbCustomerName || "").slice(0,20)}`.replace(/\s+/g,""), 
        facebook_name: (fbCustomerName || '').trim(), 
        threadId: threadId || "", 
        time_th: `⏰${realOrderTimeStr}`, 
        order_date: `📅 ${day}/${month}/${year}`, 
        order_time: thDate.toLocaleString("th-TH",{timeZone:"Asia/Bangkok"}), 
        page_name: masterConfigNode.page_name, 
        order_number: dynamicOrderNumber, 
        cod_amount: hascodAmount, 
        customer_name: customer_name, 
        phone: validatedPhone, 
        extracted_phone: validatedPhone, 
        address_display_packer: pureCleanAddress, 
        addressclean: pureCleanAddress, 
        short_address: shortAddressClean, 
        district: hassubDistrict || "DATA_MISSING", 
        amphoe: hasdistrict || "DATA_MISSING", 
        province: hasgetProvince || "DATA_MISSING", 
        zipcode: hasshipping_zipcode, 
        display_for_packer: finalDisplayLocked, 
        alias: cleanAlias(finalAliasDisplay), 
        alias_norm: toNorm(finalAliasDisplay), 
        th_name: orderItems.map(i => i.product_name).join(", ") || "ตรวจสอบ", 
        sku: combinedSku, 
        quantity: finalQty, 
        qty: finalQty, 
        extracted_qty: finalQty, 
        emoji: combinedEmoji, 
        extracted_emoji: combinedEmoji, 
        unit_price: masterPrice, 
        expected_cod: hascodAmount, 
        lock_status: `✅ PASS ล็อคคู่ Single Unified Payload สมบูรณ์`, 
        order_status: "🤣ขี้เกลือแท้", 
        page_id: masterConfigNode.page_id, 
        recipient_id: realTargetId || "", 
        thread_id: threadId || "", 
        day_of_week: "DATA_MISSING", 
        created_at: m.created_time || new Date().toISOString(), 
        updated_at: m.created_time || new Date().toISOString(), 
        assigned_hashtag: masterConfigNode.assigned_hashtag, 
        sniper_x_text_clean: SNIPER_X_TEXT, 
        clean_text: SNIPER_X_TEXT, 
        single_cleaned_block: SNIPER_X_TEXT.replace(/[\r\n]+/g," ").trim(), 
        message_id: m.id || "",
        bubble_window: BUBBLE_WINDOW,
        raw_text: finalAliasDisplay,
        final_display_for_packer: finalDisplayLocked,
        raw_text_with_phone: ev.join('\n'), 
        raw_text_with_phone_timed: evTime.join('\n'), 
        full_chunk_text: full.join(" "), 
        chat_timeline: evTime,
        has_phone: Boolean(validatedPhone),
        has_cod: true,
        telegram_sent: false,
        order_items: orderItems
      } 
    });
    break; 
  }
}
  }
return output;