# One codebase, two stores

Deploy the same repository twice with separate variables.

## BB STORE
```env
VITE_STORE_ID=bb
SUPABASE_URL=https://<bb-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<bb-service-role-key>
```

## ST STORE
```env
VITE_STORE_ID=st
SUPABASE_URL=https://<st-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<st-service-role-key>
```

Browser settings use separate localStorage namespaces: `bb-store:*` and `st-store:*`.
