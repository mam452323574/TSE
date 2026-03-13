# Helper script to deploy the edge function
# Requires Supabase CLI installed and logged in

supabase functions deploy check-and-record-scan --no-verify-jwt

# If the project is not linked, run:
# supabase link --project-ref <your-project-ref>
