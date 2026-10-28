
<?php

require __DIR__ . '/vendor/autoload.php';

use Slim\Factory\AppFactory;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

Dotenv\Dotenv::createImmutable(__DIR__)->safeLoad();

$app = AppFactory::create();
$app->setBasePath('/agriguard/api/index.php');

$app->addRoutingMiddleware();
$app->addErrorMiddleware(false, true, true);

function jsonResponse(Response $response, array $data, int $status = 200): Response
{
    $response->getBody()->write(json_encode($data));

    return $response
        ->withStatus($status)
        ->withHeader('Content-Type', 'application/json');
}

function supabaseAuth(string $action, array $payload): array
{
    $url = rtrim($_ENV['SUPABASE_URL'] ?? '', '/');
    $key = $_ENV['SUPABASE_PUBLISHABLE_KEY'] ?? '';

    if ($url === '' || $key === '') {
        return [
            'status' => 500,
            'body' => ['error' => 'Supabase configuration is missing']
        ];
    }

    $curl = curl_init($url . '/auth/v1/' . $action);

    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'apikey: ' . $key,
            'Content-Type: application/json'
        ],
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_TIMEOUT => 20
    ]);

    $result = curl_exec($curl);
    $status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $error = curl_error($curl);

    curl_close($curl);

    if ($result === false) {
        return [
            'status' => 502,
            'body' => ['error' => 'Could not contact authentication service']
        ];
    }

    $data = json_decode($result, true);

    return [
        'status' => $status,
        'body' => is_array($data) ? $data : ['error' => 'Invalid response']
    ];
}

$app->get('/', function (Request $request, Response $response) {
    return jsonResponse($response, [
        'success' => true,
        'message' => 'Agriguard API is running'
    ]);
});

$app->get('/api/health', function (Request $request, Response $response) {
    return jsonResponse($response, [
        'success' => true,
        'api' => 'running',
        'supabase_configured' =>
            !empty($_ENV['SUPABASE_URL']) &&
            !empty($_ENV['SUPABASE_PUBLISHABLE_KEY'])
    ]);
});

$app->post('/api/auth/register', function (Request $request, Response $response) {
    $input = json_decode((string) $request->getBody(), true);

    if (!is_array($input)) {
        return jsonResponse($response, ['error' => 'Invalid JSON'], 400);
    }

    $email = filter_var($input['email'] ?? '', FILTER_VALIDATE_EMAIL);
    $firstName = $input['first_name'] ?? '';
$lastName = $input['last_name'] ?? '';

if (
    !is_string($firstName) ||
    !is_string($lastName) ||
    trim($firstName) === '' ||
    trim($lastName) === '' ||
    mb_strlen(trim($firstName)) > 60 ||
    mb_strlen(trim($lastName)) > 60
) {
    return jsonResponse($response, [
        'error' => 'Enter a valid first name and last name (maximum 60 characters each)'
    ], 400);
}

$firstName = trim($firstName);
$lastName = trim($lastName);
    $password = $input['password'] ?? '';

    if (!$email || !is_string($password) || strlen($password) < 8) {
        return jsonResponse($response, [
            'error' => 'Enter a valid email and a password of at least 8 characters'
        ], 400);
    }
     $result = supabaseAuth('signup', [
    'email' => $email,
    'password' => $password,
    'data' => [
        'first_name' => $firstName,
        'last_name' => $lastName,
        'full_name' => $firstName . ' ' . $lastName
    ]
]);

    return jsonResponse($response, $result['body'], $result['status']);
});

$app->post('/api/auth/login', function (Request $request, Response $response) {
    $input = json_decode((string) $request->getBody(), true);

    if (!is_array($input)) {
        return jsonResponse($response, ['error' => 'Invalid JSON'], 400);
    }

    $email = filter_var($input['email'] ?? '', FILTER_VALIDATE_EMAIL);
    $password = $input['password'] ?? '';

    if (!$email || !is_string($password) || $password === '') {
        return jsonResponse($response, [
            'error' => 'Enter a valid email and password'
        ], 400);
    }

    $result = supabaseAuth('token?grant_type=password', [
        'email' => $email,
        'password' => $password
    ]);

    return jsonResponse($response, $result['body'], $result['status']);
});

function supabaseRest(
    string $method,
    string $endpoint,
    string $accessToken,
    ?array $payload = null
): array {
    $url = rtrim($_ENV['SUPABASE_URL'] ?? '', '/');
    $key = $_ENV['SUPABASE_PUBLISHABLE_KEY'] ?? '';

    if ($url === '' || $key === '') {
        return [
            'status' => 500,
            'body' => ['error' => 'Supabase configuration is missing']
        ];
    }

    $curl = curl_init($url . '/rest/v1/' . $endpoint);

    $headers = [
        'apikey: ' . $key,
        'Authorization: Bearer ' . $accessToken,
        'Content-Type: application/json',
        'Accept: application/json'
    ];

    if ($method === 'POST') {
        $headers[] = 'Prefer: return=representation';
    }

    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_TIMEOUT => 20
    ]);

    if ($payload !== null) {
        curl_setopt(
            $curl,
            CURLOPT_POSTFIELDS,
            json_encode($payload)
        );
    }

    $result = curl_exec($curl);
    $status = curl_getinfo($curl, CURLINFO_HTTP_CODE);

    curl_close($curl);

    if ($result === false) {
        return [
            'status' => 502,
            'body' => ['error' => 'Could not contact Supabase']
        ];
    }

    $data = json_decode($result, true);

    return [
        'status' => $status,
        'body' => is_array($data)
            ? $data
            : ['message' => $result]
    ];
}

function getAccessToken(Request $request): ?string
{
    $header = $request->getHeaderLine('Authorization');

    if (!preg_match('/^Bearer\s+(\S+)$/i', $header, $matches)) {
        return null;
    }

    return $matches[1];
}

function getAuthenticatedUser(string $token): array
{
    $url = rtrim($_ENV['SUPABASE_URL'] ?? '', '/');
    $key = $_ENV['SUPABASE_PUBLISHABLE_KEY'] ?? '';

    if ($url === '' || $key === '') {
        return ['status' => 500, 'body' => ['error' => 'Supabase configuration is missing']];
    }

    $curl = curl_init($url . '/auth/v1/user');

    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'apikey: ' . $key,
            'Authorization: Bearer ' . $token
        ],
        CURLOPT_TIMEOUT => 20
    ]);

    $result = curl_exec($curl);
    $status = curl_getinfo($curl, CURLINFO_HTTP_CODE);

    curl_close($curl);

    if ($result === false) {
        return ['status' => 502, 'body' => ['error' => 'Authentication service unavailable']];
    }

    $data = json_decode($result, true);

    return [
        'status' => $status,
        'body' => is_array($data) ? $data : []
    ];
}

$app->post('/api/crop-reports', function (
    Request $request,
    Response $response
) {
    $token = getAccessToken($request);

    if ($token === null) {
        return jsonResponse($response, ['error' => 'Bearer token required'], 401);
    }

    $user = getAuthenticatedUser($token);

    if ($user['status'] !== 200 || empty($user['body']['id'])) {
        return jsonResponse($response, ['error' => 'Invalid or expired access token'], 401);
    }

    $input = json_decode((string) $request->getBody(), true);

    if (!is_array($input)) {
        return jsonResponse($response, ['error' => 'Invalid JSON'], 400);
    }

    $cropName = trim($input['crop_name'] ?? '');

    if ($cropName === '' || strlen($cropName) > 150) {
        return jsonResponse($response, ['error' => 'A valid crop_name is required'], 400);
    }

    $payload = [
        'user_id' => $user['body']['id'],
        'crop_name' => $cropName
    ];

    foreach (['image_path', 'predicted_disease', 'notes'] as $field) {
        if (isset($input[$field])) {
            if (!is_string($input[$field])) {
                return jsonResponse($response, ['error' => "$field must be a string"], 400);
            }

            $payload[$field] = trim($input[$field]);
        }
    }

    if (isset($input['confidence'])) {
        if (!is_numeric($input['confidence'])) {
            return jsonResponse($response, ['error' => 'confidence must be numeric'], 400);
        }

        $confidence = (float) $input['confidence'];

        if ($confidence < 0 || $confidence > 1) {
            return jsonResponse($response, ['error' => 'confidence must be between 0 and 1'], 400);
        }

        $payload['confidence'] = $confidence;
    }

    $result = supabaseRest(
        'POST',
        'crop_reports',
        $token,
        $payload
    );

    return jsonResponse($response, $result['body'], $result['status']);
});

$app->get('/api/crop-reports', function (
    Request $request,
    Response $response
) {
    $token = getAccessToken($request);

    if ($token === null) {
        return jsonResponse($response, ['error' => 'Bearer token required'], 401);
    }

    $user = getAuthenticatedUser($token);

    if ($user['status'] !== 200 || empty($user['body']['id'])) {
        return jsonResponse($response, ['error' => 'Invalid or expired access token'], 401);
    }

    $result = supabaseRest(
        'GET',
        'crop_reports?select=*&order=created_at.desc',
        $token
    );

    return jsonResponse($response, $result['body'], $result['status']);
});

$app->get('/api/crop-reports/{id}', function (
    Request $request,
    Response $response,
    array $args
) {
    $token = getAccessToken($request);

    if ($token === null) {
        return jsonResponse($response, ['error' => 'Bearer token required'], 401);
    }

    $user = getAuthenticatedUser($token);

    if ($user['status'] !== 200 || empty($user['body']['id'])) {
        return jsonResponse($response, ['error' => 'Invalid or expired access token'], 401);
    }

    $id = $args['id'];

    if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $id)) {
        return jsonResponse($response, ['error' => 'Invalid report ID'], 400);
    }

    $result = supabaseRest(
        'GET',
        'crop_reports?select=*&id=eq.' . rawurlencode($id) . '&limit=1',
        $token
    );

    if ($result['status'] < 200 || $result['status'] >= 300) {
        return jsonResponse($response, $result['body'], $result['status']);
    }

    if (empty($result['body'])) {
        return jsonResponse($response, ['error' => 'Report not found'], 404);
    }

    return jsonResponse($response, $result['body'][0], 200);
});

require __DIR__ . '/ai_routes.php';
require __DIR__ . '/community_routes.php';
require __DIR__ . '/scan_history_routes.php';
require __DIR__ . '/farm_routes.php';
require __DIR__ . '/crop_routes.php';

$app->run();