export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  htmlContent: string;
  cssContent?: string;
  excerpt?: string;
  thumbnailUrl?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  published: boolean;
  readingTime?: number;
  authorId?: string;
}

export interface BlogPostFormData {
  title: string;
  htmlContent: string;
  cssContent?: string;
  excerpt?: string;
  thumbnailFile?: File;
  tags?: string[];
  published: boolean;
}

export interface BlogPostsState {
  posts: BlogPost[];
  loading: boolean;
  error?: string;
}

export interface CloudinaryUploadResponse {
  success: boolean;
  url?: string;
  publicId?: string;
  error?: string;
}

export interface CreateBlogPostRequest {
  title: string;
  htmlContent: string;
  cssContent?: string;
  excerpt?: string;
  thumbnailUrl?: string;
  tags?: string[];
  published: boolean;
}
