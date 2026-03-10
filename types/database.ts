export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      admin_profiles: {
        Row: {
          id: string;
          restaurant_id: string | null;
          full_name: string | null;
          role: string | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          restaurant_id?: string | null;
          full_name?: string | null;
          role?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          restaurant_id?: string | null;
          full_name?: string | null;
          role?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "admin_profiles_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          }
        ];
      };
      daily_expenses: {
        Row: {
          id: string;
          restaurant_id: string;
          expense_date: string;
          category: string;
          amount: number;
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          expense_date: string;
          category: string;
          amount: number;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          expense_date?: string;
          category?: string;
          amount?: number;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "daily_expenses_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          }
        ];
      };
      daily_sales: {
        Row: {
          id: string;
          restaurant_id: string;
          sales_date: string;
          sales_amount: number;
          source: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          sales_date: string;
          sales_amount: number;
          source?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          sales_date?: string;
          sales_amount?: number;
          source?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "daily_sales_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          }
        ];
      };
      daily_stock_counts: {
        Row: {
          id: string;
          restaurant_id: string;
          inventory_item_id: string;
          count_date: string;
          closing_quantity: number;
          waste_quantity: number;
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          inventory_item_id: string;
          count_date: string;
          closing_quantity: number;
          waste_quantity?: number;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          inventory_item_id?: string;
          count_date?: string;
          closing_quantity?: number;
          waste_quantity?: number;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "daily_stock_counts_inventory_item_id_fkey";
            columns: ["inventory_item_id"];
            isOneToOne: false;
            referencedRelation: "inventory_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "daily_stock_counts_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          }
        ];
      };
      inventory_categories: {
        Row: {
          id: string;
          restaurant_id: string;
          name: string;
          sort_order: number | null;
          active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          name: string;
          sort_order?: number | null;
          active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          name?: string;
          sort_order?: number | null;
          active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_categories_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          }
        ];
      };
      inventory_items: {
        Row: {
          id: string;
          restaurant_id: string;
          category_id: string | null;
          name: string;
          unit: string;
          current_quantity: number;
          min_quantity: number;
          average_unit_cost: number;
          supplier_name: string | null;
          active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          category_id?: string | null;
          name: string;
          unit: string;
          current_quantity?: number;
          min_quantity?: number;
          average_unit_cost?: number;
          supplier_name?: string | null;
          active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          category_id?: string | null;
          name?: string;
          unit?: string;
          current_quantity?: number;
          min_quantity?: number;
          average_unit_cost?: number;
          supplier_name?: string | null;
          active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_items_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "inventory_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_items_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          }
        ];
      };
      inventory_movements: {
        Row: {
          id: string;
          restaurant_id: string;
          inventory_item_id: string;
          movement_type: "purchase" | "usage" | "waste" | "adjustment";
          quantity: number;
          unit_cost: number | null;
          total_cost: number | null;
          note: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          inventory_item_id: string;
          movement_type: "purchase" | "usage" | "waste" | "adjustment";
          quantity: number;
          unit_cost?: number | null;
          total_cost?: number | null;
          note?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          inventory_item_id?: string;
          movement_type?: "purchase" | "usage" | "waste" | "adjustment";
          quantity?: number;
          unit_cost?: number | null;
          total_cost?: number | null;
          note?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_movements_inventory_item_id_fkey";
            columns: ["inventory_item_id"];
            isOneToOne: false;
            referencedRelation: "inventory_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_movements_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          }
        ];
      };
      payroll_records: {
        Row: {
          id: string;
          staff_id: string;
          restaurant_id: string;
          period_start: string;
          period_end: string;
          base_salary: number;
          advances_total: number;
          other_deductions: number;
          tax_deduction: number;
          net_payable: number;
          payment_status: "pending" | "paid";
          payment_date: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          staff_id: string;
          restaurant_id: string;
          period_start: string;
          period_end: string;
          base_salary?: number;
          advances_total?: number;
          other_deductions?: number;
          tax_deduction?: number;
          net_payable?: number;
          payment_status?: "pending" | "paid";
          payment_date?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          staff_id?: string;
          restaurant_id?: string;
          period_start?: string;
          period_end?: string;
          base_salary?: number;
          advances_total?: number;
          other_deductions?: number;
          tax_deduction?: number;
          net_payable?: number;
          payment_status?: "pending" | "paid";
          payment_date?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "payroll_records_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payroll_records_staff_id_fkey";
            columns: ["staff_id"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          }
        ];
      };
      purchases: {
        Row: {
          id: string;
          restaurant_id: string;
          inventory_item_id: string;
          supplier_name: string | null;
          quantity: number;
          unit_cost: number;
          total_cost: number;
          purchase_date: string;
          note: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          inventory_item_id: string;
          supplier_name?: string | null;
          quantity: number;
          unit_cost: number;
          total_cost: number;
          purchase_date: string;
          note?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          inventory_item_id?: string;
          supplier_name?: string | null;
          quantity?: number;
          unit_cost?: number;
          total_cost?: number;
          purchase_date?: string;
          note?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "purchases_inventory_item_id_fkey";
            columns: ["inventory_item_id"];
            isOneToOne: false;
            referencedRelation: "inventory_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "purchases_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          }
        ];
      };
      restaurants: {
        Row: {
          id: string;
          name: string;
          slug: string;
          phone: string | null;
          address: string | null;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          phone?: string | null;
          address?: string | null;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          phone?: string | null;
          address?: string | null;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      staff: {
        Row: {
          id: string;
          restaurant_id: string;
          full_name: string;
          role: string;
          phone: string | null;
          salary_type: "monthly" | "weekly" | "daily";
          base_salary: number;
          start_date: string | null;
          is_active: boolean | null;
          notes: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          full_name: string;
          role: string;
          phone?: string | null;
          salary_type?: "monthly" | "weekly" | "daily";
          base_salary?: number;
          start_date?: string | null;
          is_active?: boolean | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          full_name?: string;
          role?: string;
          phone?: string | null;
          salary_type?: "monthly" | "weekly" | "daily";
          base_salary?: number;
          start_date?: string | null;
          is_active?: boolean | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "staff_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          }
        ];
      };
      staff_advances: {
        Row: {
          id: string;
          staff_id: string;
          restaurant_id: string;
          advance_date: string;
          amount: number;
          note: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          staff_id: string;
          restaurant_id: string;
          advance_date: string;
          amount: number;
          note?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          staff_id?: string;
          restaurant_id?: string;
          advance_date?: string;
          amount?: number;
          note?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "staff_advances_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "staff_advances_staff_id_fkey";
            columns: ["staff_id"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_restaurant_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      current_user_role: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      is_admin_user: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
