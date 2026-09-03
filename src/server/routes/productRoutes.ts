import { Router } from 'express';
import { ProductService } from '../services/productService';

const router = Router();

// Public catalogue query (Requirement 10: does NOT display total count)
router.get('/', (req, res) => {
  try {
    const {
      category_id,
      category_slug,
      brand_id,
      brand_slug,
      search,
      min_price,
      max_price,
      availability,
      condition,
      min_rating,
      sort_by,
      page,
      limit,
      cursor
    } = req.query;

    const result = ProductService.getPublicProducts({
      category_id: category_id as string,
      category_slug: category_slug as string,
      brand_id: brand_id as string,
      brand_slug: brand_slug as string,
      search: search as string,
      min_price: min_price ? Number(min_price) : undefined,
      max_price: max_price ? Number(max_price) : undefined,
      availability: availability as string,
      condition: condition as string,
      min_rating: min_rating ? Number(min_rating) : undefined,
      sort_by: sort_by as any,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 24,
      cursor: cursor as string
    });

    res.json(result);
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/categories', (req, res) => {
  try {
    const categories = ProductService.getCategories();
    res.json({ categories });
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/brands', (req, res) => {
  try {
    const brands = ProductService.getBrands();
    res.json({ brands });
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/:slug', (req, res) => {
  try {
    const product = ProductService.getProductBySlug(req.params.slug) || ProductService.getProductById(req.params.slug);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ product });
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
