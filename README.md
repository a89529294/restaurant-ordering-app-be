hosted on [render](https://dashboard.render.com/web/srv-cura1ll2ng1s73efg940/deploys/dep-cura1lt2ng1s73efg960)

## local https

```bash
mkcert -install
mkdir certs
cd certs
mkcert localhost
```

check end of `index.ts` to see how to enable https

## cookie settings

Have to use sameSite=None in conjunction with Secure; otherwise browsers will ignore the cookie. This is why we need to set up local https.

The reason we need to send cookies cross domains is because our frontend and backend is hosted on different domains.

Finally, remember to include `credentials: 'include'`, on both the backend response and frontend requests.

## supabase updated_at auto update

-- Add new columns to table named `created_at` and `updated_at`
ALTER TABLE YOUR_TABLE_NAME
ADD COLUMN created_at timestamptz default now(),
ADD COLUMN updated_at timestamptz;

-- Enable MODDATETIME extension
create extension if not exists moddatetime schema extensions;

-- This will set the `updated_at` column on every update
create trigger handle_updated_at before update on YOUR_TABLE_NAME
for each row execute procedure moddatetime (updated_at);
