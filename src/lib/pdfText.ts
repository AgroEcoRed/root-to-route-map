import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

/** Extrae el texto plano de un PDF (archivo local o URL). */
export async function extractPdfText(src: File | string): Promise<string> {
  const data = typeof src === "string" ? { url: src } : { data: new Uint8Array(await src.arrayBuffer()) };
  const doc = await pdfjs.getDocument(data).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map((it: any) => ("str" in it ? it.str : "")).join(" "));
  }
  return pages.join("\n\n").replace(/[ \t]+/g, " ").replace(/-\s+\n?(?=[a-záéíóúñ])/g, "").trim();
}
