import { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Download, Upload, FileSpreadsheet, Loader2 } from 'lucide-react';
import { downloadExcelExport, downloadTemplate, uploadImport, ExportEntity } from '@/lib/export';

interface ImportExportButtonsProps {
    entity: ExportEntity;
    onImportComplete?: (result: { success: number; failed: number }) => void;
    showExport?: boolean;
    showImport?: boolean;
    showTemplate?: boolean;
    variant?: 'default' | 'outline';
    size?: 'default' | 'sm' | 'lg';
}

export function ImportExportButtons({
    entity,
    onImportComplete,
    showExport = true,
    showImport = true,
    showTemplate = true,
    variant = 'default',
    size = 'sm',
}: ImportExportButtonsProps) {
    const [loading, setLoading] = useState<'export' | 'template' | 'import' | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = async () => {
        try {
            setLoading('export');
            await downloadExcelExport(entity);
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setLoading(null);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            setLoading('template');
            await downloadTemplate(entity);
        } catch (error) {
            console.error('Template download failed:', error);
        } finally {
            setLoading(null);
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setLoading('import');
            const result = await uploadImport(entity, file);
            onImportComplete?.(result);
            
            if (result.failed > 0) {
                alert(`Import completed: ${result.success} succeeded, ${result.failed} failed.\n\nErrors:\n${result.errors.slice(0, 5).join('\n')}`);
            } else {
                alert(`Import completed successfully! ${result.success} records imported.`);
            }
        } catch (error) {
            console.error('Import failed:', error);
            alert('Import failed. Please check the file format and try again.');
        } finally {
            setLoading(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className="flex gap-2">
            {showExport && (
                <Button
                    variant={variant}
                    size={size}
                    onClick={handleExport}
                    disabled={loading !== null}
                >
                    {loading === 'export' ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                        <Download className="w-4 h-4 mr-2" />
                    )}
                    Export
                </Button>
            )}
            
            {showTemplate && (
                <Button
                    variant="outline"
                    size={size}
                    onClick={handleDownloadTemplate}
                    disabled={loading !== null}
                >
                    {loading === 'template' ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                    )}
                    Template
                </Button>
            )}
            
            {showImport && (
                <>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <Button
                        variant="outline"
                        size={size}
                        onClick={handleImportClick}
                        disabled={loading !== null}
                    >
                        {loading === 'import' ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                            <Upload className="w-4 h-4 mr-2" />
                        )}
                        Import
                    </Button>
                </>
            )}
        </div>
    );
}
