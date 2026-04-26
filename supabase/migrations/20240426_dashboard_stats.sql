-- ==========================================
-- DASHBOARD SUMMARY TABLES & TRIGGERS
-- ==========================================

-- 1. Create Global Stats Table
CREATE TABLE IF NOT EXISTS public.dashboard_global_stats (
    id INTEGER PRIMARY KEY DEFAULT 1,
    total_revenue NUMERIC(15,2) DEFAULT 0,
    total_transactions INTEGER DEFAULT 0,
    total_products INTEGER DEFAULT 0,
    total_sales INTEGER DEFAULT 0,
    pending_orders INTEGER DEFAULT 0,
    processing_orders INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT one_row_only CHECK (id = 1)
);

-- 2. Create Daily Stats Table
CREATE TABLE IF NOT EXISTS public.dashboard_daily_stats (
    date DATE PRIMARY KEY,
    revenue NUMERIC(15,2) DEFAULT 0,
    transactions INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Initial Seed
INSERT INTO public.dashboard_global_stats (id, total_revenue, total_transactions, total_products, total_sales, pending_orders, processing_orders)
SELECT 
    1,
    COALESCE(SUM(total_price), 0),
    COUNT(*),
    (SELECT COUNT(*) FROM products WHERE is_active = true),
    (SELECT COUNT(*) FROM profiles WHERE role = 'SALES' AND is_active = true),
    (SELECT COUNT(*) FROM transactions WHERE status = 'PENDING'),
    (SELECT COUNT(*) FROM transactions WHERE status = 'PROCESSING')
FROM transactions
WHERE status != 'CANCELLED'
ON CONFLICT (id) DO UPDATE SET
    total_revenue = EXCLUDED.total_revenue,
    total_transactions = EXCLUDED.total_transactions,
    total_products = EXCLUDED.total_products,
    total_sales = EXCLUDED.total_sales,
    pending_orders = EXCLUDED.pending_orders,
    processing_orders = EXCLUDED.processing_orders,
    updated_at = NOW();

-- 4. Trigger Function for Transactions
CREATE OR REPLACE FUNCTION public.handle_transaction_stats_update()
RETURNS TRIGGER AS $$
DECLARE
    today DATE := CURRENT_DATE;
BEGIN
    -- Update Daily Stats
    IF (TG_OP = 'INSERT') THEN
        IF (NEW.status != 'CANCELLED') THEN
            INSERT INTO public.dashboard_daily_stats (date, revenue, transactions)
            VALUES (today, NEW.total_price, 1)
            ON CONFLICT (date) DO UPDATE SET
                revenue = dashboard_daily_stats.revenue + EXCLUDED.revenue,
                transactions = dashboard_daily_stats.transactions + 1,
                updated_at = NOW();
            
            -- Update Global Stats
            UPDATE public.dashboard_global_stats SET
                total_revenue = total_revenue + NEW.total_price,
                total_transactions = total_transactions + 1,
                pending_orders = CASE WHEN NEW.status = 'PENDING' THEN pending_orders + 1 ELSE pending_orders END,
                processing_orders = CASE WHEN NEW.status = 'PROCESSING' THEN processing_orders + 1 ELSE processing_orders END,
                updated_at = NOW()
            WHERE id = 1;
        END IF;
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Handle Status Changes (e.g., PENDING -> PROCESSING, or -> CANCELLED)
        IF (OLD.status != NEW.status) THEN
            -- If cancelled, deduct from global & daily
            IF (NEW.status = 'CANCELLED' AND OLD.status != 'CANCELLED') THEN
                UPDATE public.dashboard_global_stats SET
                    total_revenue = total_revenue - OLD.total_price,
                    total_transactions = total_transactions - 1,
                    pending_orders = CASE WHEN OLD.status = 'PENDING' THEN pending_orders - 1 ELSE pending_orders END,
                    processing_orders = CASE WHEN OLD.status = 'PROCESSING' THEN processing_orders - 1 ELSE processing_orders END,
                    updated_at = NOW()
                WHERE id = 1;

                UPDATE public.dashboard_daily_stats SET
                    revenue = revenue - OLD.total_price,
                    transactions = transactions - 1,
                    updated_at = NOW()
                WHERE date = CAST(OLD.created_at AS DATE);
            
            -- If status changed but not cancelled (e.g. PENDING -> PROCESSING)
            ELSE
                UPDATE public.dashboard_global_stats SET
                    pending_orders = pending_orders + 
                        CASE WHEN NEW.status = 'PENDING' THEN 1 WHEN OLD.status = 'PENDING' THEN -1 ELSE 0 END,
                    processing_orders = processing_orders + 
                        CASE WHEN NEW.status = 'PROCESSING' THEN 1 WHEN OLD.status = 'PROCESSING' THEN -1 ELSE 0 END,
                    updated_at = NOW()
                WHERE id = 1;
            END IF;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger Function for Products/Profiles
CREATE OR REPLACE FUNCTION public.handle_resource_count_update()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_TABLE_NAME = 'products') THEN
        UPDATE public.dashboard_global_stats SET
            total_products = (SELECT COUNT(*) FROM products WHERE is_active = true),
            updated_at = NOW()
        WHERE id = 1;
    ELSIF (TG_TABLE_NAME = 'profiles') THEN
        UPDATE public.dashboard_global_stats SET
            total_sales = (SELECT COUNT(*) FROM profiles WHERE role = 'SALES' AND is_active = true),
            updated_at = NOW()
        WHERE id = 1;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 6. Attach Triggers
DROP TRIGGER IF EXISTS tr_txn_stats ON transactions;
CREATE TRIGGER tr_txn_stats
AFTER INSERT OR UPDATE ON transactions
FOR EACH ROW EXECUTE FUNCTION handle_transaction_stats_update();

DROP TRIGGER IF EXISTS tr_product_count ON products;
CREATE TRIGGER tr_product_count
AFTER INSERT OR UPDATE OR DELETE ON products
FOR EACH ROW EXECUTE FUNCTION handle_resource_count_update();

DROP TRIGGER IF EXISTS tr_profile_count ON profiles;
CREATE TRIGGER tr_profile_count
AFTER INSERT OR UPDATE OR DELETE ON profiles
FOR EACH ROW EXECUTE FUNCTION handle_resource_count_update();
