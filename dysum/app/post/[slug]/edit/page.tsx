"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, notFound } from "next/navigation";

import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import {
  getBlogPostBySlug,
  updateBlogPost,
  deleteBlogPost,
} from "../../../lib/blogUtils";
import { BlogPost, BlogPostFormData } from "../../../types";

export default function EditPostPage() {
  const { slug } = useParams();
  const router = useRouter();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState<BlogPostFormData>({
    title: "",
    content: "",
    excerpt: "",
    featuredImage: "",
    tags: [],
    published: false,
  });
  const [tagsInput, setTagsInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!slug || typeof slug !== "string") {
      setLoading(false);

      return;
    }

    const foundPost = getBlogPostBySlug(slug);

    if (!foundPost) {
      notFound();

      return;
    }

    setPost(foundPost);
    setFormData({
      title: foundPost.title,
      content: foundPost.content,
      excerpt: foundPost.excerpt || "",
      featuredImage: foundPost.featuredImage || "",
      tags: foundPost.tags || [],
      published: foundPost.published,
    });
    setTagsInput((foundPost.tags || []).join(", "));
    setLoading(false);
  }, [slug]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;

      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagsInput(e.target.value);
  };

  const processTagsInput = (input: string): string[] => {
    return input
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert("Please enter a title for your post.");

      return;
    }

    if (!formData.content.trim()) {
      alert("Please enter some content for your post.");

      return;
    }

    if (!post) return;

    setSaving(true);

    try {
      const postData: BlogPostFormData = {
        ...formData,
        tags: processTagsInput(tagsInput),
      };

      const updatedPost = updateBlogPost(post.id, postData);

      if (updatedPost) {
        if (formData.published) {
          router.push(`/post/${updatedPost.slug}`);
        } else {
          router.push("/");
        }
      } else {
        alert("There was an error updating your post. Please try again.");
      }
    } catch (error) {
      console.error("Error updating post:", error);
      alert("There was an error updating your post. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!post) return;

    try {
      const success = deleteBlogPost(post.id);

      if (success) {
        router.push("/");
      } else {
        alert("There was an error deleting your post. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("There was an error deleting your post. Please try again.");
    }

    setShowDeleteConfirm(false);
  };

  const handleSaveChanges = () => {
    setFormData((prev) => ({ ...prev, published: post?.published || false }));
    // The form submission will handle the actual saving
    const form = document.getElementById("edit-post-form") as HTMLFormElement;

    form?.requestSubmit();
  };

  const handlePublish = () => {
    setFormData((prev) => ({ ...prev, published: true }));
    // The form submission will handle the actual saving
    const form = document.getElementById("edit-post-form") as HTMLFormElement;

    form?.requestSubmit();
  };

  const handleUnpublish = () => {
    setFormData((prev) => ({ ...prev, published: false }));
    // The form submission will handle the actual saving
    const form = document.getElementById("edit-post-form") as HTMLFormElement;

    form?.requestSubmit();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8" />
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
              <div className="h-4 bg-gray-200 rounded w-1/4" />
              <div className="h-12 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded w-1/4" />
              <div className="h-32 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded w-1/4" />
              <div className="h-64 bg-gray-200 rounded" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Post Not Found
            </h1>
            <p className="text-gray-600 mb-8">
              The blog post you're trying to edit doesn't exist or has been
              removed.
            </p>
            <a
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              href="/"
            >
              Back to Home
            </a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Post</h1>
          <p className="text-gray-600">
            Make changes to your post and save or republish when ready.
          </p>
        </div>

        <form className="space-y-6" id="edit-post-form" onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-2"
                  htmlFor="title"
                >
                  Title *
                </label>
                <input
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  id="title"
                  name="title"
                  placeholder="Enter your post title..."
                  type="text"
                  value={formData.title}
                  onChange={handleInputChange}
                />
              </div>

              {/* Featured Image */}
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-2"
                  htmlFor="featuredImage"
                >
                  Featured Image URL
                </label>
                <input
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  id="featuredImage"
                  name="featuredImage"
                  placeholder="https://example.com/image.jpg"
                  type="url"
                  value={formData.featuredImage}
                  onChange={handleInputChange}
                />
                {formData.featuredImage && (
                  <div className="mt-3">
                    <img
                      alt="Featured image preview"
                      className="w-full max-w-md h-48 object-cover rounded-lg"
                      src={formData.featuredImage}
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;

                        img.style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Excerpt */}
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-2"
                  htmlFor="excerpt"
                >
                  Excerpt
                </label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                  id="excerpt"
                  name="excerpt"
                  placeholder="Write a brief summary of your post..."
                  rows={3}
                  value={formData.excerpt}
                  onChange={handleInputChange}
                />
                <p className="text-xs text-gray-500 mt-1">
                  If left empty, an excerpt will be automatically generated from
                  your content.
                </p>
              </div>

              {/* Content */}
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-2"
                  htmlFor="content"
                >
                  Content *
                </label>
                <textarea
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical font-mono text-sm"
                  id="content"
                  name="content"
                  placeholder="Start writing your post content..."
                  rows={15}
                  value={formData.content}
                  onChange={handleInputChange}
                />
                <p className="text-xs text-gray-500 mt-1">
                  You can use HTML tags for formatting (e.g., &lt;p&gt;,
                  &lt;h2&gt;, &lt;strong&gt;, &lt;em&gt;, etc.).
                </p>
              </div>

              {/* Tags */}
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-2"
                  htmlFor="tags"
                >
                  Tags
                </label>
                <input
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  id="tags"
                  placeholder="technology, web development, javascript"
                  type="text"
                  value={tagsInput}
                  onChange={handleTagsChange}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separate tags with commas. Tags help organize and categorize
                  your posts.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-4">
              <button
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={saving}
                type="button"
                onClick={() => router.push(`/post/${post.slug}`)}
              >
                Cancel
              </button>

              <button
                className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                disabled={saving}
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete Post
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <button
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={saving}
                type="button"
                onClick={handleSaveChanges}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>

              {post.published ? (
                <button
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  disabled={saving}
                  type="button"
                  onClick={handleUnpublish}
                >
                  {saving ? "Unpublishing..." : "Unpublish"}
                </button>
              ) : (
                <button
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  disabled={
                    saving || !formData.title.trim() || !formData.content.trim()
                  }
                  type="button"
                  onClick={handlePublish}
                >
                  {saving ? "Publishing..." : "Publish Post"}
                </button>
              )}
            </div>
          </div>
        </form>
      </main>

      <Footer />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Delete Post
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{post.title}"? This action cannot
              be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                onClick={handleDelete}
              >
                Delete Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
