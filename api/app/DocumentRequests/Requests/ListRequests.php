<?php

declare(strict_types=1);

namespace App\DocumentRequests\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ListRequests extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return [
            'limit'  => ['sometimes', 'integer', 'min:1', 'max:100'],
            'cursor' => ['sometimes', 'nullable', 'string'],
        ];
    }

    public function limit(): int
    {
        return (int) $this->validated('limit', 20);
    }

    public function cursor(): ?string
    {
        $cursor = $this->validated('cursor');

        return is_string($cursor) ? $cursor : null;
    }
}
