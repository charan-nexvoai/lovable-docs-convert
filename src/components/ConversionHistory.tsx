import { motion } from "framer-motion";
import { FileText, Download, Clock, FileType2 } from "lucide-react";
import { formatFileSize, generateWordDocument } from "@/lib/conversion";
import { Button } from "@/components/ui/button";

interface Conversion {
  id: string;
  original_filename: string;
  status: string;
  extracted_text: string | null;
  page_count: number | null;
  file_size: number | null;
  created_at: string;
}

interface ConversionHistoryProps {
  conversions: Conversion[];
}

const ConversionHistory = ({ conversions }: ConversionHistoryProps) => {
  if (conversions.length === 0) return null;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h2 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-muted-foreground" />
        Recent Conversions
      </h2>
      <div className="space-y-3">
        {conversions.map((conv, i) => (
          <motion.div
            key={conv.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/20 transition-colors"
            style={{ boxShadow: "var(--shadow-sm)" }}
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground text-sm truncate">{conv.original_filename}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                {conv.file_size && <span>{formatFileSize(conv.file_size)}</span>}
                {conv.page_count && <span>{conv.page_count} pages</span>}
                <span>{new Date(conv.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`
                  px-2.5 py-1 rounded-full text-xs font-medium
                  ${conv.status === "completed" ? "bg-success/10 text-success" : ""}
                  ${conv.status === "failed" ? "bg-destructive/10 text-destructive" : ""}
                  ${conv.status === "processing" ? "bg-primary/10 text-primary" : ""}
                  ${conv.status === "pending" ? "bg-muted text-muted-foreground" : ""}
                `}
              >
                {conv.status}
              </span>
              {conv.status === "completed" && conv.extracted_text && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => generateWordDocument(conv.extracted_text!, conv.original_filename)}
                  className="text-primary hover:text-primary"
                >
                  <Download className="w-4 h-4 mr-1" />
                  <FileType2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ConversionHistory;
