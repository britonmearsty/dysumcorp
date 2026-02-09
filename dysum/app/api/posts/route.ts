import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "../../generated/prisma";

const prisma = new PrismaClient();

// Generate a URL-friendly slug from a title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

// Calculate reading time based on HTML content
function calculateReadingTime(htmlContent: string): number {
  const wordsPerMinute = 200;
  const plainText = htmlContent.replace(/<[^>]*>/g, ""); // Strip HTML tags
  const wordCount = plainText
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

// GET /api/posts - Get all blog posts or filter by published status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const published = searchParams.get("published");
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

    const whereClause =
      published !== null ? { published: published === "true" } : {};

    const posts = await prisma.blogPost.findMany({
      where: whereClause,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit ? parseInt(limit) : undefined,
      skip: offset ? parseInt(offset) : undefined,
    });

    return NextResponse.json({
      success: true,
      posts,
      count: posts.length,
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch posts" },
      { status: 500 },
    );
  }
}

// POST /api/posts - Create a new blog post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      htmlContent,
      cssContent,
      excerpt,
      thumbnailUrl,
      tags = [],
      published = false,
      authorId,
    } = body;

    // Validate required fields
    if (!title || !htmlContent || !authorId) {
      return NextResponse.json(
        {
          success: false,
          error: "Title, HTML content, and author ID are required",
        },
        { status: 400 },
      );
    }

    // Generate slug and ensure it's unique
    let slug = generateSlug(title);
    const existingPost = await prisma.blogPost.findUnique({
      where: { slug },
    });

    if (existingPost) {
      // Make slug unique by appending a number
      let counter = 1;
      let uniqueSlug = `${slug}-${counter}`;

      while (
        await prisma.blogPost.findUnique({ where: { slug: uniqueSlug } })
      ) {
        counter++;
        uniqueSlug = `${slug}-${counter}`;
      }

      slug = uniqueSlug;
    }

    // Calculate reading time
    const readingTime = calculateReadingTime(htmlContent);

    // Create the blog post
    const post = await prisma.blogPost.create({
      data: {
        title,
        slug,
        htmlContent,
        cssContent,
        excerpt,
        thumbnailUrl,
        tags,
        published,
        readingTime,
        authorId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        post,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create post" },
      { status: 500 },
    );
  }
}

// PUT /api/posts - Update a blog post
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      title,
      htmlContent,
      cssContent,
      excerpt,
      thumbnailUrl,
      tags = [],
      published = false,
    } = body;

    // Validate required fields
    if (!id || !title || !htmlContent) {
      return NextResponse.json(
        {
          success: false,
          error: "Post ID, title, and HTML content are required",
        },
        { status: 400 },
      );
    }

    // Check if post exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 },
      );
    }

    // Generate new slug if title changed
    let slug = existingPost.slug;
    if (title !== existingPost.title) {
      slug = generateSlug(title);

      // Ensure slug is unique (excluding current post)
      const existingSlugPost = await prisma.blogPost.findUnique({
        where: { slug },
      });

      if (existingSlugPost && existingSlugPost.id !== id) {
        let counter = 1;
        let uniqueSlug = `${slug}-${counter}`;

        while (true) {
          const conflictPost = await prisma.blogPost.findUnique({
            where: { slug: uniqueSlug },
          });

          if (!conflictPost || conflictPost.id === id) {
            break;
          }

          counter++;
          uniqueSlug = `${slug}-${counter}`;
        }

        slug = uniqueSlug;
      }
    }

    // Calculate reading time
    const readingTime = calculateReadingTime(htmlContent);

    // Update the blog post
    const updatedPost = await prisma.blogPost.update({
      where: { id },
      data: {
        title,
        slug,
        htmlContent,
        cssContent,
        excerpt,
        thumbnailUrl,
        tags,
        published,
        readingTime,
        updatedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      post: updatedPost,
    });
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update post" },
      { status: 500 },
    );
  }
}

// DELETE /api/posts - Delete a blog post
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Post ID is required" },
        { status: 400 },
      );
    }

    // Check if post exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 },
      );
    }

    // Delete the blog post
    await prisma.blogPost.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete post" },
      { status: 500 },
    );
  }
}
