import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

let __pdfWorkerInitialized = false;
function ensurePdfWorker() {
  if (__pdfWorkerInitialized) return;
  if (typeof window !== 'undefined') {
    try {
      const worker = new Worker(new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url), { type: 'module' });
      (pdfjsLib as any).GlobalWorkerOptions.workerPort = worker;
      __pdfWorkerInitialized = true;
    } catch (e) {
      // If the ESM worker fails, keep default behavior (fake worker) without CDN.
      __pdfWorkerInitialized = false;
    }
  }
}

export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Creates a valid WAV file Blob from raw PCM audio data.
 * @param pcmData The raw PCM audio data (Int16).
 * @param options Configuration for the WAV header.
 * @returns A Blob representing the WAV file.
 */
export function createWavBlob(pcmData: Uint8Array, options: { sampleRate?: number } = {}): Blob {
    const sampleRate = options.sampleRate || 24000; // Gemini TTS default sample rate
    const numChannels = 1; // Mono
    const bitsPerSample = 16; // 16-bit PCM

    const dataSize = pcmData.length;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // RIFF chunk descriptor
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true); // chunkSize
    writeString(view, 8, 'WAVE');

    // "fmt " sub-chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // audioFormat (1 for PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true); // byteRate
    view.setUint16(32, numChannels * (bitsPerSample / 8), true); // blockAlign
    view.setUint16(34, bitsPerSample, true);

    // "data" sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Write the PCM data
    new Uint8Array(buffer, 44).set(pcmData);

    return new Blob([view], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

export const fileToText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (e) => {
            const arrayBuffer = e.target?.result as ArrayBuffer;

            if (file.type === 'application/pdf') {
                ensurePdfWorker();
                const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
                let fullText = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
                }
                resolve(fullText);
            } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.type === 'application/msword') {
                // .docx or .doc
                try {
                    const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
                    resolve(result.value);
                } catch (error) {
                    reject(error);
                }
            } else {
                reject(new Error('Tipo de arquivo não suportado para extração de texto.'));
            }
        };

        reader.onerror = error => reject(error);

        reader.readAsArrayBuffer(file);
    });
};
