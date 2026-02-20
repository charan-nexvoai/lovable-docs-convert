import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileUrl, conversionId } = await req.json();

    if (!fileUrl || !conversionId) {
      return new Response(
        JSON.stringify({ error: 'fileUrl and conversionId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update status to processing
    await supabase
      .from('conversions')
      .update({ status: 'processing' })
      .eq('id', conversionId);

    // Download the PDF file
    const pdfResponse = await fetch(fileUrl);
    if (!pdfResponse.ok) {
      throw new Error(`Failed to download PDF: ${pdfResponse.status}`);
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));

    // Use Lovable AI (Gemini) with vision to extract text from PDF
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `You are an OCR system. Extract ALL text from this PDF document. Preserve the original formatting, paragraphs, headings, lists, and structure as closely as possible. Return ONLY the extracted text, no commentary or explanation. If there are tables, format them clearly with alignment. If there are multiple pages, separate them with "--- Page Break ---".`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${pdfBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 16000,
      }),
    });

    if (!aiResponse.ok) {
      const errorBody = await aiResponse.text();
      throw new Error(`AI API call failed [${aiResponse.status}]: ${errorBody}`);
    }

    const aiData = await aiResponse.json();
    const extractedText = aiData.choices?.[0]?.message?.content || '';

    if (!extractedText) {
      throw new Error('No text could be extracted from the PDF');
    }

    // Count approximate pages
    const pageBreaks = (extractedText.match(/--- Page Break ---/g) || []).length;
    const pageCount = pageBreaks + 1;

    // Update conversion record with extracted text
    await supabase
      .from('conversions')
      .update({
        status: 'completed',
        extracted_text: extractedText,
        page_count: pageCount,
      })
      .eq('id', conversionId);

    return new Response(
      JSON.stringify({
        success: true,
        extractedText,
        pageCount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('OCR processing error:', error);

    // Try to update the conversion status to failed
    try {
      const { conversionId } = await (async () => {
        try {
          return { conversionId: null };
        } catch {
          return { conversionId: null };
        }
      })();
      if (conversionId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase
          .from('conversions')
          .update({ status: 'failed', error_message: (error as Error).message })
          .eq('id', conversionId);
      }
    } catch {}

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
