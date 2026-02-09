# Dysum - Modern Blog Platform

A modern blog platform built with Next.js 14, Prisma, PostgreSQL, and Cloudinary. Dysum allows administrators to create blog posts by pasting HTML content, adding custom CSS styling, and uploading thumbnail images.

## Features

- **HTML/CSS Blog Posts**: Create blog posts by pasting HTML content and custom CSS styling
- **Cloudinary Integration**: Upload and manage thumbnail images with automatic optimization
- **Database-Driven**: PostgreSQL database with Prisma ORM for reliable data storage
- **Authentication**: Built-in authentication system with Better Auth
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **SEO Friendly**: Clean URLs and meta tags for better search engine optimization
- **Security**: HTML sanitization and CSS scoping for safe content rendering

## How It Works

### For Administrators

1. **Create a New Post**: Navigate to `/create` to start creating a new blog post
2. **Add Content**: 
   - Enter a compelling title
   - Paste your HTML content directly into the HTML textarea
   - Add custom CSS styling (optional) that will be scoped to your post
   - Upload a thumbnail image that will be optimized and hosted on Cloudinary
   - Add tags and an excerpt
3. **Preview**: See a live preview of your post as you type
4. **Publish**: Choose to save as draft or publish immediately

### Content Structure

- **HTML Content**: Full HTML content that will be sanitized for security
- **CSS Styling**: Custom CSS that gets scoped to prevent conflicts with other posts
- **Thumbnail Images**: Uploaded to Cloudinary with automatic optimization
- **Metadata**: Title, excerpt, tags, reading time (auto-calculated)

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS
- **Image Management**: Cloudinary
- **Authentication**: Better Auth
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Cloudinary account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dysum
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/dysum"
   CLOUDINARY_CLOUD_NAME="your_cloud_name"
   CLOUDINARY_API_KEY="your_api_key"
   CLOUDINARY_API_SECRET="your_api_secret"
   BETTER_AUTH_SECRET="your_secret_key_here"
   BETTER_AUTH_URL="http://localhost:3000"
   ```

4. **Set up the database**
   ```bash
   pnpm db:migrate
   pnpm db:generate
   ```

5. **Start the development server**
   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

### BlogPost Model
- `id`: Unique identifier
- `title`: Blog post title
- `slug`: URL-friendly version of the title
- `htmlContent`: The main HTML content of the post
- `cssContent`: Custom CSS styling (optional)
- `excerpt`: Brief summary of the post
- `thumbnailUrl`: Cloudinary URL of the thumbnail image
- `tags`: Array of tags for categorization
- `published`: Publication status
- `readingTime`: Estimated reading time in minutes
- `authorId`: Reference to the author (User)
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

## API Endpoints

### Posts
- `GET /api/posts` - Get all posts (with filtering)
- `POST /api/posts` - Create a new post
- `PUT /api/posts` - Update an existing post
- `DELETE /api/posts?id=<postId>` - Delete a post
- `GET /api/posts/[slug]` - Get a specific post by slug

### File Upload
- `POST /api/upload` - Upload image to Cloudinary
- `DELETE /api/upload?publicId=<publicId>` - Delete image from Cloudinary

## Security Features

1. **HTML Sanitization**: All HTML content is sanitized to remove script tags and event handlers
2. **CSS Scoping**: Custom CSS is scoped to individual posts to prevent global style conflicts
3. **File Validation**: Image uploads are validated for type and size
4. **Authentication**: Protected routes for admin functions

## Development

### Database Commands
```bash
# Generate Prisma client
pnpm db:generate

# Push schema changes to database
pnpm db:push

# Create and run migrations
pnpm db:migrate

# Open Prisma Studio
pnpm db:studio
```

### Project Structure
```
dysum/
├── app/
│   ├── api/           # API routes
│   ├── components/    # React components
│   ├── create/        # Post creation page
│   ├── lib/           # Utility functions
│   ├── post/          # Post display pages
│   └── types/         # TypeScript type definitions
├── prisma/
│   └── schema.prisma  # Database schema
└── public/            # Static assets
```

## Deployment

### Environment Setup
1. Set up a PostgreSQL database (e.g., Supabase, Railway, or Neon)
2. Create a Cloudinary account and get your credentials
3. Deploy to Vercel, Netlify, or your preferred platform
4. Set up environment variables in your deployment platform
5. Run database migrations in production

### Production Considerations
- Use a production PostgreSQL database
- Configure proper CORS settings
- Set up proper authentication flows
- Monitor Cloudinary usage and quotas
- Implement proper error logging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please use the GitHub issues page or contact the development team.