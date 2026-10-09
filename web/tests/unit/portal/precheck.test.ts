import { describe, expect, it } from 'vitest'
import {
  ACCEPTED_EXTENSIONS,
  MAX_FILE_SIZE,
  precheck,
} from '../../../src/features/portal/precheck'

function makeFile(name: string, type = '', size = 1024): File {
  const file = new File(['contents'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('precheck', () => {
  it('accepts a file exactly at the cap and rejects one byte over', () => {
    expect(precheck(makeFile('scan.pdf', 'application/pdf', MAX_FILE_SIZE))).toEqual({
      ok: true,
    })
    expect(
      precheck(makeFile('scan.pdf', 'application/pdf', MAX_FILE_SIZE + 1)),
    ).toEqual({ ok: false, code: 'file_too_large' })
  })

  it('accepts every allowed extension', () => {
    const types: Record<string, string> = {
      pdf: 'application/pdf',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      csv: 'text/csv',
      txt: 'text/plain',
    }

    for (const extension of ACCEPTED_EXTENSIONS) {
      expect(precheck(makeFile(`file.${extension}`, types[extension]))).toEqual({
        ok: true,
      })
    }
  })

  it('rejects a disallowed extension', () => {
    expect(precheck(makeFile('archive.zip', 'application/zip'))).toEqual({
      ok: false,
      code: 'unsupported_type',
    })
  })

  it('rejects a file whose declared type disagrees with its extension', () => {
    expect(precheck(makeFile('scan.pdf', 'image/png'))).toEqual({
      ok: false,
      code: 'unsupported_type',
    })
  })

  it('allows an unknown browser MIME type through for the server to sniff', () => {
    expect(precheck(makeFile('scan.pdf', ''))).toEqual({ ok: true })
  })
})
