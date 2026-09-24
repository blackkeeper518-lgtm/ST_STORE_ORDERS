-- ST ONLY · SAFE PRODUCT CENTER MAPPER
-- Do not run the old mapper together with this trigger.
-- This mapper handles one product-center row at a time.
-- It does not parse the first quantity from a multi-line order blob.

CREATE OR REPLACE FUNCTION public.fn_map_product_center_from_master()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  prod_rec record;
  v_qty numeric;
  v_base_display text;
BEGIN
  -- Quantity must come from this product-center row.
  -- Never take the first quantity from sniper_x_text_clean/clean_text,
  -- because a multi-line order can be 1 + 2 + 2.
  v_qty := CASE
    WHEN NEW.quantity IS NULL THEN 1
    WHEN NEW.quantity::numeric > 0 THEN NEW.quantity::numeric
    ELSE 1
  END;

  -- Product Master uses master_sku (not pm.sku).
  SELECT
    pm.master_sku,
    pm.th_name,
    pm.emoji,
    pm.display_for_packer,
    pm.master_display_for_packer
  INTO prod_rec
  FROM public.product_master pm
  WHERE lower(btrim(pm.master_sku)) = lower(btrim(coalesce(NEW.sku, '')))
     OR lower(btrim(coalesce(pm.alias, ''))) = lower(btrim(coalesce(NEW.alias, '')))
  ORDER BY CASE
    WHEN lower(btrim(pm.master_sku)) = lower(btrim(coalesce(NEW.sku, ''))) THEN 0
    ELSE 1
  END
  LIMIT 1;

  IF prod_rec.master_sku IS NOT NULL THEN
    NEW.th_name := coalesce(prod_rec.th_name, NEW.th_name);
    NEW.emoji := coalesce(prod_rec.emoji, NEW.emoji);

    v_base_display := coalesce(
      nullif(btrim(prod_rec.master_display_for_packer), ''),
      nullif(btrim(prod_rec.display_for_packer), ''),
      nullif(btrim(NEW.display_for_packer), ''),
      prod_rec.master_sku
    );

    -- Remove a previous trailing quantity before appending the row quantity.
    v_base_display := regexp_replace(
      v_base_display,
      '[[:space:]]*(x[[:space:]]*)?[0-9]+([.][0-9]+)?[[:space:]]*คอต[.]?[[:space:]]*$',
      '',
      'i'
    );

    NEW.display_for_packer := v_base_display || ' x ' || v_qty::text || ' คอต';
  END IF;

  NEW.quantity := v_qty;
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_map_product_center ON public.st_product_center;
CREATE TRIGGER trg_map_product_center
BEFORE INSERT OR UPDATE OF sku, alias, quantity, display_for_packer
ON public.st_product_center
FOR EACH ROW
EXECUTE FUNCTION public.fn_map_product_center_from_master();

-- Intentionally no blanket UPDATE here.
-- Do not run: UPDATE public.st_product_center SET updated_at = now();
