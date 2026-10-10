/*
 * Client-side pre-checks for the portal uploader.
 *
 * These mirror `api/docs/openapi.yaml` (25 MB cap, the accepted types) so a
 * doomed transfer never touches the network. The server still sniffs the real
 * content type; this check is a courtesy, never the authority.
 */

export const MAX_FILE_SIZE = 25 * 1024 * 1024
export const MAX_ITEMS = 10

export const ACCEPTED_EXTENSIONS = [
  'pdf',
  'jpg',
  'jpeg',
  'png',
  'docx',
  'xlsx',
  'csv',
  'txt',
] as const

export const ACCEPT_ATTRIBUTE = ACCEPTED_EXTENSIONS.map(
  (extension) => `.${extension}`,
).join(',')

export const ACCEPTED_TYPES_LABEL = 'PDF, JPEG, PNG, DOCX, XLSX, CSV, or TXT'

export type PrecheckCode = 'file_too_large' | 'unsupported_type'

export type PrecheckResult =
  | { ok: true }
  | { ok: false; code: PrecheckCode }

/*
 * Browser-declared MIME types that are acceptable for each extension. An empty
 * `file.type` is allowed through because some browsers cannot identify a file;
 * the server stays authoritative in that case.
 */
const MIME_BY_EXTENSION: Record<string, string[]> = {
  pdf: ['application/pdf'],
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  png: ['image/png'],
  docx: [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/zip',
  ],
  xlsx: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/zip',
  ],
  csv: ['text/csv', 'application/csv', 'text/plain', 'application/vnd.ms-excel'],
  txt: ['text/plain'],
}

function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.')

  if (dot < 0 || dot === name.length - 1) {
    return ''
  }

  return name.slice(dot + 1).toLowerCase()
}

function isAcceptedExtension(extension: string): boolean {
  return (ACCEPTED_EXTENSIONS as readonly string[]).includes(extension)
}

export function precheck(file: File): PrecheckResult {
  if (file.size > MAX_FILE_SIZE) {
    return { ok: false, code: 'file_too_large' }
  }

  const extension = extensionOf(file.name)

  if (!isAcceptedExtension(extension)) {
    return { ok: false, code: 'unsupported_type' }
  }

  const type = file.type.toLowerCase()
  const allowed = MIME_BY_EXTENSION[extension] ?? []

  if (type !== '' && !allowed.includes(type)) {
    return { ok: false, code: 'unsupported_type' }
  }

  return { ok: true }
}
