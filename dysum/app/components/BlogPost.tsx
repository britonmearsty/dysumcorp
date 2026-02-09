"use client";

import Link from "next/link";
import { BlogPost as BlogPostType } from "../types";
import { scopeCSS, sanitizeHTML } from "../lib/blogUtils";

interface BlogPostProps {
  post: BlogPostType;
  showFullContent?: boolean;
}

export default function BlogPost({
  post,
  showFullContent = false,
}: BlogPostProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getExcerpt = (htmlContent: string, maxLength: number = 150) => {
    const plainText = htmlContent.replace(/<[^>]*>/g, "").trim();
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength).trim() + "...";
  };

  // Create a unique ID for this blog post's styling scope
  const postScopeId = `blog-post-${post.id}`;

  // Generate scoped CSS for this post
  const scopedCSS = post.cssContent
    ? scopeCSS(post.cssContent, postScopeId)
    : "";

  // Sanitize HTML content
  const sanitizedHTML = sanitizeHTML(post.htmlContent);

  return (
    <article className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Inject scoped CSS for this post */}
      {scopedCSS && <style dangerouslySetInnerHTML={{ __html: scopedCSS }} />}

      {post.thumbnailUrl && (
        <div className="aspect-video relative overflow-hidden">
          <img
            src={post.thumbnailUrl}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-6">
        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
          <span>{formatDate(post.createdAt)}</span>
          {post.readingTime && <span>• {post.readingTime} min read</span>}
          {post.tags && post.tags.length > 0 && (
            <div className="flex items-center space-x-2">
              <span>•</span>
              <div className="flex flex-wrap gap-1">
                {post.tags.slice(0, 3).map((tag: string) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
                {post.tags.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{post.tags.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <h2
          className={`font-bold text-gray-900 mb-3 ${showFullContent ? "text-3xl" : "text-xl"}`}
        >
          {showFullContent ? (
            post.title
          ) : (
            <Link
              href={`/post/${post.slug}`}
              className="hover:text-blue-600 transition-colors"
            >
              {post.title}
            </Link>
          )}
        </h2>

        {post.excerpt && !showFullContent && (
          <p className="text-gray-600 mb-4 leading-relaxed">{post.excerpt}</p>
        )}

        <div className="text-gray-700 leading-relaxed">
          {showFullContent ? (
            <div
              id={postScopeId}
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
            />
          ) : (
            <p>{getExcerpt(post.htmlContent)}</p>
          )}
        </div>

        {!showFullContent && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <Link
              href={`/post/${post.slug}`}
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              Read more
              <svg
                className="ml-1 w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>

            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <Link
                href={`/post/${post.slug}/edit`}
                className="hover:text-blue-600 transition-colors"
              >
                Edit
              </Link>
            </div>
          </div>
        )}

        {showFullContent && (
          <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                <svg
                  className="mr-1 w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to Home
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                href={`/post/${post.slug}/edit`}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Edit Post
              </Link>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
