
<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

// Retrieve community posts
$app->get('/api/community/posts', function (
    Request $request,
    Response $response
) {
    $token = getAccessToken($request);

    if (!$token) {
        return jsonResponse($response, ['error' => 'Login required'], 401);
    }

    $user = getAuthenticatedUser($token);

    if ($user['status'] !== 200 || empty($user['body']['id'])) {
        return jsonResponse($response, ['error' => 'Invalid or expired session'], 401);
    }

    $result = supabaseRest(
        'GET',
        'community_posts?select=id,user_id,content,crop_name,created_at&order=created_at.desc&limit=50',
        $token
    );

    return jsonResponse($response, $result['body'], $result['status']);
});

// Create community post
$app->post('/api/community/posts', function (
    Request $request,
    Response $response
) {
    $token = getAccessToken($request);

    if (!$token) {
        return jsonResponse($response, ['error' => 'Login required'], 401);
    }

    $user = getAuthenticatedUser($token);

    if ($user['status'] !== 200 || empty($user['body']['id'])) {
        return jsonResponse($response, ['error' => 'Invalid session'], 401);
    }

    $input = json_decode((string) $request->getBody(), true);

    if (!is_array($input)) {
        return jsonResponse($response, ['error' => 'Invalid JSON'], 400);
    }

    $content = $input['content'] ?? '';
    $cropName = $input['crop_name'] ?? '';

    if (!is_string($content) || !is_string($cropName)) {
        return jsonResponse($response, ['error' => 'Invalid post data'], 400);
    }

    $content = trim($content);
    $cropName = trim($cropName);

    if ($content === '' || mb_strlen($content) > 2000) {
        return jsonResponse($response, ['error' => 'Post must contain 1 to 2000 characters'], 400);
    }

    if (mb_strlen($cropName) > 100) {
        return jsonResponse($response, ['error' => 'Crop name is too long'], 400);
    }

    $result = supabaseRest(
        'POST',
        'community_posts',
        $token,
        [
            'user_id' => $user['body']['id'],
            'content' => $content,
            'crop_name' => $cropName ?: null
        ]
    );

    return jsonResponse($response, $result['body'], $result['status']);
});

// Retrieve comments
$app->get('/api/community/posts/{postId}/comments', function (
    Request $request,
    Response $response,
    array $args
) {
    $token = getAccessToken($request);

    if (!$token) {
        return jsonResponse($response, ['error' => 'Login required'], 401);
    }

    $user = getAuthenticatedUser($token);

    if ($user['status'] !== 200 || empty($user['body']['id'])) {
        return jsonResponse($response, ['error' => 'Invalid session'], 401);
    }

    $postId = $args['postId'];

    if (!preg_match('/^[0-9a-f-]{36}$/i', $postId)) {
        return jsonResponse($response, ['error' => 'Invalid post ID'], 400);
    }

    $result = supabaseRest(
        'GET',
        'community_comments?post_id=eq.' . rawurlencode($postId)
            . '&select=id,post_id,user_id,content,created_at'
            . '&order=created_at.asc',
        $token
    );

    return jsonResponse($response, $result['body'], $result['status']);
});

// Create comment
$app->post('/api/community/posts/{postId}/comments', function (
    Request $request,
    Response $response,
    array $args
) {
    $token = getAccessToken($request);

    if (!$token) {
        return jsonResponse($response, ['error' => 'Login required'], 401);
    }

    $user = getAuthenticatedUser($token);

    if ($user['status'] !== 200 || empty($user['body']['id'])) {
        return jsonResponse($response, ['error' => 'Invalid session'], 401);
    }

    $postId = $args['postId'];

    if (!preg_match('/^[0-9a-f-]{36}$/i', $postId)) {
        return jsonResponse($response, ['error' => 'Invalid post ID'], 400);
    }

    $input = json_decode((string) $request->getBody(), true);

    if (!is_array($input) || !is_string($input['content'] ?? null)) {
        return jsonResponse($response, ['error' => 'Invalid comment'], 400);
    }

    $content = trim($input['content']);

    if ($content === '' || mb_strlen($content) > 1000) {
        return jsonResponse($response, ['error' => 'Comment must contain 1 to 1000 characters'], 400);
    }

    $result = supabaseRest(
        'POST',
        'community_comments',
        $token,
        [
            'post_id' => $postId,
            'user_id' => $user['body']['id'],
            'content' => $content
        ]
    );

    return jsonResponse($response, $result['body'], $result['status']);
});

// Like a post
$app->post('/api/community/posts/{postId}/like', function (
    Request $request,
    Response $response,
    array $args
) {
    $token = getAccessToken($request);

    if (!$token) {
        return jsonResponse($response, ['error' => 'Login required'], 401);
    }

    $user = getAuthenticatedUser($token);

    if ($user['status'] !== 200 || empty($user['body']['id'])) {
        return jsonResponse($response, ['error' => 'Invalid session'], 401);
    }

    $postId = $args['postId'];

    if (!preg_match('/^[0-9a-f-]{36}$/i', $postId)) {
        return jsonResponse($response, ['error' => 'Invalid post ID'], 400);
    }

    $result = supabaseRest(
        'POST',
        'post_likes',
        $token,
        [
            'post_id' => $postId,
            'user_id' => $user['body']['id']
        ]
    );

    return jsonResponse($response, $result['body'], $result['status']);
});

// Unlike a post
$app->delete('/api/community/posts/{postId}/like', function (
    Request $request,
    Response $response,
    array $args
) {
    $token = getAccessToken($request);

    if (!$token) {
        return jsonResponse($response, ['error' => 'Login required'], 401);
    }

    $user = getAuthenticatedUser($token);

    if ($user['status'] !== 200 || empty($user['body']['id'])) {
        return jsonResponse($response, ['error' => 'Invalid session'], 401);
    }

    $postId = $args['postId'];

    if (!preg_match('/^[0-9a-f-]{36}$/i', $postId)) {
        return jsonResponse($response, ['error' => 'Invalid post ID'], 400);
    }

    $endpoint = 'post_likes?post_id=eq.' . rawurlencode($postId)
        . '&user_id=eq.' . rawurlencode($user['body']['id']);

    $result = supabaseRest('DELETE', $endpoint, $token);

    return jsonResponse($response, $result['body'], $result['status']);
});

// Retrieve likes
$app->get('/api/community/posts/{postId}/likes', function (
    Request $request,
    Response $response,
    array $args
) {
    $token = getAccessToken($request);

    if (!$token) {
        return jsonResponse($response, ['error' => 'Login required'], 401);
    }

    $user = getAuthenticatedUser($token);

    if ($user['status'] !== 200 || empty($user['body']['id'])) {
        return jsonResponse($response, ['error' => 'Invalid session'], 401);
    }

    $postId = $args['postId'];

    if (!preg_match('/^[0-9a-f-]{36}$/i', $postId)) {
        return jsonResponse($response, ['error' => 'Invalid post ID'], 400);
    }

    $result = supabaseRest(
        'GET',
        'post_likes?post_id=eq.' . rawurlencode($postId)
            . '&select=user_id,created_at',
        $token
    );

    return jsonResponse($response, $result['body'], $result['status']);
});
