"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import Header from "../components/Header";
import Footer from "../components/Footer";
import { createBlogPost } from "../lib/blogUtils";
import { BlogPostFormData } from "../types";

export default function CreatePostPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<BlogPostFormData>({
    title: "",
    htmlContent: "",
    cssContent: "",
    excerpt: "",
    tags: [],
    published: false,
  });
  const [tagsInput, setTagsInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

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

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");

        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        alert("Image size must be less than 10MB");

        return;
      }

      setThumbnailFile(file);

      // Create preview
      const reader = new FileReader();

      reader.onload = (e) => {
        setThumbnailPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    const input = document.getElementById("thumbnail") as HTMLInputElement;

    if (input) input.value = "";
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

    if (!formData.htmlContent.trim()) {
      alert("Please enter HTML content for your post.");

      return;
    }

    setSaving(true);

    try {
      // For now, using a mock author ID - in a real app, this would come from the auth session
      const mockAuthorId = "temp-author-id";

      const postData: BlogPostFormData = {
        ...formData,
        thumbnailFile: thumbnailFile || undefined,
        tags: processTagsInput(tagsInput),
      };

      const result = await createBlogPost(postData, mockAuthorId);

      if (result.success && result.post) {
        if (formData.published) {
          router.push(`/post/${result.post.slug}`);
        } else {
          router.push("/");
        }
      } else {
        alert(result.error || "Failed to create post. Please try again.");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      alert("There was an error saving your post. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = () => {
    setFormData((prev) => ({ ...prev, published: false }));
    const form = document.getElementById("create-post-form") as HTMLFormElement;

    form?.requestSubmit();
  };

  const handlePublish = () => {
    setFormData((prev) => ({ ...prev, published: true }));
    const form = document.getElementById("create-post-form") as HTMLFormElement;

    form?.requestSubmit();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create New Blog Post
          </h1>
          <p className="text-gray-600">
            Create a blog post by pasting HTML content, optional CSS styling,
            and uploading a thumbnail image.
          </p>
        </div>

        <form
          className="space-y-6"
          id="create-post-form"
          onSubmit={handleSubmit}
        >
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

              {/* Thumbnail Upload */}
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-2"
                  htmlFor="thumbnail"
                >
                  Thumbnail Image
                </label>
                <div className="space-y-4">
                  <input
                    accept="image/*"
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-medium
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
                    id="thumbnail"
                    type="file"
                    onChange={handleThumbnailChange}
                  />
                  <p className="text-xs text-gray-500">
                    Upload an image file (JPEG, PNG, WebP, GIF). Maximum size:
                    10MB. Image will be optimized and hosted on Cloudinary.
                  </p>

                  {thumbnailPreview && (
                    <div className="relative inline-block">
                      <img
                        alt="Thumbnail preview"
                        className="w-full max-w-md h-48 object-cover rounded-lg border"
                        src={thumbnailPreview}
                      />
                      <button
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs hover:bg-red-600"
                        type="button"
                        onClick={removeThumbnail}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
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
                  your HTML content.
                </p>
              </div>

              {/* HTML Content */}
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-2"
                  htmlFor="htmlContent"
                >
                  HTML Content *
                </label>
                <textarea
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical font-mono text-sm"
                  id="htmlContent"
                  name="htmlContent"
                  placeholder="Paste your HTML content here..."
                  rows={20}
                  value={formData.htmlContent}
                  onChange={handleInputChange}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Paste your complete HTML content. Script tags and event
                  handlers will be removed for security.
                </p>
              </div>

              {/* CSS Content */}
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-2"
                  htmlFor="cssContent"
                >
                  CSS Styling (Optional)
                </label>
                <textarea
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical font-mono text-sm"
                  id="cssContent"
                  name="cssContent"
                  placeholder="Paste your CSS styling here..."
                  rows={15}
                  value={formData.cssContent}
                  onChange={handleInputChange}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional CSS styling for this blog post. CSS will be scoped to
                  this post only.
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

          {/* Preview Section */}
          {formData.htmlContent && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Live Preview
              </h3>
              <div className="border rounded-lg p-4 bg-gray-50">
                <style
                  dangerouslySetInnerHTML={{
                    __html: formData.cssContent || "",
                  }}
                />
                <div
                  dangerouslySetInnerHTML={{ __html: formData.htmlContent }}
                  className="prose max-w-none"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-4">
              <button
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={saving}
                type="button"
                onClick={() => router.push("/")}
              >
                Cancel
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <button
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={saving || uploadingThumbnail}
                type="button"
                onClick={handleSaveDraft}
              >
                {saving ? "Saving..." : "Save Draft"}
              </button>

              <button
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                disabled={
                  saving ||
                  uploadingThumbnail ||
                  !formData.title.trim() ||
                  !formData.htmlContent.trim()
                }
                type="button"
                onClick={handlePublish}
              >
                {saving ? "Publishing..." : "Publish Post"}
              </button>
            </div>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}
