import { describe, expect, it } from "vitest";
import fs from "node:fs";

function runNode(file: string, rows: unknown[]) {
  const source = fs.readFileSync(new URL(file, import.meta.url), "utf8");
  return new Function("$input", source)({ all: () => rows.map(json => ({ json })) });
}

describe("SUPHABASS n8n canonical nodes", () => {
  it("merges fragments into one order and keeps the most complete address", () => {
    const output = runNode("../n8n/ORDER_MERGE_BEFORE_CANONICAL.js", [
      {
        order_number: "ORD-100926-135200",
        page_id: "page-1",
        thread_id: "thread-1",
        address_display_packer: "บ.นาทม ต.นาทม อ.ทุ่งฝน จ.อุดรธานี 41310",
        sniper_x_text_clean: "พระ นฤเดช จิตตฺคุตฺโต\nวัด ศรีอรุณวนาราม ม.1\nบ.นาทม ต.นาทม\nอ.ทุ่งฝน จ.อุดรธานี\n41310",
        order_items: [
          { line_no: 1, sku: "CAVALLO_WATERMELON", raw_product_text: "🍉 CAVALLO แตงโม 1 คอต", quantity: 1 },
          { line_no: 2, sku: "CAVALLO_MANGO", raw_product_text: "🥭 CAVALLO มะม่วง 1 คอต", quantity: 1 },
        ],
      },
      {
        order_number: "ORD-100926-135200",
        page_id: "page-1",
        thread_id: "thread-1",
        phone: "0866025266",
        address_display_full: "พระ นฤเดช จิตตฺคุตฺโต วัด ศรีอรุณวนาราม ม.1 บ.นาทม ต.นาทม อ.ทุ่งฝน จ.อุดรธานี 41310",
      },
    ]);
    expect(output).toHaveLength(1);
    expect(output[0].json.order_items).toHaveLength(2);
    expect(output[0].json.phone).toBe("0866025266");
    expect(output[0].json.address_display_packer).toContain("พระ นฤเดช");
  });

  it("splits only structured items and rejects blank product text", () => {
    const output = runNode("../n8n/SPLIT_CANONICAL_ORDER_ITEMS.js", [{
      id: 42,
      desk_key: "suphabass",
      upsert_key: "suphabass:order:ORD-1",
      order_items: [
        { line_no: 1, sku: "SKU-1", raw_product_text: "ลูกค้าพิมพ์จริง", quantity: 2 },
        { line_no: 2, sku: "SKU-2", raw_product_text: "", quantity: 1 },
      ],
    }]);
    expect(output).toHaveLength(1);
    expect(output[0].json).toMatchObject({ order_id: 42, line_no: 1, raw_product_text: "ลูกค้าพิมพ์จริง", desk_key: "suphabass" });
    expect(output[0].json.raw_product_text_norm).toBe("ลูกค้าพิมพ์จริง");
  });
});
