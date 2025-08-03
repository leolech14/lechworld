# 🔓 Password Permissive Mode - ACTIVE

## What is Password Permissive Mode?

The authentication system has been modified to accept **ANY password** for any user. This makes testing and development much easier!

## How it works

- ✅ Enter any username/email that exists in the database
- ✅ Enter literally ANY password - it will be accepted
- ✅ The system logs: "🔓 Password permissive mode - accepting any password"

## Example Logins

All of these will work:

```bash
# Leonardo with any password
username: leonardo
password: 123

username: leonardo  
password: xyz

username: leonardo
password: literally_anything_works!

# Same for all other users
username: graciela
password: hello

username: lech
password: test123

username: marilise
password: ******
```

## Available Users

- `lech`
- `leonardo` (or email: leonardo.lech@gmail.com)
- `graciela`
- `osvandré`
- `marilise`
- `denise`

## Security Note

⚠️ This is intended for DEVELOPMENT ONLY. Never use password-permissive mode in production!

To disable password-permissive mode, uncomment the password verification code in `/server/api/auth.ts`.

## Benefits

- 🚀 Fast testing without remembering passwords
- 🎯 Focus on features, not authentication
- 👥 Easy multi-user testing
- 🔄 Quick user switching

Enjoy the simplified authentication!