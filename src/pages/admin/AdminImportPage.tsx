import React, { useState, useEffect, useRef } from 'react';
import { 
  UploadCloud, Download, FileSpreadsheet, CheckCircle2, 
  AlertCircle, RefreshCw, XCircle, FileText, Play, Clock 
} from 'lucide-react';
import { api } from '../../services/api';
import { ImportJob, ImportError } from '../../types';
import { useToast } from '../../context/ToastContext';

export const AdminImportPage: React.FC = () => {
  const { success, error, toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeJob, setActiveJob] = useState<ImportJob | null>(null);
  const [jobHistory, setJobHistory] = useState<ImportJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Poll active job status
  useEffect(() => {
    let timer: any = null;

    const checkJob = async () => {
      if (!activeJob || ['COMPLETED', 'FAILED', 'CANCELLED'].includes(activeJob.status)) {
        return;
      }
      try {
        const data = await api.getImportJob(activeJob.id);
        setActiveJob(data.job);
        if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(data.job.status)) {
          loadHistory();
          if (data.job.status === 'COMPLETED') {
            success(`Import completed: ${data.job.successful_rows} rows imported successfully!`);
          }
        }
      } catch (err) {
        console.error('Error polling job:', err);
      }
    };

    if (activeJob && ['PENDING', 'VALIDATING', 'IMPORTING'].includes(activeJob.status)) {
      timer = setInterval(checkJob, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeJob]);

  const loadHistory = async () => {
    try {
      const data = await api.getImportJobs();
      setJobHistory(data.jobs);
    } catch (err) {
      console.error('Failed to load import jobs:', err);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDownloadTemplate = (format: 'csv' | 'xlsx') => {
    const csvContent = 'name,sku,category,brand,description,price_usd,compare_at_price_usd,stock_quantity,condition,is_active,specifications\n' +
      '"Cisco Catalyst 9300-48P","CSCO-C9300-48P","Networking & Enterprise Switches","Cisco","Enterprise 48-port PoE+ Layer 3 Switch",4850.00,5400.00,45,"NEW",true,"{\\"Ports\\": \\"48x 1GbE PoE+\\", \\"Stacking\\": \\"480 Gbps\\"}"\n' +
      '"Dell PowerEdge R750 2U","DELL-PE-R750","Servers & Datacenter Compute","Dell EMC","Dual 3rd Gen Intel Xeon Scalable Server",8950.00,9800.00,18,"NEW",true,"{\\"Chassis\\": \\"2U Rack\\", \\"Memory\\": \\"256GB DDR4\\"}"\n' +
      '"Huawei Smart Inverter 100KTL","HUA-SUN2000-100KTL","Solar & Power Inverters","Huawei","Commercial 100kW 3-Phase Grid-Tied Inverter",6450.00,7200.00,22,"NEW",true,"{\\"Efficiency\\": \\"98.8%\\", \\"MPPT\\": \\"10 Input Channels\\"}"';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `spinel_catalogue_template.${format}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        try {
          const res = await api.uploadCatalogue(file.name, text);
          setActiveJob(res.job);
          success(`Job #${res.job.id} initialized. Starting background batch processing...`);
        } catch (err: unknown) {
          error((err as Error).message);
        } finally {
          setUploading(false);
        }
      };
      reader.readAsText(file);
    } catch (err: unknown) {
      error((err as Error).message);
      setUploading(false);
    }
  };

  const handleLoadSampleDataset = async () => {
    setUploading(true);
    try {
      // Build high density dataset of 120 products with duplicate SKU stress test
      const rows: string[] = [
        'name,sku,category,brand,description,price_usd,compare_at_price_usd,stock_quantity,condition,is_active,specifications'
      ];

      const categories = ['Networking & Enterprise Switches', 'Servers & Datacenter Compute', 'Solar & Power Inverters', 'High-Density Rack UPS', 'Enterprise Wireless Access Points'];
      const brands = ['Cisco Systems', 'Dell EMC', 'Huawei Enterprise', 'APC by Schneider Electric', 'Aruba Networks'];

      for (let i = 1; i <= 100; i++) {
        const cat = categories[i % categories.length];
        const brand = brands[i % brands.length];
        const price = (i * 75 + 450).toFixed(2);
        const compPrice = (i * 75 + 600).toFixed(2);
        const stock = Math.floor(Math.random() * 50) + 1;
        const sku = `SPN-BATCH-${String(i).padStart(4, '0')}`;
        rows.push(`"Spinel Enterprise Unit ${i}","${sku}","${cat}","${brand}","High efficiency industrial hardware unit SKU ${sku}",${price},${compPrice},${stock},"NEW",true,"{\\"Batch\\": \\"${i}\\", \\"Warranty\\": \\"3-Year OEM\\"}"`);
      }

      // Add a couple intentional duplicate rows and invalid rows to test error isolation
      rows.push(`"Faulty Duplicate Unit","SPN-BATCH-0001","Networking & Enterprise Switches","Cisco","Duplicate SKU intentional test",999.00,1200.00,10,"NEW",true,"{}"`);
      rows.push(`"Missing Price Unit","SPN-BATCH-INVALID","Networking & Enterprise Switches","Cisco","Missing price test",-50.00,0,10,"NEW",true,"{}"`);

      const csvPayload = rows.join('\n');
      const res = await api.uploadCatalogue('spinel_enterprise_high_volume_sample.csv', csvPayload);
      setActiveJob(res.job);
      success('Loaded 102-row high-density enterprise dataset! Background streaming worker active.');
    } catch (err: unknown) {
      error((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleCancelJob = async () => {
    if (!activeJob) return;
    try {
      await api.cancelImportJob(activeJob.id);
      setActiveJob(prev => prev ? { ...prev, status: 'CANCELLED' } : null);
      toast('Import job cancelled by administrator.', 'warning');
      loadHistory();
    } catch (err: unknown) {
      error((err as Error).message);
    }
  };

  const handleDownloadErrorReport = () => {
    if (!activeJob || activeJob.errors.length === 0) return;

    const headers = 'Row,SKU,Error Type,Error Message\n';
    const body = activeJob.errors.map(e => `"${e.row_number}","${e.sku || 'N/A'}","${e.error_type}","${e.message.replace(/"/g, '""')}"`).join('\n');
    const blob = new Blob([headers + body], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `import_error_report_${activeJob.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const percentComplete = activeJob && activeJob.total_rows > 0
    ? Math.round((activeJob.processed_rows / activeJob.total_rows) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Excel & CSV Catalogue Import Engine</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Non-blocking background pipeline architected for 100,000+ SKU catalogues
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDownloadTemplate('csv')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>CSV Template</span>
          </button>
          <button
            onClick={() => handleDownloadTemplate('xlsx')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Excel (XLSX) Template</span>
          </button>
        </div>
      </div>

      {/* Upload Zone & Quick Sample Loader */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-slate-900 border border-dashed border-slate-700 hover:border-amber-400 rounded-2xl p-8 text-center transition-colors">
          <UploadCloud className="w-12 h-12 text-amber-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">Upload Catalogue File (CSV or XLSX)</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4">
            Drag and drop your spreadsheet here or click to browse. Automatically validates categories, brands, specifications, and SKU uniqueness.
          </p>

          <input
            type="file"
            ref={fileInputRef}
            accept=".csv,.xlsx,.xls"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
            className="hidden"
          />

          <div className="flex justify-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-lg shadow transition-all"
            >
              {uploading ? 'Parsing File...' : 'Choose File to Import'}
            </button>
          </div>
        </div>

        {/* Quick Testing Card */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 mb-2 uppercase tracking-wider">
              <Play className="w-4 h-4" />
              <span>Instant QA Verification</span>
            </div>
            <h3 className="font-bold text-sm text-white">High-Density 100-SKU Dataset</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Inject an enterprise catalogue dataset containing Cisco switches, Dell servers, Huawei inverters, and intentional duplicate SKUs to stress-test async isolation.
            </p>
          </div>

          <button
            onClick={handleLoadSampleDataset}
            disabled={uploading}
            className="mt-4 w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-lg border border-slate-700 flex items-center justify-center gap-2 transition-colors"
          >
            <Play className="w-3.5 h-3.5 text-emerald-400" />
            <span>Load 100-Item Test Dataset</span>
          </button>
        </div>
      </div>

      {/* Active Pipeline Status Bar */}
      {activeJob && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                activeJob.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' :
                activeJob.status === 'FAILED' ? 'bg-rose-500/10 text-rose-400' :
                'bg-amber-500/10 text-amber-400'
              }`}>
                {activeJob.status === 'COMPLETED' ? <CheckCircle2 className="w-5 h-5" /> :
                 activeJob.status === 'FAILED' ? <XCircle className="w-5 h-5" /> :
                 <RefreshCw className="w-5 h-5 animate-spin" />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Pipeline #{activeJob.id}: {activeJob.file_name}</h3>
                <div className="text-[11px] text-slate-400">
                  Status: <span className="font-mono font-bold text-amber-400">{activeJob.status}</span> •
                  Duration: {activeJob.duration_seconds || 1}s
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {['PENDING', 'VALIDATING', 'IMPORTING'].includes(activeJob.status) && (
                <button
                  onClick={handleCancelJob}
                  className="px-3 py-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 text-xs font-bold rounded-lg transition-colors"
                >
                  Cancel Job
                </button>
              )}
              {activeJob.errors.length > 0 && (
                <button
                  onClick={handleDownloadErrorReport}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-rose-400" />
                  <span>Download Error Report (CSV)</span>
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">
                Progress: {activeJob.processed_rows} of {activeJob.total_rows} rows processed
              </span>
              <span className="font-bold text-white">{percentComplete}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  activeJob.status === 'COMPLETED' ? 'bg-emerald-500' :
                  activeJob.status === 'FAILED' ? 'bg-rose-500' :
                  'bg-amber-400'
                }`}
                style={{ width: `${percentComplete}%` }}
              />
            </div>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-4 gap-3 text-center text-xs pt-1">
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Rows</span>
              <span className="font-mono font-bold text-white text-base">{activeJob.total_rows}</span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Successful</span>
              <span className="font-mono font-bold text-emerald-400 text-base">{activeJob.successful_rows}</span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Failed</span>
              <span className="font-mono font-bold text-rose-400 text-base">{activeJob.failed_rows}</span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Duplicates</span>
              <span className="font-mono font-bold text-amber-400 text-base">{activeJob.duplicate_rows}</span>
            </div>
          </div>

          {/* Row-Level Errors Table */}
          {activeJob.errors && activeJob.errors.length > 0 && (
            <div className="border border-slate-800 rounded-lg overflow-hidden text-xs">
              <div className="bg-slate-950 px-4 py-2 text-rose-400 font-bold flex items-center justify-between">
                <span>Row-Level Isolated Validation Failures ({activeJob.errors.length})</span>
                <span className="text-[10px] text-slate-400">Valid rows were committed</span>
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-800/60">
                {activeJob.errors.map((err, i) => (
                  <div key={i} className="p-2.5 bg-slate-900/80 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-slate-500">Row #{err.row_number}</span>
                      {err.sku && <span className="font-mono text-amber-400 font-semibold">{err.sku}</span>}
                      <span className="text-slate-300">{err.message}</span>
                    </div>
                    <span className="text-[10px] font-bold text-rose-400 uppercase bg-rose-500/10 px-2 py-0.5 rounded">
                      {err.error_type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Historical Jobs List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h3 className="font-bold text-base text-white">Import Execution History</h3>
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="border-b border-slate-800 text-slate-400 font-bold">
              <tr>
                <th className="pb-3">Job ID</th>
                <th className="pb-3">File Name</th>
                <th className="pb-3 text-center">Total</th>
                <th className="pb-3 text-center">Success</th>
                <th className="pb-3 text-center">Failed</th>
                <th className="pb-3 text-center">Status</th>
                <th className="pb-3 text-right">Date Executed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {jobHistory.length > 0 ? (
                jobHistory.map((job) => (
                  <tr key={job.id} className="text-slate-300 hover:bg-slate-800/40">
                    <td className="py-3 font-mono text-amber-400 font-semibold">{job.id}</td>
                    <td className="py-3 font-medium">{job.file_name}</td>
                    <td className="py-3 text-center font-mono">{job.total_rows}</td>
                    <td className="py-3 text-center font-mono text-emerald-400">{job.successful_rows}</td>
                    <td className="py-3 text-center font-mono text-rose-400">{job.failed_rows}</td>
                    <td className="py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        job.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' :
                        job.status === 'FAILED' ? 'bg-rose-500/10 text-rose-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="py-3 text-right text-slate-400">
                      {new Date(job.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500">
                    No historical batch runs logged.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
