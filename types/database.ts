export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      staff: { Row: { id: string; restaurant_id: string; full_name: string; role: string; phone: string | null; salary_type: "monthly" | "weekly" | "daily"; base_salary: number; start_date: string | null; is_active: boolean; notes: string | null; created_at: string; updated_at: string } };
      staff_advances: { Row: { id: string; staff_id: string; restaurant_id: string; advance_date: string; amount: number; note: string | null; created_at: string } };
      payroll_records: { Row: { id: string; staff_id: string; restaurant_id: string; period_start: string; period_end: string; base_salary: number; advances_total: number; other_deductions: number; tax_deduction: number; net_payable: number; payment_status: "pending" | "paid"; payment_date: string | null; created_at: string; updated_at: string } };
      inventory_items: { Row: { id: string; restaurant_id: string; category_id: string | null; name: string; unit: string; current_quantity: number; min_quantity: number; average_unit_cost: number; supplier_name: string | null; active: boolean; created_at: string; updated_at: string } };
      inventory_categories: { Row: { id: string; restaurant_id: string; name: string; sort_order: number; active: boolean; created_at: string; updated_at: string } };
      inventory_movements: { Row: { id: string; restaurant_id: string; inventory_item_id: string; movement_type: "purchase" | "usage" | "waste" | "adjustment"; quantity: number; unit_cost: number | null; total_cost: number | null; note: string | null; created_at: string } };
      purchases: { Row: { id: string; restaurant_id: string; inventory_item_id: string; supplier_name: string | null; quantity: number; unit_cost: number; total_cost: number; purchase_date: string; note: string | null; created_at: string; updated_at: string } };
      daily_sales: { Row: { id: string; restaurant_id: string; sales_date: string; sales_amount: number; source: string | null; notes: string | null; created_at: string; updated_at: string } };
      daily_expenses: { Row: { id: string; restaurant_id: string; expense_date: string; category: string; amount: number; note: string | null; created_at: string; updated_at: string } };
      restaurants: { Row: { id: string; name: string; slug: string; phone: string | null; address: string | null; currency: string; created_at: string; updated_at: string } };
    };
  };
};
