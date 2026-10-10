<?php

declare(strict_types=1);

namespace App\Portal\Middleware;

use App\Exceptions\ApiException;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class RejectOversizedUploadBody
{
    public function handle(Request $request, Closure $next): Response
    {
        $contentLength = $request->server('CONTENT_LENGTH');
        $postMaxSize = ini_get('post_max_size');

        if (
            is_string($contentLength)
            && ctype_digit($contentLength)
            && is_string($postMaxSize)
        ) {
            $postMaxBytes = ini_parse_quantity($postMaxSize);

            if ($postMaxBytes > 0 && (int) $contentLength > $postMaxBytes) {
                throw new ApiException(
                    'file_too_large',
                    'The file is larger than 25 MB.',
                    413,
                );
            }
        }

        return $next($request);
    }
}
