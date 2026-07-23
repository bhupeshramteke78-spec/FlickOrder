create or replace function public.create_qr_order_transaction(
  p_restaurant_slug text,
  p_table_number text,
  p_customer_name text,
  p_kitchen_notes text,
  p_items jsonb
)
returns table(order_id uuid, order_number text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_restaurant_id uuid;
  v_table_id uuid;
  v_tax_rate numeric(5,2) := 0;
  v_order_id uuid;
  v_order_number text;
  v_subtotal numeric(12,2) := 0;
  v_tax_total numeric(12,2) := 0;
  v_total numeric(12,2) := 0;
  v_item jsonb;
  v_menu_item record;
  v_quantity integer;
  v_unit_price numeric(12,2);
  v_line_total numeric(12,2);
  v_options text[];
begin
  if length(trim(coalesce(p_customer_name, ''))) < 2 then
    raise exception 'Customer name is required.';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'At least one order item is required.';
  end if;

  select id
  into v_restaurant_id
  from public.restaurants
  where slug = p_restaurant_slug
    and is_open = true;

  if v_restaurant_id is null then
    raise exception 'Restaurant not found or closed.';
  end if;

  select id
  into v_table_id
  from public.tables
  where restaurant_id = v_restaurant_id
    and table_number = p_table_number
  for update;

  if v_table_id is null then
    raise exception 'Table not found.';
  end if;

  select coalesce(tax_rate, 0)
  into v_tax_rate
  from public.restaurant_settings
  where restaurant_id = v_restaurant_id;

  create temporary table if not exists pg_temp.validated_order_items (
    menu_item_id uuid not null,
    name_snapshot text not null,
    unit_price numeric(12,2) not null,
    quantity integer not null,
    notes text,
    options text[] not null,
    total numeric(12,2) not null
  ) on commit drop;

  truncate table pg_temp.validated_order_items;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := coalesce((v_item ->> 'quantity')::integer, 0);

    if v_quantity < 1 or v_quantity > 99 then
      raise exception 'Invalid item quantity.';
    end if;

    select id, name, price, offer_price, is_available, is_sold_out
    into v_menu_item
    from public.menu_items
    where id = (v_item ->> 'menuItemId')::uuid
      and restaurant_id = v_restaurant_id
    for update;

    if v_menu_item.id is null or not v_menu_item.is_available or v_menu_item.is_sold_out then
      raise exception 'One or more items are unavailable.';
    end if;

    v_unit_price := coalesce(v_menu_item.offer_price, v_menu_item.price);
    v_line_total := v_unit_price * v_quantity;
    v_options := coalesce(
      array(select jsonb_array_elements_text(coalesce(v_item -> 'options', '[]'::jsonb))),
      array[]::text[]
    );

    if cardinality(v_options) > 12 then
      raise exception 'Too many item options.';
    end if;

    insert into pg_temp.validated_order_items (
      menu_item_id,
      name_snapshot,
      unit_price,
      quantity,
      notes,
      options,
      total
    )
    values (
      v_menu_item.id,
      v_menu_item.name,
      v_unit_price,
      v_quantity,
      nullif(v_item ->> 'notes', ''),
      v_options,
      v_line_total
    );

    v_subtotal := v_subtotal + v_line_total;
  end loop;

  v_tax_total := round(v_subtotal * (v_tax_rate / 100), 2);
  v_total := v_subtotal + v_tax_total;
  v_order_id := gen_random_uuid();
  v_order_number := 'FO-' || floor(extract(epoch from clock_timestamp()) * 1000)::bigint::text;

  insert into public.orders (
    id,
    restaurant_id,
    table_id,
    order_number,
    subtotal,
    discount_total,
    tax_total,
    total,
    customer_name,
    kitchen_notes
  )
  values (
    v_order_id,
    v_restaurant_id,
    v_table_id,
    v_order_number,
    v_subtotal,
    0,
    v_tax_total,
    v_total,
    trim(p_customer_name),
    nullif(trim(coalesce(p_kitchen_notes, '')), '')
  );

  insert into public.order_items (
    order_id,
    menu_item_id,
    name_snapshot,
    unit_price,
    quantity,
    notes,
    options,
    total
  )
  select
    v_order_id,
    menu_item_id,
    name_snapshot,
    unit_price,
    quantity,
    notes,
    options,
    total
  from pg_temp.validated_order_items;

  update public.tables
  set status = 'OCCUPIED',
      updated_at = now()
  where id = v_table_id;

  order_id := v_order_id;
  order_number := v_order_number;
  return next;
end;
$$;

grant execute on function public.create_qr_order_transaction(text, text, text, text, jsonb) to anon, authenticated;
