const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;

if (!HF_API_KEY) {
  console.warn("⚠️  HUGGINGFACE_API_KEY is not set – Hugging Face summarization will fail.");
} else {
  console.log("✅ HUGGINGFACE_API_KEY loaded, enabling Hugging Face summarization");
}

// Use a more reliable and updated model
const HF_MODEL = "facebook/bart-large-cnn";
const HF_API_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

export async function summarizeWithHuggingFace(transcript, language = "en") {
  if (!HF_API_KEY) {
    throw new Error("Hugging Face API key not configured");
  }

  console.log("▶️ Attempting Hugging Face summarization...");

  // Split long transcripts into chunks (BART has max 1024 tokens)
  const maxLength = 1000;
  let textToSummarize = transcript;
  
  if (transcript.length > maxLength) {
    console.log(`⚠️  Transcript too long (${transcript.length} chars), truncating to ${maxLength}`);
    textToSummarize = transcript.substring(0, maxLength);
  }

  const payload = {
    inputs: textToSummarize,
    parameters: {
      max_length: 150,
      min_length: 30,
      do_sample: false
    },
    options: {
      wait_for_model: true,
      use_cache: false
    }
  };

  let attempt = 0;
  const maxAttempts = 3;

  while (attempt < maxAttempts) {
    attempt++;
    
    try {
      console.log(`🔄 Attempt ${attempt}/${maxAttempts}`);
      
      const response = await fetch(HF_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      console.log("📥 Hugging Face response status:", response.status);
      console.log("📥 Hugging Face response data:", JSON.stringify(data).substring(0, 200));

      if (!response.ok) {
        // If model is loading, wait and retry
        if (data.error && data.error.includes('loading')) {
          const waitTime = data.estimated_time ? data.estimated_time * 1000 : 20000;
          console.log(`⏳ Model loading, waiting ${waitTime/1000}s before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        throw new Error(`Hugging Face API error: ${response.status} ${JSON.stringify(data)}`);
      }

      // Extract summary from response
      let summary;
      if (Array.isArray(data) && data[0]?.summary_text) {
        summary = data[0].summary_text;
      } else if (data.summary_text) {
        summary = data.summary_text;
      } else if (Array.isArray(data) && data[0]?.generated_text) {
        summary = data[0].generated_text;
      } else {
        throw new Error(`Unexpected response format: ${JSON.stringify(data)}`);
      }

      console.log("✅ Hugging Face summary generated successfully");
      return summary.trim();

    } catch (error) {
      if (attempt >= maxAttempts) {
        console.error("❌ Hugging Face API error after all retries:", error.message);
        throw error;
      }
      console.log(`⚠️  Attempt ${attempt} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  throw new Error("Failed after maximum retry attempts");
}
  