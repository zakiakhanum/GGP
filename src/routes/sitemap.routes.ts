import express from "express";
import { generateEnglishProductSitemap, generateEnglishStaticSitemap, generateGermanProductSitemap, generateGermanStaticSitemap, generateSitemaps } from "../services/product.service";


const router = express.Router();



router.get("/sitemap-en-static.xml", async (req, res) => {
  try {
    const sitemap = await generateEnglishStaticSitemap();
    res.header('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (error) {
    res.status(500).send('Error generating sitemap');
  }
});

router.get("/sitemap-de-static.xml", async (req, res) => {
  try {
    const sitemap = await generateGermanStaticSitemap();
    res.header('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (error) {
    res.status(500).send('Error generating sitemap');
  }
});

router.get("/sitemap-en-products.xml", async (req, res) => {
  try {
    const sitemap = await generateEnglishProductSitemap();
    res.header('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (error) {
    res.status(500).send('Error generating sitemap');
  }
});

router.get("/sitemap-de-products.xml", async (req, res) => {
  try {
    const sitemap = await generateGermanProductSitemap();
    res.header('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (error) {
    res.status(500).send('Error generating sitemap');
  }
});
export default router;
