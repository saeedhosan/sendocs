<?php

declare(strict_types=1);

namespace App\Portal\Middleware;

use App\Exceptions\ApiException;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class RejectOversizedUploadRequest
{
    public function handle(Request $request, Closure $next): Response
    {
        $contentLength = $request->server('CONTENT_LENGTH');

        if (! is_string($contentLength) && ! is_int($contentLength)) {
            return $next($request);
        }

        if (! ctype_digit((string) $contentLength)) {
            return $next($request);
        }

        $postMaxBytes = $this->postMaxSizeBytes();

        if ($postMaxBytes === 0 || (int) $contentLength <= $postMaxBytes) {
            return $next($request);
        }

        throw new ApiException(
            'file_too_large',
            'The file is larger than 25 MB.',
            413,
        );
    }

    private function postMaxSizeBytes(): int
    {
        $value = trim((string) ini_get('post_max_size'));

        if (preg_match('/^(\d+)\s*([KMG])?$/i', $value, $matches) !== 1) {
            return 0;
        }

        $size = (int) $matches[1];

        return match (strtoupper($matches[2] ?? '')) {
            'K'     => $size * 1024,
            'M'     => $size * 1024 ** 2,
            'G'     => $size * 1024 ** 3,
            default => $size,
        };
    }
}
