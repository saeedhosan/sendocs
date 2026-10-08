<?php

declare(strict_types=1);

namespace App\DocumentRequests\Services;

use Illuminate\Http\UploadedFile;
use ZipArchive;

final readonly class DocumentTypeDetector
{
    /**
     * @var array<string, string>
     */
    private const IMAGE_AND_TEXT_TYPES = [
        'pdf' => 'application/pdf',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        'txt' => 'text/plain',
        'csv' => 'text/csv',
    ];

    /**
     * @return array{extension: string, mimeType: string}|null
     */
    public function detect(UploadedFile $file): ?array
    {
        $extension = strtolower($file->getClientOriginalExtension());

        if (! in_array($extension, ['pdf', 'jpg', 'jpeg', 'png', 'docx', 'xlsx', 'csv', 'txt'], true)) {
            return null;
        }

        $path = $file->getRealPath();

        if (! is_string($path)) {
            return null;
        }

        $mimeType = $this->sniffMimeType($path);

        return match ($extension) {
            'docx' => $this->isOpenXmlDocument($path, 'word/') && $mimeType === 'application/zip'
                ? ['extension' => $extension, 'mimeType' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
                : null,
            'xlsx' => $this->isOpenXmlDocument($path, 'xl/') && $mimeType === 'application/zip'
                ? ['extension' => $extension, 'mimeType' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
                : null,
            'csv' => $mimeType === 'text/csv' || ($mimeType === 'text/plain' && $this->looksLikeCsv($path))
                ? ['extension' => $extension, 'mimeType' => 'text/csv']
                : null,
            default => isset(self::IMAGE_AND_TEXT_TYPES[$extension])
                && $mimeType === self::IMAGE_AND_TEXT_TYPES[$extension]
                ? ['extension' => $extension, 'mimeType' => self::IMAGE_AND_TEXT_TYPES[$extension]]
                : null,
        };
    }

    private function sniffMimeType(string $path): ?string
    {
        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($path);

        return is_string($mimeType) ? $mimeType : null;
    }

    private function isOpenXmlDocument(string $path, string $requiredPrefix): bool
    {
        $zip = new ZipArchive();

        if ($zip->open($path) !== true) {
            return false;
        }

        $contentTypes = $zip->getFromName('[Content_Types].xml');
        $hasRequiredPart = false;

        if (is_string($contentTypes)) {
            $hasRequiredPart = $this->containsOpenXmlPart($zip, $requiredPrefix)
                && ! str_contains($contentTypes, 'macroEnabled');
        }

        $zip->close();

        return $hasRequiredPart;
    }

    private function containsOpenXmlPart(ZipArchive $zip, string $prefix): bool
    {
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $name = $zip->getNameIndex($i);

            if (is_string($name) && str_starts_with($name, $prefix)) {
                return true;
            }
        }

        return false;
    }

    private function looksLikeCsv(string $path): bool
    {
        $contents = file_get_contents($path, false, null, 0, 8192);

        if (! is_string($contents) || $contents === '' || str_contains($contents, "\0")) {
            return false;
        }

        $lines = preg_split('/\R/', trim($contents));

        if (! is_array($lines) || $lines === []) {
            return false;
        }

        $first = str_getcsv((string) $lines[0]);

        return count($first) >= 2;
    }
}
