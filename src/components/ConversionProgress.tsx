import { motion } from "framer-motion";
import { Loader2, CheckCircle2, AlertCircle, FileText } from "lucide-react";

type Status = "pending" | "processing" | "completed" | "failed";

interface ConversionProgressProps {
  status: Status;
  filename: string;
  errorMessage?: string;
}

const statusConfig: Record<Status, { icon: typeof Loader2; label: string; color: string }> = {
  pending: { icon: Loader2, label: "Preparing...", color: "text-muted-foreground" },
  processing: { icon: Loader2, label: "Extracting text with AI OCR...", color: "text-primary" },
  completed: { icon: CheckCircle2, label: "Conversion complete!", color: "text-success" },
  failed: { icon: AlertCircle, label: "Conversion failed", color: "text-destructive" },
};

const ConversionProgress = ({ status, filename, errorMessage }: ConversionProgressProps) => {
  const config = statusConfig[status];
  const Icon = config.icon;
  const isSpinning = status === "pending" || status === "processing";

  const steps = [
    { label: "Upload PDF", done: true },
    { label: "OCR Processing", done: status === "completed" || status === "failed", active: status === "processing" },
    { label: "Generate Document", done: status === "completed" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="p-6 rounded-2xl bg-card border border-border" style={{ boxShadow: "var(--shadow-md)" }}>
        {/* File info */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-medium text-foreground truncate text-sm">{filename}</p>
          </div>
          <div className={`flex items-center gap-2 ${config.color}`}>
            <Icon className={`w-5 h-5 ${isSpinning ? "animate-spin" : ""}`} />
            <span className="text-sm font-medium">{config.label}</span>
          </div>
        </div>

        {/* Progress steps */}
        <div className="flex items-center gap-2">
          {steps.map((step, i) => (
            <div key={step.label} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`
                    w-full h-2 rounded-full transition-all duration-500
                    ${step.done ? "bg-gradient-primary" : step.active ? "bg-primary/30 animate-pulse-soft" : "bg-muted"}
                  `}
                />
                <span className={`text-xs mt-2 ${step.done ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && <div className="w-2" />}
            </div>
          ))}
        </div>

        {/* Error message */}
        {status === "failed" && errorMessage && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-sm text-destructive bg-destructive/10 rounded-lg p-3"
          >
            {errorMessage}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
};

export default ConversionProgress;
