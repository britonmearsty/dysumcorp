# Authentication Setup with Better Auth + Prisma

This project uses Better Auth with Prisma for authentication. Better Auth is a modern authentication library that provides a simple and secure way to handle user authentication in Next.js applications.

## Features

- 🔐 Email/Password authentication
- 🚀 Social login (GitHub, Google)
- 📱 Session management
- 🎯 Type-safe API
- 🔄 Automatic session refresh
- 💾 Prisma integration with PostgreSQL
- ⚡ Performance optimized with database joins

## Setup

### 1. Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/dysum"

# Better Auth
BETTER_AUTH_SECRET="your-secret-key-here" # Generate with: openssl rand -base64 32
BETTER_AUTH_URL="http://localhost:3000" # Your app URL

# GitHub OAuth (optional)
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 2. Database Setup

The Prisma schema includes the following authentication models:

- `User` - User accounts
- `Account` - OAuth account connections
- `Session` - User sessions
- `VerificationToken` - Email verification tokens

Run the database commands:

```bash
# Generate Prisma client
pnpm run db:generate

# Push schema to database
pnpm run db:push

# Or create and run migrations
pnpm run db:migrate
```

### 3. OAuth Setup (Optional)

#### GitHub OAuth

1. Go to GitHub → Settings → Developer settings → OAuth Apps
2. Create a new OAuth App with:
   - Application name: `Dysum`
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
3. Copy the Client ID and Client Secret to your `.env.local`

#### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Create OAuth 2.0 credentials with:
   - Authorized origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
5. Copy the Client ID and Client Secret to your `.env.local`

## Usage

### Server-side Authentication

```typescript
import { auth } from "@/lib/auth";

// Get session on the server
const session = await auth.api.getSession({
  headers: request.headers,
});

if (!session) {
  // User is not authenticated
  return redirect("/login");
}

// Access user data
console.log(session.user.id);
console.log(session.user.email);
```

### Client-side Authentication

The project includes React hooks for client-side authentication:

```tsx
import { useSession, signIn, signOut } from "@/lib/auth-client";

function MyComponent() {
  const { data: session, isLoading } = useSession();

  if (isLoading) return <div>Loading...</div>;

  if (!session) {
    return (
      <div>
        <button onClick={() => signIn("github")}>Sign in with GitHub</button>
        <button onClick={() => signIn("google")}>Sign in with Google</button>
      </div>
    );
  }

  return (
    <div>
      <p>Welcome, {session.user.name}!</p>
      <button onClick={() => signOut()}>Sign out</button>
    </div>
  );
}
```

### Protecting Routes

#### API Routes

```typescript
import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Protected API logic here
  return Response.json({ user: session.user });
}
```

#### Page Components

```tsx
"use client";
import { useSession } from "@/lib/auth-client";
import { redirect } from "next/navigation";

export default function ProtectedPage() {
  const { data: session, isLoading } = useSession();

  if (isLoading) return <div>Loading...</div>;

  if (!session) {
    redirect("/");
  }

  return <div>Protected content for {session.user.email}</div>;
}
```

## Available Scripts

- `pnpm run db:generate` - Generate Prisma client
- `pnpm run db:push` - Push schema changes to database
- `pnpm run db:migrate` - Create and run database migrations
- `pnpm run db:studio` - Open Prisma Studio (database GUI)
- `pnpm run auth:generate` - Generate Better Auth schema (if needed)

## API Endpoints

Better Auth automatically creates the following endpoints:

- `POST /api/auth/sign-in/email` - Email/password sign in
- `POST /api/auth/sign-up/email` - Email/password sign up
- `GET /api/auth/sign-in/github` - GitHub OAuth sign in
- `GET /api/auth/sign-in/google` - Google OAuth sign in
- `POST /api/auth/sign-out` - Sign out
- `GET /api/auth/session` - Get current session
- And many more...

## Type Safety

The authentication setup provides full type safety:

```typescript
import type { Session, User } from "@/lib/auth";

// Session and User types are automatically inferred
function handleUser(user: User) {
  // user.id, user.email, user.name are all properly typed
}
```

## Performance

The setup includes several performance optimizations:

- **Database Joins**: Enabled with `experimental.joins: true` for 2-3x performance improvement
- **Session Caching**: Automatic session caching and refresh
- **Type-safe Queries**: Prisma provides efficient, type-safe database queries

## Security Features

- **CSRF Protection**: Built-in CSRF protection
- **Secure Sessions**: HTTP-only cookies with secure defaults
- **Password Hashing**: Automatic secure password hashing
- **Session Rotation**: Automatic session token rotation
- **Rate Limiting**: Built-in rate limiting for auth endpoints

## Troubleshooting

### Common Issues

1. **"Cannot find module '../generated/prisma'"**
   - Run `pnpm run db:generate` to generate the Prisma client

2. **"Invalid session"**
   - Check that `BETTER_AUTH_SECRET` is set in your environment variables

3. **OAuth callback errors**
   - Verify your OAuth app settings and callback URLs

4. **Database connection errors**
   - Check your `DATABASE_URL` environment variable
   - Ensure your PostgreSQL database is running

### Debug Mode

Enable debug logging by adding to your `.env.local`:

```env
DEBUG=better-auth:*
```

## Migration from Other Auth Libraries

If migrating from NextAuth.js or other authentication libraries, you may need to:

1. Update your database schema to match Better Auth's requirements
2. Migrate existing user data
3. Update your authentication logic to use Better Auth's API

Refer to the [Better Auth documentation](https://better-auth.dev) for detailed migration guides.