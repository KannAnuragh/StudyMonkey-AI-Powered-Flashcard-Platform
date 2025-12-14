## Troubleshooting: "Import failed" Error

### Step 1: Check Authentication
Open Browser Console (F12) and run:
```javascript
localStorage.getItem('token')
```
- If it returns `null`, you need to log in again
- If it returns a token, continue to Step 2

### Step 2: Verify Backend is Running
Open a new PowerShell terminal:
```powershell
curl http://localhost:4000/auth/signup -Method POST -Body '{"email":"test@test.com","password":"test123"}' -ContentType "application/json"
```
- Should return user data with a token
- If it fails, backend is not running or has an error

### Step 3: Test Import Endpoint Directly
After logging in, get your token and test:
```powershell
$token = "YOUR_TOKEN_HERE"
$headers = @{
    "Authorization" = "Bearer $token"
}

# Test if endpoint exists
Invoke-WebRequest -Uri "http://localhost:4000/import/file" -Method POST -Headers $headers
```

### Step 4: Check Backend Logs
In your backend terminal, you should see:
```
[Nest] LOG [RouterExplorer] Mapped {/import/file, POST} route
```

### Step 5: Common Issues

**Issue: CORS Error**
- Make sure backend has CORS enabled for http://localhost:3000
- Check `main.ts` for `app.enableCors()`

**Issue: 401 Unauthorized**
- Log out and log back in
- Clear localStorage: `localStorage.clear()`
- Refresh the page

**Issue: Multer not configured**
- Backend needs `@nestjs/platform-express` installed
- Check if FileInterceptor is properly configured

**Issue: deckId is wrong**
- Make sure you're on the cards page of a valid deck
- URL should be: `/decks/[some-uuid]/cards`

### Quick Fix Steps:
1. Stop all processes
2. Clear browser localStorage
3. Restart backend: `cd backend && npm run start:dev`
4. Restart frontend: `cd frontend && npm run dev`
5. Sign up with a new account
6. Create a new deck
7. Try uploading a PDF

### Debug Mode:
Open `frontend/lib/api.ts` and add logging:
```typescript
api.interceptors.request.use((config) => {
  console.log('[API] Request:', config.method?.toUpperCase(), config.url);
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    console.log('[API] Token exists:', !!token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});
```

This will show you every API request being made.
