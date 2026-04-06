# BannerOS Client Script

A self-contained Node.js CLI that lets you operate BannerOS directly — no MCP required. Requires Node.js 18+ (uses built-in `fetch`). Zero dependencies.

## Location

```
scripts/banneros-client.js
```

## Running the script

```bash
node scripts/banneros-client.js <command> [options-as-json]
```

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BANNEROS_API_URL` | `http://localhost:3001` | BannerOS API base URL |
| `BANNEROS_TENANT` | `default` | Tenant ID for all operations |

## Commands

### Health & validation

```bash
# Check if the API is running
node scripts/banneros-client.js health

# Validate all banner configurations
node scripts/banneros-client.js validate
```

### Banner management

```bash
# List all banners
node scripts/banneros-client.js list-banners

# Filter by status or type
node scripts/banneros-client.js list-banners '{"status":"active","type":"promotional"}'

# Get a specific banner
node scripts/banneros-client.js get-banner '{"id":"banner-uuid"}'

# Create a banner
node scripts/banneros-client.js create-banner '{"title":"Summer Sale","body":"30% off all plans","type":"promotional","priority":100,"targeting_rules":{"platforms":["web"],"countries":["US"]}}'

# Update a banner
node scripts/banneros-client.js update-banner '{"id":"banner-uuid","title":"Updated Title","priority":150}'

# Delete a banner
node scripts/banneros-client.js delete-banner '{"id":"banner-uuid"}'
```

### Evaluate banners for a user

```bash
# Basic evaluation
node scripts/banneros-client.js evaluate

# With full user context
node scripts/banneros-client.js evaluate '{"user_id":"user-123","context":{"platform":"web","page_path":"/home","segment":"free","country":"US","is_authenticated":true}}'
```

### Impression tracking

```bash
# Record a view
node scripts/banneros-client.js impression '{"banner_id":"banner-uuid","action":"view","user_id":"user-123"}'

# Record a click
node scripts/banneros-client.js impression '{"banner_id":"banner-uuid","action":"click","user_id":"user-123"}'

# Dismiss a banner for a user
node scripts/banneros-client.js dismiss '{"banner_id":"banner-uuid","user_id":"user-123"}'
```

### Statistics

```bash
# Get aggregate stats for all banners in the tenant
node scripts/banneros-client.js tenant-stats

# Get detailed stats for a specific banner (views, clicks, CTR, daily breakdown)
node scripts/banneros-client.js banner-stats '{"banner_id":"banner-uuid"}'

# Legacy: get stats (all banners or specific)
node scripts/banneros-client.js stats
node scripts/banneros-client.js stats '{"banner_id":"banner-uuid"}'
```

### Tenant configuration

```bash
# Get current tenant config
node scripts/banneros-client.js get-tenant

# Update tenant config
node scripts/banneros-client.js update-tenant '{"config":{"maxBannersPerPage":5,"allowPromotional":true,"allowSupport":true,"allowInformational":true}}'
```

## Agent usage

When an agent has this skill installed, it can run the client script directly to:

1. **Check platform health** before writing integration code
2. **List existing banners** to understand what content is configured
3. **Create test banners** for development and verification
4. **Evaluate banners** with specific user contexts to test targeting rules
5. **View stats** to verify impression tracking is working
6. **Configure the tenant** to adjust platform settings

The agent does NOT need MCP support to use these capabilities — it just runs the script with `node`.

## Output format

All commands output JSON to stdout. Errors output JSON with an `error` field to stderr with exit code 1.

```json
// Success
{ "banners": [...], "count": 3 }

// Error
{ "error": "Required: banner_id, action (view|click|dismiss)" }
```
