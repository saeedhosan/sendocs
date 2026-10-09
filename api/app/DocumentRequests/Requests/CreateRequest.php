<?php

declare(strict_types=1);

namespace App\DocumentRequests\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'         => ['required', 'string', 'min:1', 'max:200'],
            'items'         => ['required', 'array', 'min:1', 'max:10'],
            'items.*'       => ['required', 'array'],
            'items.*.label' => ['required', 'string', 'min:1', 'max:200'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $title = $this->input('title');

        if (is_string($title)) {
            $this->merge(['title' => preg_replace('/\s+/u', ' ', trim($title)) ?? '']);
        }

        $items = $this->input('items');

        if (is_array($items)) {
            $this->merge([
                'items' => array_map(
                    static function (mixed $item): mixed {
                        if (! is_array($item) || ! is_string($item['label'] ?? null)) {
                            return $item;
                        }

                        return [...$item, 'label' => preg_replace('/\s+/u', ' ', trim($item['label'])) ?? ''];
                    },
                    $items,
                ),
            ]);
        }
    }
}
