import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
      },
    });
  }

  try {
    // Get the authenticated user ID from the Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing or invalid authorization header" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Extract the token
    const token = authHeader.substring(7);
    
    // Get user info using the token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    if (req.method === "GET") {
      // Calculate start and end of current month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const endOfMonth = new Date(startOfMonth);
      endOfMonth.setMonth(startOfMonth.getMonth() + 1);
      endOfMonth.setDate(0); // Last day of the month
      endOfMonth.setHours(23, 59, 59, 999);

      // Calculate MTD Income (sum of paid milestones for the current month)
      const { data: mtdIncomeData, error: incomeError } = await supabase
        .from("milestones")
        .select("amount")
        .eq("status", "paid")
        .gte("paid_at", startOfMonth.toISOString())
        .lte("paid_at", endOfMonth.toISOString());

      if (incomeError) {
        throw new Error(`Database error fetching income: ${incomeError.message}`);
      }

      const mtdIncome = mtdIncomeData?.reduce((sum, milestone) => sum + milestone.amount, 0) || 0;

      // Calculate payment status counts
      const now = new Date();
      const sevenDaysFromNow = new Date(now);
      sevenDaysFromNow.setDate(now.getDate() + 7);

      // Count paid milestones
      const { count: paidCount, error: paidError } = await supabase
        .from("milestones")
        .select("*", { count: "exact" })
        .eq("status", "paid");

      if (paidError) {
        throw new Error(`Database error counting paid milestones: ${paidError.message}`);
      }

      // Count due soon milestones (pending and due within 7 days)
      const { count: dueSoonCount, error: dueSoonError } = await supabase
        .from("milestones")
        .select("*", { count: "exact" })
        .eq("status", "pending")
        .gte("due_date", now.toISOString())
        .lte("due_date", sevenDaysFromNow.toISOString());

      if (dueSoonError) {
        throw new Error(`Database error counting due soon milestones: ${dueSoonError.message}`);
      }

      // Count overdue milestones
      const { count: overdueCount, error: overdueError } = await supabase
        .from("milestones")
        .select("*", { count: "exact" })
        .eq("status", "pending")
        .lt("due_date", now.toISOString());

      if (overdueError) {
        throw new Error(`Database error counting overdue milestones: ${overdueError.message}`);
      }

      const paymentStatus = {
        paid: paidCount || 0,
        dueSoon: dueSoonCount || 0,
        overdue: overdueCount || 0,
      };

      // Calculate MTD Expenses (sum of expenses for the current month)
      const { data: mtdExpensesData, error: expensesError } = await supabase
        .from("expenses")
        .select("amount")
        .eq("user_id", userId)
        .gte("date", startOfMonth.toISOString())
        .lte("date", endOfMonth.toISOString());

      if (expensesError) {
        throw new Error(`Database error fetching expenses: ${expensesError.message}`);
      }

      const mtdExpenses = mtdExpensesData?.reduce((sum, expense) => sum + expense.amount, 0) || 0;

      // Calculate tax saved (simplified as 30% of MTD expenses)
      const taxSaved = mtdExpenses * 0.3;

      return new Response(JSON.stringify({
        mtd_income: mtdIncome,
        payment_status: paymentStatus,
        mtd_expenses: mtdExpenses,
        tax_saved: taxSaved,
      }), {
        headers: { "Content-Type": "application/json" },
      });
    } else {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error: any) {
    console.error("Error in dashboard function:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});