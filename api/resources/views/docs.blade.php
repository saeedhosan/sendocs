<!doctype html>
<html>

<head>
    <meta charset="UTF-8">
    <title>Sendocs API</title>
</head>

<body>
    <div id="app"></div>

    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>

    <script>
        Scalar.createApiReference('#app', {
            url: 'docs/openapi.yaml',

            theme: 'none',
            layout: 'modern',

            showSidebar: true,

            hideSearch: true,
            hideModels: true,
            hideClientButton: true,
            hideDarkModeToggle: true,
            hideTestRequestButton: false,

            documentDownloadType: 'none',
            showDeveloperTools: 'never',

            withDefaultFonts: false,
        });
    </script>
</body>

</html>
