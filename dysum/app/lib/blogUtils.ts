import { BlogPost, BlogPostFormData } from "../types";

// Generate a URL-friendly slug from a title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

// Calculate reading time based on HTML content
export function calculateReadingTime(htmlContent: string): number {
  const wordsPerMinute = 200;
  const plainText = htmlContent.replace(/<[^>]*>/g, ""); // Strip HTML tags
  const wordCount = plainText
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  return Math.ceil(wordCount / wordsPerMinute);
}

// Generate excerpt from HTML content
export function generateExcerpt(
  htmlContent: string,
  maxLength: number = 160,
): string {
  const plainText = htmlContent.replace(/<[^>]*>/g, "").trim();

  if (plainText.length <= maxLength) {
    return plainText;
  }

  const truncated = plainText.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");

  return lastSpace > 0
    ? truncated.substring(0, lastSpace) + "..."
    : truncated + "...";
}

// Upload image to Cloudinary
export async function uploadImage(file: File): Promise<{
  success: boolean;
  url?: string;
  publicId?: string;
  error?: string;
}> {
  try {
    const formData = new FormData();

    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    return result;
  } catch (error) {
    console.error("Error uploading image:", error);

    return {
      success: false,
      error: "Failed to upload image",
    };
  }
}

// Delete image from Cloudinary
export async function deleteImage(
  publicId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      `/api/upload?publicId=${encodeURIComponent(publicId)}`,
      {
        method: "DELETE",
      },
    );

    const result = await response.json();

    return result;
  } catch (error) {
    console.error("Error deleting image:", error);

    return {
      success: false,
      error: "Failed to delete image",
    };
  }
}

// Get all blog posts
export async function getBlogPosts(published?: boolean): Promise<BlogPost[]> {
  try {
    const params = new URLSearchParams();

    if (published !== undefined) {
      params.append("published", published.toString());
    }

    const response = await fetch(`/api/posts?${params.toString()}`);
    const result = await response.json();

    if (result.success) {
      return result.posts;
    } else {
      console.error("Error fetching posts:", result.error);

      return [];
    }
  } catch (error) {
    console.error("Error fetching posts:", error);

    return [];
  }
}

// Get a single blog post by slug
export async function getBlogPostBySlug(
  slug: string,
  includeUnpublished = false,
): Promise<BlogPost | null> {
  try {
    const params = new URLSearchParams();

    if (includeUnpublished) {
      params.append("includeUnpublished", "true");
    }

    const response = await fetch(`/api/posts/${slug}?${params.toString()}`);
    const result = await response.json();

    if (result.success) {
      return result.post;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching post by slug:", error);

    return null;
  }
}

// Create a new blog post
export async function createBlogPost(
  formData: BlogPostFormData,
  authorId: string,
): Promise<{ success: boolean; post?: BlogPost; error?: string }> {
  try {
    const postData = {
      title: formData.title,
      htmlContent: formData.htmlContent,
      cssContent: formData.cssContent,
      excerpt: formData.excerpt || generateExcerpt(formData.htmlContent),
      thumbnailUrl: undefined as string | undefined, // Will be set after upload
      tags: formData.tags || [],
      published: formData.published,
      authorId,
    };

    // Upload thumbnail if provided
    if (formData.thumbnailFile) {
      const uploadResult = await uploadImage(formData.thumbnailFile);

      if (uploadResult.success && uploadResult.url) {
        postData.thumbnailUrl = uploadResult.url;
      } else {
        return {
          success: false,
          error: uploadResult.error || "Failed to upload thumbnail",
        };
      }
    }

    const response = await fetch("/api/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    });

    const result = await response.json();

    return result;
  } catch (error) {
    console.error("Error creating post:", error);

    return {
      success: false,
      error: "Failed to create post",
    };
  }
}

// Update an existing blog post
export async function updateBlogPost(
  id: string,
  formData: BlogPostFormData,
  currentThumbnailUrl?: string,
): Promise<{ success: boolean; post?: BlogPost; error?: string }> {
  try {
    let thumbnailUrl = currentThumbnailUrl;

    // Upload new thumbnail if provided
    if (formData.thumbnailFile) {
      // Delete old thumbnail if it exists and is from Cloudinary
      if (
        currentThumbnailUrl &&
        currentThumbnailUrl.includes("cloudinary.com")
      ) {
        try {
          // Extract public ID from Cloudinary URL
          const urlParts = currentThumbnailUrl.split("/");
          const uploadIndex = urlParts.findIndex((part) => part === "upload");

          if (uploadIndex !== -1 && urlParts[uploadIndex + 2]) {
            const publicIdWithExtension = urlParts
              .slice(uploadIndex + 2)
              .join("/");
            const publicId = publicIdWithExtension.split(".")[0];

            await deleteImage(publicId);
          }
        } catch (error) {
          console.warn("Failed to delete old thumbnail:", error);
        }
      }

      const uploadResult = await uploadImage(formData.thumbnailFile);

      if (uploadResult.success && uploadResult.url) {
        thumbnailUrl = uploadResult.url;
      } else {
        return {
          success: false,
          error: uploadResult.error || "Failed to upload new thumbnail",
        };
      }
    }

    const postData = {
      id,
      title: formData.title,
      htmlContent: formData.htmlContent,
      cssContent: formData.cssContent,
      excerpt: formData.excerpt || generateExcerpt(formData.htmlContent),
      thumbnailUrl,
      tags: formData.tags || [],
      published: formData.published,
    };

    const response = await fetch("/api/posts", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    });

    const result = await response.json();

    return result;
  } catch (error) {
    console.error("Error updating post:", error);

    return {
      success: false,
      error: "Failed to update post",
    };
  }
}

// Delete a blog post
export async function deleteBlogPost(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/posts?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });

    const result = await response.json();

    return result;
  } catch (error) {
    console.error("Error deleting post:", error);

    return {
      success: false,
      error: "Failed to delete post",
    };
  }
}

// Get published blog posts sorted by creation date
export async function getPublishedPosts(): Promise<BlogPost[]> {
  return getBlogPosts(true);
}

// Get draft blog posts
export async function getDraftPosts(): Promise<BlogPost[]> {
  return getBlogPosts(false);
}

// Search blog posts (client-side filtering for now)
export async function searchPosts(query: string): Promise<BlogPost[]> {
  const posts = await getBlogPosts();
  const searchTerm = query.toLowerCase();

  return posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchTerm) ||
      post.htmlContent
        .replace(/<[^>]*>/g, "")
        .toLowerCase()
        .includes(searchTerm) ||
      (post.excerpt && post.excerpt.toLowerCase().includes(searchTerm)) ||
      (post.tags &&
        post.tags.some((tag) => tag.toLowerCase().includes(searchTerm))),
  );
}

// Get posts by tag (client-side filtering for now)
export async function getPostsByTag(tag: string): Promise<BlogPost[]> {
  const posts = await getBlogPosts(true);

  return posts.filter((post) => post.tags && post.tags.includes(tag));
}

// Get all unique tags
export async function getAllTags(): Promise<string[]> {
  const posts = await getBlogPosts();
  const tagSet = new Set<string>();

  posts.forEach((post) => {
    if (post.tags) {
      post.tags.forEach((tag) => tagSet.add(tag));
    }
  });

  return Array.from(tagSet).sort();
}

// Sanitize HTML content for security
export function sanitizeHTML(html: string): string {
  // Basic sanitization - remove script tags and event handlers
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/on\w+\s*=\s*'[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}

// CSS injection protection - scope CSS to a specific container
export function scopeCSS(css: string, scopeId: string): string {
  if (!css) return "";

  // Simple CSS scoping - prefix all selectors with the scope ID
  return css.replace(/([^{}]+){/g, (match, selector) => {
    const trimmedSelector = selector.trim();

    // Skip @media, @keyframes, and other @ rules
    if (trimmedSelector.startsWith("@")) {
      return match;
    }

    // Add scope to each selector
    const scopedSelectors = trimmedSelector
      .split(",")
      .map((sel: string) => `#${scopeId} ${sel.trim()}`)
      .join(", ");

    return `${scopedSelectors} {`;
  });
}

// No longer needed - removing localStorage related functions
// as we now use the database through the API
