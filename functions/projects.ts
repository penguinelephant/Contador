import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

interface CreateProjectRequest {
  client_name: string;
  title: string;
  total_amount: number;
  payment_terms: string;
  milestones?: Array<{
    description: string;
    amount: number;
    due_date: string; // ISO date string
  }>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
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

    if (req.method === "POST") {
      // Parse the request body
      const requestBody = await req.json();
      
      // Validate required fields
      if (
        !requestBody.client_name ||
        !requestBody.title ||
        typeof requestBody.total_amount !== 'number' ||
        !requestBody.payment_terms
      ) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Validate milestones if provided
      if (requestBody.milestones && Array.isArray(requestBody.milestones)) {
        for (const milestone of requestBody.milestones) {
          if (
            typeof milestone.description !== 'string' ||
            typeof milestone.amount !== 'number' ||
            !milestone.due_date
          ) {
            return new Response(JSON.stringify({ error: "Invalid milestone format" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }
        }
      }

      // Create the project
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert([
          {
            user_id: userId,
            client_name: requestBody.client_name,
            title: requestBody.title,
            total_amount: requestBody.total_amount,
            payment_terms: requestBody.payment_terms,
          },
        ])
        .select()
        .single();

      if (projectError) {
        throw new Error(`Database error: ${projectError.message}`);
      }

      // Create milestones if provided
      if (requestBody.milestones && requestBody.milestones.length > 0) {
        const milestonesToInsert = requestBody.milestones.map((milestone: any) => ({
          project_id: project.id,
          description: milestone.description,
          amount: milestone.amount,
          due_date: milestone.due_date,
          status: 'pending',
        }));

        const { error: milestonesError } = await supabase
          .from("milestones")
          .insert(milestonesToInsert);

        if (milestonesError) {
          throw new Error(`Database error creating milestones: ${milestonesError.message}`);
        }
      }

      return new Response(JSON.stringify({ 
        success: true, 
        project: {
          id: project.id,
          user_id: project.user_id,
          client_name: project.client_name,
          title: project.title,
          total_amount: project.total_amount,
          payment_terms: project.payment_terms,
          created_at: project.created_at,
        },
        message: "Project created successfully"
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
    console.error("Error in projects function:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});