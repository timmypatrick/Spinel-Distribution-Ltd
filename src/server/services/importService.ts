import crypto from 'crypto';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { db } from '../db/schema';
import { ImportJob, ImportError, ImportStatus, Product } from '../../types';

export interface ImportRowData {
  sku?: string;
  name?: string;
  category?: string;
  brand?: string;
  price_usd?: string | number;
  stock_quantity?: string | number;
  description?: string;
  image?: string;
  condition?: string;
  weight_kg?: string | number;
  warranty?: string;
}

export class ImportService {
  private static activeWorkers: Map<string, { cancelRequested: boolean }> = new Map();

  /**
   * Generate downloadable standard CSV or XLSX template
   */
  static generateTemplate(format: 'csv' | 'xlsx' = 'csv'): { data: string | Buffer; mimeType: string; fileName: string } {
    const sampleHeaders = [
      'sku', 'name', 'category', 'brand', 'price_usd', 'stock_quantity', 
      'short_description', 'description', 'image', 'condition', 'weight_kg', 'warranty'
    ];

    const sampleRows = [
      [
        'CS-C9300-24T-A',
        'Cisco Catalyst 9300 24-Port Gigabit Switch',
        'Networking & Telecomm',
        'Cisco Systems',
        '3250.00',
        '30',
        '24-Port Data Only Switch with Modular Uplinks',
        'Enterprise layer 3 switch with high speed stackable backplane and dual redundant power supplies.',
        'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
        'NEW',
        '6.8',
        'Enhanced Limited Lifetime Warranty'
      ],
      [
        'DELL-R650-XS-16',
        'Dell PowerEdge R650 1U Dual Xeon Server',
        'Servers & Data Storage',
        'Dell Technologies',
        '6400.00',
        '15',
        '1U High Density Dual Xeon Enterprise Server',
        'Dual 3rd Gen Intel Xeon Scalable processors, 64GB DDR4 ECC RAM, 4x 960GB NVMe SSDs.',
        'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
        'NEW',
        '18.2',
        '3-Year ProSupport Plus Next Business Day'
      ]
    ];

    if (format === 'xlsx') {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([sampleHeaders, ...sampleRows]);
      XLSX.utils.book_append_sheet(wb, ws, 'Products Template');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      return {
        data: buf,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        fileName: 'spinel_catalogue_import_template.xlsx'
      };
    } else {
      const csv = Papa.unparse([sampleHeaders, ...sampleRows]);
      return {
        data: csv,
        mimeType: 'text/csv',
        fileName: 'spinel_catalogue_import_template.csv'
      };
    }
  }

  /**
   * Create an import job
   */
  static createJob(params: {
    fileName: string;
    filePath: string;
    fileSize: number;
    createdBy?: string;
  }): ImportJob {
    const id = crypto.randomUUID();
    const job: ImportJob = {
      id,
      file_name: params.fileName,
      file_path: params.filePath,
      file_size: params.fileSize,
      total_rows: 0,
      processed_rows: 0,
      successful_rows: 0,
      failed_rows: 0,
      duplicate_rows: 0,
      status: 'PENDING',
      created_by: params.createdBy,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    db.importJobs.set(id, job);

    db.auditLogs.push({
      id: crypto.randomUUID(),
      user_id: params.createdBy,
      action: 'IMPORT_JOB_CREATED',
      entity: 'import_jobs',
      entity_id: id,
      metadata: { file_name: params.fileName, file_size: params.fileSize },
      created_at: new Date().toISOString()
    });

    return job;
  }

  /**
   * Start processing an import job asynchronously in chunks
   */
  static async startProcessingJob(jobId: string, rawContent: string | Buffer, fileType: 'csv' | 'xlsx'): Promise<ImportJob> {
    const job = db.importJobs.get(jobId);
    if (!job) throw new Error('Import job not found');

    if (job.status !== 'PENDING' && job.status !== 'UPLOADING') {
      throw new Error(`Job is in ${job.status} state and cannot be started`);
    }

    job.status = 'VALIDATING';
    job.started_at = new Date().toISOString();
    job.updated_at = new Date().toISOString();

    const workerState = { cancelRequested: false };
    this.activeWorkers.set(jobId, workerState);

    // Run processing asynchronously without blocking the HTTP thread
    setTimeout(async () => {
      try {
        await this.executeBackgroundImport(jobId, rawContent, fileType, workerState);
      } catch (err: unknown) {
        console.error(`Import worker crashed for job ${jobId}:`, err);
        const j = db.importJobs.get(jobId);
        if (j) {
          j.status = 'FAILED';
          j.completed_at = new Date().toISOString();
          j.updated_at = new Date().toISOString();
        }
      } finally {
        this.activeWorkers.delete(jobId);
      }
    }, 100);

    return job;
  }

  /**
   * Core background parsing, validation, chunking, and bulk loading engine
   */
  private static async executeBackgroundImport(
    jobId: string,
    rawContent: string | Buffer,
    fileType: 'csv' | 'xlsx',
    workerState: { cancelRequested: boolean }
  ) {
    const job = db.importJobs.get(jobId);
    if (!job) return;

    let rows: Record<string, string>[] = [];

    // 1. Parsing Phase
    try {
      if (fileType === 'xlsx') {
        const workbook = XLSX.read(rawContent, { type: Buffer.isBuffer(rawContent) ? 'buffer' : 'string' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      } else {
        const csvString = typeof rawContent === 'string' ? rawContent : rawContent.toString('utf8');
        const parsed = Papa.parse<Record<string, string>>(csvString, {
          header: true,
          skipEmptyLines: true,
          transformHeader: h => h.trim().toLowerCase()
        });
        rows = parsed.data;
      }
    } catch (parseErr: unknown) {
      job.status = 'FAILED';
      job.completed_at = new Date().toISOString();
      db.importErrors.push({
        id: crypto.randomUUID(),
        job_id: jobId,
        row_number: 1,
        error_type: 'FILE_PARSE_ERROR',
        message: `Failed to parse file: ${(parseErr as Error).message || 'Invalid format'}`,
        created_at: new Date().toISOString()
      });
      return;
    }

    job.total_rows = rows.length;
    job.status = 'PROCESSING';
    job.updated_at = new Date().toISOString();

    // Cache existing SKUs in memory for ultra-fast O(1) duplicate detection
    const existingSkus = new Set<string>();
    for (const p of db.products.values()) {
      existingSkus.add(p.sku.toLowerCase().trim());
    }

    // Cache categories & brands lookup map
    const catMap = new Map<string, string>(); // lowercase name -> id
    for (const c of db.categories.values()) {
      catMap.set(c.name.toLowerCase().trim(), c.id);
    }
    const brandMap = new Map<string, string>(); // lowercase name -> id
    for (const b of db.brands.values()) {
      brandMap.set(b.name.toLowerCase().trim(), b.id);
    }

    // 2. Chunking & PostgreSQL Bulk Loading Simulation
    const CHUNK_SIZE = 50; // chunk size for streaming and non-blocking event loop
    const jobErrors: ImportError[] = [];

    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      if (workerState.cancelRequested) {
        job.status = 'CANCELLED';
        job.completed_at = new Date().toISOString();
        job.updated_at = new Date().toISOString();
        return;
      }

      const chunk = rows.slice(i, i + CHUNK_SIZE);

      for (let j = 0; j < chunk.length; j++) {
        const row = chunk[j];
        const rowNum = i + j + 2; // header is row 1, 1-indexed

        const sku = String(row.sku || '').trim();
        const name = String(row.name || '').trim();
        const categoryStr = String(row.category || '').trim();
        const brandStr = String(row.brand || '').trim();
        const priceStr = String(row.price_usd || '').trim();
        const stockStr = String(row.stock_quantity || '').trim();

        // Validation 1: Required SKU & duplicate SKU
        if (!sku) {
          jobErrors.push({
            id: crypto.randomUUID(),
            job_id: jobId,
            row_number: rowNum,
            error_type: 'MISSING_REQUIRED_FIELD',
            message: 'Missing SKU',
            raw_data: row,
            created_at: new Date().toISOString()
          });
          job.failed_rows++;
          job.processed_rows++;
          continue;
        }

        if (existingSkus.has(sku.toLowerCase())) {
          jobErrors.push({
            id: crypto.randomUUID(),
            job_id: jobId,
            row_number: rowNum,
            sku,
            error_type: 'DUPLICATE_SKU',
            message: `Duplicate SKU: ${sku} already exists in catalogue`,
            raw_data: row,
            created_at: new Date().toISOString()
          });
          job.duplicate_rows++;
          job.failed_rows++;
          job.processed_rows++;
          continue;
        }

        // Validation 2: Product Name
        if (!name) {
          jobErrors.push({
            id: crypto.randomUUID(),
            job_id: jobId,
            row_number: rowNum,
            sku,
            error_type: 'MISSING_REQUIRED_FIELD',
            message: 'Missing Product Name',
            raw_data: row,
            created_at: new Date().toISOString()
          });
          job.failed_rows++;
          job.processed_rows++;
          continue;
        }

        // Validation 3: Price
        const price = parseFloat(priceStr);
        if (isNaN(price) || price < 0) {
          jobErrors.push({
            id: crypto.randomUUID(),
            job_id: jobId,
            row_number: rowNum,
            sku,
            error_type: 'INVALID_PRICE',
            message: `Invalid price "${priceStr}". Must be a non-negative number.`,
            raw_data: row,
            created_at: new Date().toISOString()
          });
          job.failed_rows++;
          job.processed_rows++;
          continue;
        }

        // Validation 4: Stock
        const stock = stockStr ? parseInt(stockStr, 10) : 0;
        if (isNaN(stock) || stock < 0) {
          jobErrors.push({
            id: crypto.randomUUID(),
            job_id: jobId,
            row_number: rowNum,
            sku,
            error_type: 'NEGATIVE_STOCK',
            message: `Negative or invalid stock quantity "${stockStr}".`,
            raw_data: row,
            created_at: new Date().toISOString()
          });
          job.failed_rows++;
          job.processed_rows++;
          continue;
        }

        // Category resolution or auto-create
        let categoryId = catMap.get(categoryStr.toLowerCase());
        if (!categoryId) {
          // If no category specified, fallback or create
          const catName = categoryStr || 'General Hardware';
          const newCatId = `cat-${crypto.randomUUID().slice(0, 8)}`;
          const newCat = {
            id: newCatId,
            name: catName,
            slug: catName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            is_active: true,
            display_order: 10
          };
          db.categories.set(newCatId, newCat);
          catMap.set(catName.toLowerCase(), newCatId);
          categoryId = newCatId;
        }

        // Brand resolution
        let brandId = brandStr ? brandMap.get(brandStr.toLowerCase()) : undefined;
        if (brandStr && !brandId) {
          const newBrandId = `brand-${crypto.randomUUID().slice(0, 8)}`;
          const newBrand = {
            id: newBrandId,
            name: brandStr,
            slug: brandStr.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            is_active: true
          };
          db.brands.set(newBrandId, newBrand);
          brandMap.set(brandStr.toLowerCase(), newBrandId);
          brandId = newBrandId;
        }

        // Create product record
        const prodId = crypto.randomUUID();
        const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${sku.toLowerCase()}`;
        const newProd: Product = {
          id: prodId,
          sku,
          name,
          slug,
          category_id: categoryId,
          category_name: db.categories.get(categoryId)?.name || 'General',
          brand_id: brandId,
          brand_name: brandId ? db.brands.get(brandId)?.name : undefined,
          description: String(row.description || name),
          short_description: String(row.short_description || name.slice(0, 150)),
          image: String(row.image || 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80'),
          price_usd: price,
          compare_at_price_usd: price * 1.15,
          stock_quantity: stock,
          availability: stock > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK',
          status: 'ACTIVE',
          condition: (row.condition as 'NEW' | 'REFURBISHED' | 'OPEN_BOX' | 'USED') || 'NEW',
          weight_kg: row.weight_kg ? parseFloat(String(row.weight_kg)) : undefined,
          warranty: String(row.warranty || '1-Year Limited Warranty'),
          specifications: { "Import Source": "Bulk Import Job", "SKU": sku },
          rating: 5.0,
          review_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        db.products.set(prodId, newProd);
        existingSkus.add(sku.toLowerCase());

        // Inventory item
        db.inventory.set(prodId, {
          product_id: prodId,
          product_name: newProd.name,
          sku: newProd.sku,
          quantity_on_hand: stock,
          quantity_reserved: 0,
          quantity_available: stock,
          reorder_threshold: 10,
          warehouse_location: 'Import Warehouse Dock 3',
          last_counted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        // Inventory movement
        db.inventoryMovements.push({
          id: crypto.randomUUID(),
          product_id: prodId,
          product_name: newProd.name,
          sku: newProd.sku,
          movement_type: 'IMPORT',
          quantity_changed: stock,
          previous_quantity: 0,
          new_quantity: stock,
          reference_type: 'import_job',
          reference_id: jobId,
          reason: `Bulk catalogue import via job #${job.file_name}`,
          created_at: new Date().toISOString()
        });

        job.successful_rows++;
        job.processed_rows++;
      }

      job.updated_at = new Date().toISOString();

      // Yield event loop
      await new Promise(r => setTimeout(r, 20));
    }

    // Save all collected errors to database store
    for (const err of jobErrors) {
      db.importErrors.push(err);
    }

    // 3. Completion Phase
    if (job.failed_rows > 0 && job.successful_rows > 0) {
      job.status = 'PARTIALLY_COMPLETED';
    } else if (job.failed_rows > 0 && job.successful_rows === 0) {
      job.status = 'FAILED';
    } else {
      job.status = 'COMPLETED';
    }

    job.completed_at = new Date().toISOString();
    job.updated_at = new Date().toISOString();

    // Audit log
    db.auditLogs.push({
      id: crypto.randomUUID(),
      action: 'IMPORT_JOB_COMPLETED',
      entity: 'import_jobs',
      entity_id: jobId,
      metadata: {
        status: job.status,
        total_rows: job.total_rows,
        successful_rows: job.successful_rows,
        failed_rows: job.failed_rows,
        duplicate_rows: job.duplicate_rows
      },
      created_at: new Date().toISOString()
    });
  }

  /**
   * Cancel an eligible in-progress import job
   */
  static cancelJob(jobId: string, userId?: string): ImportJob {
    const job = db.importJobs.get(jobId);
    if (!job) throw new Error('Import job not found');

    if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(job.status)) {
      throw new Error(`Cannot cancel import job with status ${job.status}`);
    }

    const worker = this.activeWorkers.get(jobId);
    if (worker) {
      worker.cancelRequested = true;
    }

    job.status = 'CANCELLED';
    job.completed_at = new Date().toISOString();
    job.updated_at = new Date().toISOString();

    db.auditLogs.push({
      id: crypto.randomUUID(),
      user_id: userId,
      action: 'IMPORT_JOB_CANCELLED',
      entity: 'import_jobs',
      entity_id: jobId,
      created_at: new Date().toISOString()
    });

    return job;
  }

  static getJob(jobId: string): ImportJob | null {
    return db.importJobs.get(jobId) || null;
  }

  static getAllJobs(): ImportJob[] {
    return Array.from(db.importJobs.values())
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  static getJobErrors(jobId: string): ImportError[] {
    return db.importErrors.filter(e => e.job_id === jobId);
  }

  /**
   * Generate CSV error report for an import job
   */
  static generateErrorReportCsv(jobId: string): string {
    const errors = this.getJobErrors(jobId);
    const data = errors.map(e => ({
      Row: e.row_number,
      SKU: e.sku || 'N/A',
      'Error Type': e.error_type,
      Description: e.message,
      Timestamp: e.created_at
    }));

    return Papa.unparse(data);
  }
}
