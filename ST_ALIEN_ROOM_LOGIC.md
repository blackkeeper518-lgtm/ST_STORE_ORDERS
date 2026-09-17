# Alien Room Logic — ST SINGTO STORE

## 1. Data source

The room reads the order table for this deployment: `st_orders`. It keeps one displayed row per order and never drops an order because mapping is incomplete.

## 2. Customer History

The primary history field is `normalized_chat_timeline`. The raw fallback is `chat_timeline`. The UI displays the complete history under `ORDER INSPECTOR / CUSTOMER HISTORY` and preserves the order record even when history is empty.

## 3. Product display rule

The only approved product label shown as the mapped product is `product_master.master_display_for_packer`. The UI never invents a display from SKU, `product_name`, or `th_name` when Master Display is missing.

## 4. Hard mapping rule

| Condition | Status | Display |
|---|---|---|
| Evidence exists, SKU/alias resolves, and Master Display exists | `MATCHED` | Show `master_display_for_packer` |
| Evidence exists but cannot be resolved completely | `REVIEW` | Keep raw evidence; do not map |
| No usable raw evidence | `RAW_MISSING` | Keep order; show missing evidence |

`Continue On Fail` must not be treated as success. Database writes are verified by the HTTP status and a direct Supabase query.

## 5. Address rule

Address candidates are ranked by completeness. A complete address with house number, district, amphoe, province, and postal code wins. The parser removes duplicated labels such as `ต`, `อ`, and `จ` before rebuilding canonical labels.

## 6. Tables

- Order table: `st_orders`
- Product Master: `product_master`
- Inventory: `inventory`
- Alias source: `product_map_master`
- Alien raw queue: `product_alien_terms`
- Alien review queue: `product_alien_map_reviews`
