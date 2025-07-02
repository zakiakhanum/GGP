import { Router } from "express";
import productController, { updatePublisherProductController } from "../../controllers/product.controller";
import { Others } from "../../enums/others.enum";
import { authorizeRole } from "../../middlewares/role.middleware";
import { authenticateJWT, transformUser } from "../../middlewares/auth.middleware";
import { SitemapStream, streamToPromise } from "sitemap";
import { createGzip } from "zlib";
import { Product } from "../../models/product";
import { ProductRepository } from "../../repositories";
import { generateSitemaps } from "../../services/product.service";
import { Pool } from "pg";
import { User } from "../../models/user";

const productRouter = Router();

productRouter.post("/create/product", authenticateJWT,authorizeRole(Others.role.PUBLISHER) , productController.createProduct);
productRouter.get("/products", authenticateJWT,authorizeRole(Others.role.PUBLISHER), productController.getProducts);
productRouter.put("/update/product/:id",authenticateJWT ,authorizeRole(Others.role.PUBLISHER), productController.updateProduct);
productRouter.delete("/delete/product/:productId",authenticateJWT , authorizeRole(Others.role.PUBLISHER), productController.deleteProducts);
productRouter.post("/submit-post/:id", authenticateJWT, authorizeRole(Others.role.PUBLISHER), productController.submitPost);
productRouter.get('/products/postPending', authenticateJWT, authorizeRole(Others.role.PUBLISHER), productController.getPendingProducts);
// user get all products
productRouter.get("/get/products",   productController.getAllProductsUsers);
productRouter.get("/products/unapproved",authenticateJWT,authorizeRole(Others.role.PUBLISHER, Others.role.MODERATOR),productController.getUnapprovedProducts);
productRouter.put("/admin-update/:productId", authenticateJWT, updatePublisherProductController);
productRouter.get("/generate", generateSitemaps);

//route for live updates from google sheets
const pool = new Pool({
    user: process.env.DATABASE_USERNAME,
    host: process.env.DATABASE_HOST,
    database: process.env.DATABASE_NAME,
    password: process.env.DATABASE_PASSWORD,
    port: 5432,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  
  // Google Sheets Sync Endpoint
  productRouter.post("/sync-from-sheets", authenticateJWT, transformUser, authorizeRole(Others.role.MODERATOR), async (req, res) => {
    // Input validation
    if (!req.body || !Array.isArray(req.body.data)) {
      return res.status(400).json({ error: 'Invalid data format' });
    }
  
    const user = req.user as User; // Assertion
if (!user?.id) {
  return res.status(400).json({ error: 'User ID not found' });
}

  
    const { sheet, row, data } = req.body;
    
    try {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
       const query = `
    INSERT INTO "Product" (
      "siteName", 
      "price", 
      "language", 
      "country", 
      "category", 
      "currency", 
      "niche", 
      "websiteUrl", 
      "siteType", 
      "sampleLink", 
      "liveTime", 
      "linkType", 
      "maxLinkAllowed", 
      "Wordlimit", 
      "domainAuthority", 
      "domainRatings", 
      "monthlyTraffic", 
      "turnAroundTime", 
      "adjustedPrice", 
      "isProductApprove", 
      "productStatus", 
      "userId"
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
    )
    ON CONFLICT ("websiteUrl") 
    DO UPDATE SET 
      "siteName" = EXCLUDED."siteName",
      "price" = EXCLUDED."price",
      "language" = EXCLUDED."language",
      "country" = EXCLUDED."country",
      "category" = EXCLUDED."category",
      "currency" = EXCLUDED."currency",
      "niche" = EXCLUDED."niche",
      "websiteUrl" = EXCLUDED."websiteUrl",
      "siteType" = EXCLUDED."siteType",
      "sampleLink" = EXCLUDED."sampleLink",
      "liveTime" = EXCLUDED."liveTime",
      "linkType" = EXCLUDED."linkType",
      "maxLinkAllowed" = EXCLUDED."maxLinkAllowed",
      "Wordlimit" = EXCLUDED."Wordlimit",
      "domainAuthority" = EXCLUDED."domainAuthority",
      "domainRatings" = EXCLUDED."domainRatings",
      "monthlyTraffic" = EXCLUDED."monthlyTraffic",
      "turnAroundTime" = EXCLUDED."turnAroundTime",
      "adjustedPrice" = EXCLUDED."adjustedPrice",
      "isProductApprove" = EXCLUDED."isProductApprove",
      "productStatus" = EXCLUDED."productStatus",
      "userId" = EXCLUDED."userId"
    RETURNING "websiteUrl"`;
  
        
       const result = await client.query(query, [
    row[0], // site_name
    parseFloat(row[1]), // price directly from row
    row[2], // language
    row[3], // country
    row[4]?.split(",").map((item: string) => item.trim()),//category
    row[5], // currency
    row[6], // niche
    row[7], // website_url
    row[8] || "newPost", // site_type
    row[9], // sample_link
    row[10] || null, // live_time
    row[11], // link_type 
    row[12], // max_link_allowed
    row[13], // word_limit
    parseInt(row[14], 10) || 0, // domain_authority
    parseFloat(row[15]) || 0, // domain_ratings
    parseInt(row[16], 10) || 0, // monthly_traffic
    "2 days", // turn_around_time
    parseFloat(row[1]) * 1.25, // adjusted_price calculated from price
    true, // is_product_approve
    Others.productstatus.APPROVED, // product_status
    user.id // user
  ]);
  
        
        await client.query('COMMIT');
        res.status(200).json({ 
          success: true,
          updatedId: result.rows[0]?.id 
        });
      } catch (queryError) {
        await client.query('ROLLBACK');
        throw queryError;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Sync error:', error);
      res.status(500).json({
    success: false,
    error: 'Database operation failed',
    details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
  });
  
    }
  });

export default productRouter;



