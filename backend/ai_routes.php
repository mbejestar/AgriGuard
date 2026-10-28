<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

$app->post('/api/ai/predict', function (
    Request $request,
    Response $response
) {
    // Require a valid Supabase login
    $token = getAccessToken($request);

    if ($token === null) {
        return jsonResponse($response, [
            'error' => 'Bearer token required'
        ], 401);
    }

    $user = getAuthenticatedUser($token);

    if ($user['status'] !== 200 || empty($user['body']['id'])) {
        return jsonResponse($response, [
            'error' => 'Invalid or expired access token'
        ], 401);
    }

    // Check uploaded image
    $files = $request->getUploadedFiles();
    $file = $files['file'] ?? null;

    if ($file === null || $file->getError() !== UPLOAD_ERR_OK) {
        return jsonResponse($response, [
            'error' => 'Please upload a plant image'
        ], 400);
    }

    if ($file->getSize() === null ||
        $file->getSize() === 0 ||
        $file->getSize() > 5 * 1024 * 1024) {
        return jsonResponse($response, [
            'error' => 'Image must be 5 MB or smaller'
        ], 413);
    }

    $image = (string) $file->getStream();

    $mime = (new finfo(FILEINFO_MIME_TYPE))
        ->buffer($image);

    if (!in_array($mime, [
        'image/jpeg',
        'image/png',
        'image/webp'
    ], true)) {
        return jsonResponse($response, [
            'error' => 'Only JPEG, PNG and WebP images are allowed'
        ], 400);
    }

    // Send image to the local Python AI service
    $curl = curl_init('http://127.0.0.1:8000/predict');

    $temp = tmpfile();

    if ($temp === false) {
        return jsonResponse($response, [
            'error' => 'Unable to prepare image'
        ], 500);
    }

    fwrite($temp, $image);

    $path = stream_get_meta_data($temp)['uri'];

    $upload = new CURLFile(
        $path,
        $mime,
        'plant_image'
    );

    curl_setopt_array($curl, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => [
            'file' => $upload
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 45
    ]);

    $result = curl_exec($curl);
    $status = curl_getinfo($curl, CURLINFO_HTTP_CODE);

    curl_close($curl);
    fclose($temp);

    if ($result === false || $status === 0) {
        return jsonResponse($response, [
            'error' => 'AI prediction service unavailable'
        ], 502);
    }

    $prediction = json_decode($result, true);

    if (!is_array($prediction)) {
        return jsonResponse($response, [
            'error' => 'Invalid AI service response'
        ], 502);
    }

    if ($status < 200 || $status >= 300) {
        return jsonResponse($response, [
            'error' => 'AI prediction failed'
        ], 502);
    }

    // Treat low-confidence predictions as uncertain
    $confidence = (float) ($prediction['confidence'] ?? 0);

    $prediction['is_uncertain'] = $confidence < 0.70;

    if ($prediction['is_uncertain']) {
        $prediction['recommendation'] =
            'Uncertain result. Retake the photo in good lighting or consult an agricultural specialist.';
    }

    return jsonResponse($response, $prediction);
});