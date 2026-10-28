
<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

// Register a farm belonging to the logged-in farmer.
$app->post('/api/farms', function (
    Request $request,
    Response $response
) {
    $token = getAccessToken($request);

    if ($token === null) {
        return jsonResponse($response, [
            'error' => 'Bearer token required'
        ], 401);
    }

    $user = getAuthenticatedUser($token);

    if (
        $user['status'] !== 200 ||
        empty($user['body']['id'])
    ) {
        return jsonResponse($response, [
            'error' => 'Invalid or expired access token'
        ], 401);
    }

    $input = json_decode(
        (string) $request->getBody(),
        true
    );

    if (!is_array($input)) {
        return jsonResponse($response, [
            'error' => 'Invalid JSON'
        ], 400);
    }

    $farmName = $input['farm_name'] ?? null;
    $province = $input['province'] ?? null;

    if (
        !is_string($farmName) ||
        trim($farmName) === '' ||
        strlen(trim($farmName)) > 150
    ) {
        return jsonResponse($response, [
            'error' => 'A valid farm name is required'
        ], 400);
    }

    if (
        $province !== null &&
        (!is_string($province) ||
         strlen(trim($province)) > 100)
    ) {
        return jsonResponse($response, [
            'error' => 'Invalid province'
        ], 400);
    }

    $payload = [
        'owner_id' => $user['body']['id'],
        'farm_name' => trim($farmName),
        'province' => $province === null
            ? null
            : trim($province)
    ];

    $result = supabaseRest(
        'POST',
        'farms',
        $token,
        $payload
    );

    return jsonResponse(
        $response,
        $result['body'],
        $result['status']
    );
});
