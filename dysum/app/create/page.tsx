"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { createBlogPost, uploadImage } from "../lib/blogUtils";
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
          id="create-post-form"
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter your post title..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  required
                />
              </div>

              {/* Thumbnail Upload */}
              <div>
                <label
                  htmlFor="thumbnail"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Thumbnail Image
                </label>
                <div className="space-y-4">
                  <input
                    type="file"
                    id="thumbnail"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-medium
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
                  />
                  <p className="text-xs text-gray-500">
                    Upload an image file (JPEG, PNG, WebP, GIF). Maximum size:
                    10MB. Image will be optimized and hosted on Cloudinary.
                  </p>

                  {thumbnailPreview && (
                    <div className="relative inline-block">
                      <img
                        src={thumbnailPreview}
                        alt="Thumbnail preview"
                        className="w-full max-w-md h-48 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={removeThumbnail}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs hover:bg-red-600"
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
                  htmlFor="excerpt"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Excerpt
                </label>
                <textarea
                  id="excerpt"
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleInputChange}
                  placeholder="Write a brief summary of your post..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                />
                <p className="text-xs text-gray-500 mt-1">
                  If left empty, an excerpt will be automatically generated from
                  your HTML content.
                </p>
              </div>

              {/* HTML Content */}
              <div>
                <label
                  htmlFor="htmlContent"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  HTML Content *
                </label>
                <textarea
                  id="htmlContent"
                  name="htmlContent"
                  value={formData.htmlContent}
                  onChange={handleInputChange}
                  placeholder="Paste your HTML content here..."
                  rows={20}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical font-mono text-sm"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Paste your complete HTML content. Script tags and event
                  handlers will be removed for security.
                </p>
              </div>

              {/* CSS Content */}
              <div>
                <label
                  htmlFor="cssContent"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  CSS Styling (Optional)
                </label>
                <textarea
                  id="cssContent"
                  name="cssContent"
                  value={formData.cssContent}
                  onChange={handleInputChange}
                  placeholder="Paste your CSS styling here..."
                  rows={15}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional CSS styling for this blog post. CSS will be scoped to
                  this post only.
                </p>
              </div>

              {/* Tags */}
              <div>
                <label
                  htmlFor="tags"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Tags
                </label>
                <input
                  type="text"
                  id="tags"
                  value={tagsInput}
                  onChange={handleTagsChange}
                  placeholder="technology, web development, javascript"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: formData.htmlContent }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={saving || uploadingThumbnail}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Draft"}
              </button>

              <button
                type="button"
                onClick={handlePublish}
                disabled={
                  saving ||
                  uploadingThumbnail ||
                  !formData.title.trim() ||
                  !formData.htmlContent.trim()
                }
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
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
