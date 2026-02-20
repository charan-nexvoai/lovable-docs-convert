
-- Create conversions table to track file conversions
CREATE TABLE public.conversions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_filename TEXT NOT NULL,
  original_file_path TEXT NOT NULL,
  converted_file_path TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  extracted_text TEXT,
  page_count INTEGER,
  file_size BIGINT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversions ENABLE ROW LEVEL SECURITY;

-- Public access for now (no auth required for v1)
CREATE POLICY "Allow all access to conversions"
  ON public.conversions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_conversions_updated_at
  BEFORE UPDATE ON public.conversions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('pdf-uploads', 'pdf-uploads', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('converted-files', 'converted-files', true);

-- Storage policies
CREATE POLICY "Allow public upload to pdf-uploads"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'pdf-uploads');

CREATE POLICY "Allow public read from pdf-uploads"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pdf-uploads');

CREATE POLICY "Allow public upload to converted-files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'converted-files');

CREATE POLICY "Allow public read from converted-files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'converted-files');

CREATE POLICY "Allow public delete from pdf-uploads"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'pdf-uploads');

CREATE POLICY "Allow public delete from converted-files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'converted-files');
