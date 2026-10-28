
<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

// GET: Retrieve the logged-in farmer's scan history.
$app->get('/api/scan-history', function (
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

    $ownerId = $user['body']['id'];

    $query = 'disease_scans'
        . '?select=*'
        . '&owner_id=eq.' . rawurlencode($ownerId)
        . '&order=created_at.desc';

    $result = supabaseRest(
        'GET',
        $query,
        $token
    );

    return jsonResponse(
        $response,
        $result['body'],
        $result['status']
    );
});

// POST: Save a new AI scan for the logged-in farmer.
$app->post('/api/scan-history', function (
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

    $cropId = $input['crop_id'] ?? null;

    if (
        !is_string($cropId) ||
        !preg_match(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i',
            $cropId
        )
    ) {
        return jsonResponse($response, [
            'error' => 'Valid crop_id required'
        ], 400);
    }

    // Verify the crop is visible to this farmer under RLS.
    $cropQuery = 'crops?select=id'
        . '&id=eq.' . rawurlencode($cropId)
        . '&limit=1';

    $cropResult = supabaseRest(
        'GET',
        $cropQuery,
        $token
    );

    if ($cropResult['status'] !== 200) {
        return jsonResponse($response, [
            'error' => 'Unable to verify crop ownership'
        ], 502);
    }

    if (
        !is_array($cropResult['body']) ||
        count($cropResult['body']) === 0
    ) {
        return jsonResponse($response, [
            'error' => 'Crop not found or not owned by this farmer'
        ], 403);
    }

    $disease = $input['predicted_disease'] ?? null;
    $confidence = $input['confidence'] ?? null;
    $recommendations = $input['recommendations'] ?? null;

    if (
        $disease !== null &&
        (!is_string($disease) ||
         strlen($disease) > 200)
    ) {
        return jsonResponse($response, [
            'error' => 'Invalid predicted_disease'
        ], 400);
    }

    if (
        $confidence !== null &&
        (
            !is_numeric($confidence) ||
            !is_finite((float) $confidence) ||
            (float) $confidence < 0 ||
            (float) $confidence > 1
        )
    ) {
        return jsonResponse($response, [
            'error' => 'Confidence must be between 0 and 1'
        ], 400);
    }

    if (
        $recommendations !== null &&
        (!is_string($recommendations) ||
         strlen($recommendations) > 2000)
    ) {
        return jsonResponse($response, [
            'error' => 'Invalid recommendations'
        ], 400);
    }

    $payload = [
        'owner_id' => $user['body']['id'],
        'crop_id' => $cropId,
        'predicted_disease' => $disease,
        'confidence' => $confidence === null
            ? null
            : (float) $confidence,
        'recommendations' => $recommendations,
        'status' => 'pending'
    ];

    $result = supabaseRest(
        'POST',
        'disease_scans',
        $token,
        $payload
    );

    return jsonResponse(
        $response,
        $result['body'],
        $result['status']
    );
});
