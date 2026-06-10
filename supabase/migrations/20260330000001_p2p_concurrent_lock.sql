-- Function to match P2P order with row-level locking
CREATE OR REPLACE FUNCTION match_p2p_order_with_lock(
  p_order_id UUID,
  p_matched_with UUID,
  p_amount_usdc DECIMAL(18, 6),
  p_idempotency_key UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_updated_order RECORD;
BEGIN
  -- Lock the row for update to prevent concurrent modifications
  SELECT * INTO v_order
  FROM p2p_orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;

  IF v_order.status != 'open' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order is no longer available');
  END IF;

  IF v_order.created_by = p_matched_with THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot match own order');
  END IF;

  -- Check for existing match with same user (idempotency)
  IF v_order.matched_with = p_matched_with AND v_order.status = 'matched' THEN
    RETURN jsonb_build_object('success', true, 'message', 'Order already matched', 'order', v_order);
  END IF;

  -- Update the order
  UPDATE p2p_orders
  SET status = 'matched',
      matched_with = p_matched_with,
      matched_at = NOW(),
      amount_usdc = COALESCE(p_amount_usdc, v_order.amount_usdc),
      total_fiat = COALESCE(p_amount_usdc, v_order.amount_usdc) * v_order.price_per_usdc,
      idempotency_key = COALESCE(p_idempotency_key, idempotency_key)
  WHERE id = p_order_id
  RETURNING * INTO v_updated_order;

  RETURN jsonb_build_object('success', true, 'order', v_updated_order);
END;
$$;
