# Supabase n8n destination fix

## 1. `product_map_master` HTTP 400

The error `Could not find the 'address_display_packer' column of 'product_map_master'` means an order-shaped payload is being sent to a product-mapping table. `address_display_packer` exists in order tables, but it is not a column in `product_map_master`.

Insert the Code node `🧹 PRODUCT_MAP_MASTER_SANITIZER` immediately before the `product_map_master` HTTP Request node. Configure the HTTP Request body as `={{ $json }}`. Do not add `address_display_packer` to the product table; keep addresses only in `central_order_master`/`canonical_order_items`.

The canonical product fields are `sku`, `product_name`, `th_name`, `alias`, `alias_text`, `alias_norm`, `display_for_packer`, `unit_price`, `emoji`, `quantity`, `qty`, and mapping metadata.

## 2. `central_order_master` RLS error

The error `new row violates row-level security policy for table central_order_master` is an authorization problem, not a missing-column problem. The n8n HTTP Request node is using a key that cannot insert into `central_order_master`—usually an anon key or a credential attached to the wrong node.

Use a server-only n8n Header Auth credential containing:

```text
apikey: <Supabase service_role key>
Authorization: Bearer <Supabase service_role key>
Prefer: resolution=merge-duplicates,return=minimal
Content-Type: application/json
```

Do not paste the service-role key into a Code node, workflow JSON, frontend, or chat. Replace the Header Auth credential used by `👑 central_order_master2` and `👑 central_order_master3`, which POST to `central_order_master`, then execute the workflow again.

Do not disable RLS or add an unrestricted `anon` INSERT policy. If the workflow must use a non-service key, create a narrowly scoped server-side RPC with validation and call the RPC instead.

## 3. Verification order

Run one item through `🧹 PRODUCT_MAP_MASTER_SANITIZER` and confirm its output keys contain no address/customer fields. Then test `product_map_master`. After that, test one `central_order_master` item with the corrected service-role Header Auth credential. A successful Supabase upsert returns HTTP 201/204 depending on the `Prefer` header.
