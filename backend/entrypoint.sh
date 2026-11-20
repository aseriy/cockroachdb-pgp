#!/bin/bash

# Exit immediately if a command fails
set -e

# Bake the deployment values into the page before serving it
sed -i \
    -e "s|__SUPABASE_ANON_KEY__|${SUPABASE_ANON_KEY}|g" \
    -e "s|__SUPABASE_URL__|${COCKROACHDB_PGP_DEMO_EXTERNAL_URL}|g" \
    /app/ui/index.html

# Serve the page
exec nginx -g 'daemon off;'
