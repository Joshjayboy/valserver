// Create this file in your backend root folder or in a /scripts folder
// Run it once: node migrateBlogs.js

import mongoose from "mongoose";
import dotenv from "dotenv";
import BlogModel from "./Models/BlogModel.js"; // Adjust path to your Blog model
// import BlogModel from "./models/BlogModel.js"; // Adjust path to your Blog model

dotenv.config();

// Function to generate slug from title
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/<[^>]+>/g, "") // Remove HTML tags
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
};

// Function to ensure unique slug
const ensureUniqueSlug = async (baseSlug, blogId) => {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await BlogModel.findOne({
      slug,
      _id: { $ne: blogId }, // Exclude current blog
    });

    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

// Main migration function
const migrateBlogsWithSlugs = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ Connected to MongoDB");

    // Find all blogs without a slug or with empty slug
    const blogsWithoutSlug = await BlogModel.find({
      $or: [{ slug: { $exists: false } }, { slug: null }, { slug: "" }],
    });

    console.log(`📝 Found ${blogsWithoutSlug.length} blogs without slugs`);

    if (blogsWithoutSlug.length === 0) {
      console.log("✨ All blogs already have slugs!");
      process.exit(0);
    }

    // Update each blog with a slug
    for (const blog of blogsWithoutSlug) {
      const baseSlug = generateSlug(blog.blogTitle);
      const uniqueSlug = await ensureUniqueSlug(baseSlug, blog._id);

      blog.slug = uniqueSlug;
      await blog.save();

      console.log(`✅ Updated: "${blog.blogTitle}" -> slug: "${uniqueSlug}"`);
    }

    console.log("\n🎉 Migration completed successfully!");
    console.log(`Updated ${blogsWithoutSlug.length} blogs`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
};

// Run the migration
migrateBlogsWithSlugs();
