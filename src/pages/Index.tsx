import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { FileType2, Sparkles, Download } from "lucide-react";
import FileDropZone from "@/components/FileDropZone";
import ConversionProgress from "@/components/ConversionProgress";
import ConversionHistory from "@/components/ConversionHistory";
import { Button } from "@/components/ui/button";
import {
  uploadPdf,
  createConversion,
  processOcr,
  getConversions,
  generateWordDocument,
} from "@/lib/conversion";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<"pending" | "processing" | "completed" | "failed" | null>(null);
  const [currentFilename, setCurrentFilename] = useState("");
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [conversions, setConversions] = useState<any[]>([]);

  const loadConversions = useCallback(async () => {
    try {
      const data = await getConversions();
      setConversions(data || []);
    } catch (e) {
      console.error("Failed to load conversions:", e);
    }
  }, []);

  useEffect(() => {
    loadConversions();
  }, [loadConversions]);

  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);
    setCurrentStatus("pending");
    setCurrentFilename(file.name);
    setExtractedText(null);
    setErrorMessage(undefined);

    try {
      // Step 1: Upload PDF
      const { publicUrl, filePath } = await uploadPdf(file);

      // Step 2: Create conversion record
      const conversion = await createConversion(file.name, filePath, file.size);

      // Step 3: Process OCR
      setCurrentStatus("processing");
      const result = await processOcr(publicUrl, conversion.id);

      if (result.success) {
        setCurrentStatus("completed");
        setExtractedText(result.extractedText);
        toast({
          title: "Conversion complete!",
          description: "Your PDF has been processed. Download the Word document below.",
        });
      } else {
        throw new Error(result.error || "OCR processing failed");
      }
    } catch (error: any) {
      setCurrentStatus("failed");
      setErrorMessage(error.message);
      toast({
        title: "Conversion failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      loadConversions();
    }
  };

  const handleDownload = () => {
    if (extractedText && currentFilename) {
      generateWordDocument(extractedText, currentFilename);
    }
  };

  const handleReset = () => {
    setCurrentStatus(null);
    setCurrentFilename("");
    setExtractedText(null);
    setErrorMessage(undefined);
  };

  return (
    <div className="min-h-screen bg-gradient-surface">
      {/* Header */}
      <header className="w-full border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center">
              <FileType2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="font-display text-xl font-bold text-foreground">DocuScan</h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Powered OCR</span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 py-12">
        {/* Hero section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground leading-tight">
            PDF to Word,{" "}
            <span className="text-gradient">powered by AI</span>
          </h2>
          <p className="text-muted-foreground text-lg mt-4 max-w-lg mx-auto">
            Upload any PDF — scanned or digital — and get an editable Word document in seconds using advanced OCR.
          </p>
        </motion.div>

        {/* Upload / Progress area */}
        <div className="space-y-8">
          {!currentStatus && (
            <FileDropZone onFileSelect={handleFileSelect} isProcessing={isProcessing} />
          )}

          {currentStatus && (
            <>
              <ConversionProgress
                status={currentStatus}
                filename={currentFilename}
                errorMessage={errorMessage}
              />

              {/* Action buttons */}
              {currentStatus === "completed" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center gap-4"
                >
                  <Button
                    onClick={handleDownload}
                    className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90 transition-opacity px-6 h-12 text-base font-display"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Download .docx
                  </Button>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="h-12 px-6 text-base font-display"
                  >
                    Convert Another
                  </Button>
                </motion.div>
              )}

              {currentStatus === "failed" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-center"
                >
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="h-12 px-6 text-base font-display"
                  >
                    Try Again
                  </Button>
                </motion.div>
              )}
            </>
          )}

          {/* Text preview */}
          {extractedText && currentStatus === "completed" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-2xl mx-auto"
            >
              <h3 className="font-display text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                Extracted Text Preview
              </h3>
              <div
                className="p-6 rounded-2xl bg-card border border-border text-sm text-foreground leading-relaxed max-h-64 overflow-y-auto whitespace-pre-wrap font-body"
                style={{ boxShadow: "var(--shadow-sm)" }}
              >
                {extractedText.slice(0, 2000)}
                {extractedText.length > 2000 && (
                  <span className="text-muted-foreground">... (preview truncated)</span>
                )}
              </div>
            </motion.div>
          )}

          {/* History */}
          <div className="pt-8">
            <ConversionHistory conversions={conversions} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-20 py-6">
        <div className="max-w-5xl mx-auto px-4 text-center text-xs text-muted-foreground">
          <p>DocuScan — AI-powered document conversion</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
