// Create this file in your backend root folder
// Run it once: node migrateProducts.js

import mongoose from "mongoose";
import dotenv from "dotenv";
import Products from "./Models/ProductsModels.js"; // Adjust path to your Product model

dotenv.config();

// Function to generate slug from title
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
};

// Function to ensure unique slug
const ensureUniqueSlug = async (baseSlug, productId) => {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await Products.findOne({
      slug,
      _id: { $ne: productId }, // Exclude current product
    });

    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

// Main migration function
const migrateProductsWithSlugs = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ Connected to MongoDB");

    // Find all products without a slug or with empty slug
    const productsWithoutSlug = await Products.find({
      $or: [{ slug: { $exists: false } }, { slug: null }, { slug: "" }],
    });

    console.log(
      `📝 Found ${productsWithoutSlug.length} products without slugs`
    );

    if (productsWithoutSlug.length === 0) {
      console.log("✨ All products already have slugs!");
      process.exit(0);
    }

    // Update each product with a slug
    for (const product of productsWithoutSlug) {
      const baseSlug = generateSlug(product.title);
      const uniqueSlug = await ensureUniqueSlug(baseSlug, product._id);

      product.slug = uniqueSlug;
      await product.save();

      console.log(`✅ Updated: "${product.title}" -> slug: "${uniqueSlug}"`);
    }

    console.log("\n🎉 Migration completed successfully!");
    console.log(`Updated ${productsWithoutSlug.length} products`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
};

// Run the migration
migrateProductsWithSlugs();
