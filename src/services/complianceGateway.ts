import { AiModerationResult, ContentCategory } from '../types/broadcast';

export interface ComplianceAnalysisResponse extends AiModerationResult {
  complianceScore?: number;
  isJournalisticOrHumanitarian?: boolean;
}

/**
 * Calls the server-side Bengal TV Gemini AI Censorship & Broadcast Compliance Gateway (/api/compliance/analyze).
 * Strictly enforces journalistic news and humanitarian/mankind documentary standards.
 */
export async function analyzeContentStandards(
  title: string,
  description: string,
  sourceUrl: string,
  claimedCategory?: string,
  location?: string,
  transcriptNotes?: string
): Promise<ComplianceAnalysisResponse> {
  const response = await fetch('/api/compliance/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
      description,
      sourceUrl,
      claimedCategory: claimedCategory || 'NEWS',
      location: location || '',
      transcriptNotes: transcriptNotes || '',
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || `Compliance server returned HTTP ${response.status}`);
  }

  return data as ComplianceAnalysisResponse;
}

export async function uploadVideoBinary(
  file: File
): Promise<{ videoUrl: string; fileName: string; bytes: number }> {
  const response = await fetch('/api/uploads', {
    method: 'POST',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
      'X-File-Name': encodeURIComponent(file.name),
    },
    body: file,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || `Upload failed with HTTP ${response.status}`);
  }

  return data as { videoUrl: string; fileName: string; bytes: number };
}
