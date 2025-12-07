/**
 * Minimal ZIP extractor using Node.js built-in modules
 *
 * ZIP file format: https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT
 */

import { inflateRawSync } from 'zlib';

interface ZipEntry {
  filename: string;
  compressedSize: number;
  uncompressedSize: number;
  compressionMethod: number;
  offset: number;
}

interface ZipFile {
  entries: Map<string, ZipEntry>;
  buffer: Buffer;
}

/**
 * Parse ZIP file and return entries
 */
export function parseZip(buffer: Buffer): ZipFile {
  const entries = new Map<string, ZipEntry>();

  // Find End of Central Directory record (EOCD)
  // Signature: 0x06054b50
  let eocdOffset = -1;
  for (let i = buffer.length - 22; i >= 0; i--) {
    if (
      buffer[i] === 0x50 &&
      buffer[i + 1] === 0x4b &&
      buffer[i + 2] === 0x05 &&
      buffer[i + 3] === 0x06
    ) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset === -1) {
    throw new Error('Invalid ZIP file: EOCD not found');
  }

  // Read EOCD
  const centralDirOffset = buffer.readUInt32LE(eocdOffset + 16);
  const centralDirSize = buffer.readUInt32LE(eocdOffset + 12);
  const totalEntries = buffer.readUInt16LE(eocdOffset + 10);

  // Parse Central Directory
  let offset = centralDirOffset;
  for (let i = 0; i < totalEntries; i++) {
    // Central Directory File Header signature: 0x02014b50
    if (
      buffer[offset] !== 0x50 ||
      buffer[offset + 1] !== 0x4b ||
      buffer[offset + 2] !== 0x01 ||
      buffer[offset + 3] !== 0x02
    ) {
      throw new Error('Invalid Central Directory entry');
    }

    const compressionMethod = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const uncompressedSize = buffer.readUInt32LE(offset + 24);
    const filenameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);

    const filename = buffer.toString('utf8', offset + 46, offset + 46 + filenameLength);

    entries.set(filename, {
      filename,
      compressedSize,
      uncompressedSize,
      compressionMethod,
      offset: localHeaderOffset,
    });

    offset += 46 + filenameLength + extraLength + commentLength;
  }

  return { entries, buffer };
}

/**
 * Extract a file from the ZIP
 */
export function extractFile(zip: ZipFile, filename: string): Buffer {
  const entry = zip.entries.get(filename);
  if (!entry) {
    throw new Error(`File not found in ZIP: ${filename}`);
  }

  const { buffer } = zip;
  const offset = entry.offset;

  // Verify Local File Header signature: 0x04034b50
  if (
    buffer[offset] !== 0x50 ||
    buffer[offset + 1] !== 0x4b ||
    buffer[offset + 2] !== 0x03 ||
    buffer[offset + 3] !== 0x04
  ) {
    throw new Error('Invalid Local File Header');
  }

  const filenameLength = buffer.readUInt16LE(offset + 26);
  const extraLength = buffer.readUInt16LE(offset + 28);
  const dataStart = offset + 30 + filenameLength + extraLength;
  const compressedData = buffer.subarray(dataStart, dataStart + entry.compressedSize);

  // Decompress if needed
  if (entry.compressionMethod === 0) {
    // Stored (no compression)
    return compressedData;
  } else if (entry.compressionMethod === 8) {
    // Deflate
    return inflateRawSync(compressedData);
  } else {
    throw new Error(`Unsupported compression method: ${entry.compressionMethod}`);
  }
}

/**
 * List all files in the ZIP
 */
export function listFiles(zip: ZipFile): string[] {
  return Array.from(zip.entries.keys());
}

/**
 * Check if file exists in ZIP
 */
export function hasFile(zip: ZipFile, filename: string): boolean {
  return zip.entries.has(filename);
}
