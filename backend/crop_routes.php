
<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

// Register a crop on a farmer's farm.
$app->post('/api/crops', function (
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

    $farmId = $input['farm_id'] ?? null;
    $cropName = $input['crop_name'] ?? null;

    if (
        !is_string($farmId) ||
        !preg_match(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i',
            $farmId
        )
    ) {
        return jsonResponse($response, [
            'error' => 'Valid farm_id required'
        ], 400);
    }

    if (
        !is_string($cropName) ||
        !in_array(
            $cropName,
            ['Maize', 'Potato', 'Tomato'],
            true
        )
    ) {
        return jsonResponse($response, [
            'error' => 'Choose Maize, Potato or Tomato'
        ], 400);
    }

    $payload = [
        'farm_id' => $farmId,
        'crop_name' => $cropName
    ];

    // The authenticated user's token is used.
    // Supabase RLS must enforce farm ownership.
    $result = supabaseRest(
        'POST',
        'crops',
        $token,
        $payload
    );

    return jsonResponse(
        $response,
        $result['body'],
        $result['status']
    );
});
