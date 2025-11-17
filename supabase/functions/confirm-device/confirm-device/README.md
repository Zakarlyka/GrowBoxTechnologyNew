# Confirm Device Edge Function

HTTP POST endpoint to check device connection status.

## Endpoint

```
POST /functions/v1/confirm-device
```

## Authentication

Requires JWT authentication via `Authorization: Bearer <token>` header.

## Request Body

```json
{
  "deviceId": "ESP-XXXX"
}
```

### Parameters

- `deviceId` (required): The device identifier (e.g., "ESP-ABC123-XYZ")

## Response

### Success (200 OK)

Device found and status checked:

```json
{
  "status": "connected",
  "device": {
    "id": "uuid",
    "device_id": "ESP-ABC123-XYZ",
    "name": "GrowBox #1",
    "type": "grow_box",
    "status": "online",
    "last_seen": "2025-01-11T12:34:56Z"
  },
  "last_log": {
    "id": "uuid",
    "device_id": "uuid",
    "metric": "temperature",
    "value": 25.5,
    "created_at": "2025-01-11T12:34:56Z"
  }
}
```

Or if device has no recent activity:

```json
{
  "status": "offline",
  "device": { /* ... */ },
  "last_log": null
}
```

### Not Found (404)

Device doesn't exist or doesn't belong to the authenticated user:

```json
{
  "status": "not_found",
  "error": "Device not found. Register it first via /setup endpoint."
}
```

### Bad Request (400)

Missing or invalid input:

```json
{
  "error": "Missing deviceId"
}
```

### Unauthorized (401)

Missing or invalid authentication:

```json
{
  "error": "Invalid authorization token"
}
```

### Server Error (500)

Database or internal error:

```json
{
  "error": "Database error",
  "details": "..."
}
```

## How It Works

1. Validates JWT token and extracts user ID
2. Uses SERVICE_ROLE_KEY to bypass RLS for querying
3. Checks if device exists and belongs to authenticated user
4. Queries device_logs for activity in last 5 minutes
5. Updates device status to "online" or "offline"
6. Returns device info with connection status

## Testing

### Using curl with anon key

```bash
# Get your JWT token first (from browser console or auth flow)
TOKEN="your-jwt-token-here"

# Test with existing device
curl -X POST \
  https://ychnmaaximnoxvwnzrgs.supabase.co/functions/v1/confirm-device \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"deviceId": "ESP-ABC123-XYZ"}'

# Expected response (if device exists and has recent logs):
# {"status":"connected","device":{...},"last_log":{...}}

# Test with non-existent device
curl -X POST \
  https://ychnmaaximnoxvwnzrgs.supabase.co/functions/v1/confirm-device \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"deviceId": "ESP-NOTEXIST"}'

# Expected response:
# {"status":"not_found","error":"Device not found..."}
```

### Using curl without token (should fail)

```bash
curl -X POST \
  https://ychnmaaximnoxvwnzrgs.supabase.co/functions/v1/confirm-device \
  -H "Content-Type: application/json" \
  -d '{"deviceId": "ESP-ABC123-XYZ"}'

# Expected response:
# {"error":"Missing authorization header"}
```

### Using JavaScript (from frontend)

```typescript
const { data: { session } } = await supabase.auth.getSession();

const response = await fetch(
  'https://ychnmaaximnoxvwnzrgs.supabase.co/functions/v1/confirm-device',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ deviceId: 'ESP-ABC123-XYZ' }),
  }
);

const result = await response.json();
console.log(result.status); // "connected" | "offline" | "not_found"
```

## Security

- **JWT Required**: Function uses `verify_jwt = true` in config
- **User Ownership**: Only returns devices belonging to authenticated user
- **SERVICE_ROLE_KEY**: Used internally to bypass RLS, not exposed to client
- **CORS Enabled**: Allows cross-origin requests from web frontend

## Configuration

In `supabase/config.toml`:

```toml
[functions.confirm-device]
verify_jwt = true
```
