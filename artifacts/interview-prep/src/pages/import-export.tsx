import { useState, useRef } from "react";
import { exportData, downloadJson, validateImportData, importData } from "@/lib/importExport";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Download, Upload, CheckCircle, AlertCircle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ImportExportPage() {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [pendingImport, setPendingImport] = useState<ReturnType<typeof validateImportData> extends true ? Parameters<typeof importData>[0] : null>(null);
  const [importFilename, setImportFilename] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await exportData();
      const date = new Date().toISOString().split("T")[0];
      downloadJson(data, `interview-prep-backup-${date}.json`);
      toast({ title: "Export complete", description: "Your data has been saved as a JSON file." });
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFilename(file.name);

    try {
      const text = await file.text();
      const raw = JSON.parse(text);
      if (!validateImportData(raw)) {
        toast({ title: "Invalid file format", description: "The selected file is not a valid InterviewPrep backup.", variant: "destructive" });
        return;
      }
      setPendingImport(raw);
      setConfirmOpen(true);
    } catch {
      toast({ title: "Failed to read file", variant: "destructive" });
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleImportConfirm = async () => {
    if (!pendingImport) return;
    setImporting(true);
    setConfirmOpen(false);
    try {
      await importData(pendingImport, importMode);
      toast({
        title: "Import complete",
        description: `Data imported successfully (${importMode} mode). Refresh to see changes.`,
      });
      setPendingImport(null);
    } catch {
      toast({ title: "Import failed", variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Import / Export</h1>
        <p className="text-muted-foreground text-sm mt-1">Back up your data or migrate from another device</p>
      </div>

      <div className="space-y-4">
        {/* Export */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Download className="h-4 w-4 text-primary" />
              Export Data
            </CardTitle>
            <CardDescription>
              Download all your groups, categories, and questions as a JSON file. Use this to back up your data or transfer it to another device.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleExport} disabled={exporting} data-testid="button-export">
              <Download className="h-4 w-4 mr-2" />
              {exporting ? "Exporting..." : "Download Backup"}
            </Button>
          </CardContent>
        </Card>

        {/* Import */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="h-4 w-4 text-primary" />
              Import Data
            </CardTitle>
            <CardDescription>
              Import a JSON backup file. Choose whether to merge with your existing data or replace it entirely.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              value={importMode}
              onValueChange={(v) => setImportMode(v as "merge" | "replace")}
              className="flex gap-6"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="merge" id="merge" data-testid="radio-merge" />
                <Label htmlFor="merge" className="cursor-pointer">
                  <span className="font-medium">Merge</span>
                  <p className="text-xs text-muted-foreground">Add imported items alongside existing data</p>
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="replace" id="replace" data-testid="radio-replace" />
                <Label htmlFor="replace" className="cursor-pointer">
                  <span className="font-medium">Replace</span>
                  <p className="text-xs text-muted-foreground">Overwrite all existing data with the file</p>
                </Label>
              </div>
            </RadioGroup>

            {importMode === "replace" && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Replace mode will permanently delete all current data before importing.</span>
              </div>
            )}

            <input
              ref={fileRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileSelect}
              data-testid="input-file-import"
            />
            <Button
              variant="outline"
              onClick={() => fileRef.current?.click()}
              disabled={importing}
              data-testid="button-import"
            >
              <Upload className="h-4 w-4 mr-2" />
              {importing ? "Importing..." : "Choose JSON File"}
            </Button>
          </CardContent>
        </Card>

        {/* Info */}
        <div className="flex items-start gap-2 p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <span>All data is stored locally in your browser. No data is ever sent to any server.</span>
        </div>
      </div>

      {/* Confirm import dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Import</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to import <strong>{importFilename}</strong> in <strong>{importMode}</strong> mode.
              {importMode === "replace" && " This will delete all current data."}
              {importMode === "merge" && " Duplicate items will be skipped."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingImport(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleImportConfirm}
              className={importMode === "replace" ? "bg-destructive text-destructive-foreground" : ""}
              data-testid="button-confirm-import"
            >
              Import
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
