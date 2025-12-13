/**
 * POST /api/notifications/native-token - Register native push token (APNs/FCM)
 * DELETE /api/notifications/native-token - Unregister native push token
 * GET /api/notifications/native-token - List user's native push tokens
 */

import { NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { handleApiError } from '@/lib/api/errors';
import {
  upsertNativePushToken,
  deleteNativePushToken,
  getUserNativePushTokens,
} from '@/lib/notifications';

/**
 * POST - Register a native push token
 */
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const userId = request.auth.userId;
    const body = await request.json();

    // Validate required fields
    if (!body.token || !body.platform) {
      return NextResponse.json(
        { error: 'Missing required fields: token, platform' },
        { status: 400 }
      );
    }

    // Validate platform
    if (body.platform !== 'ios' && body.platform !== 'android') {
      return NextResponse.json(
        { error: 'Invalid platform. Must be "ios" or "android"' },
        { status: 400 }
      );
    }

    // Create or update token
    const nativeToken = upsertNativePushToken({
      user_id: userId,
      token: body.token,
      platform: body.platform,
      device_name: body.deviceName,
      device_model: body.deviceModel,
      os_version: body.osVersion,
      app_version: body.appVersion,
    });

    return NextResponse.json({
      message: 'Native push token registered',
      token: {
        id: nativeToken.id,
        platform: nativeToken.platform,
        deviceName: nativeToken.device_name,
        createdAt: nativeToken.created_at,
      },
    });
  } catch (error) {
    return handleApiError('POST /api/notifications/native-token', error, 'Failed to register token');
  }
});

/**
 * DELETE - Unregister a native push token
 */
export const DELETE = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json();

    if (!body.token) {
      return NextResponse.json(
        { error: 'Missing token' },
        { status: 400 }
      );
    }

    const deleted = deleteNativePushToken(body.token);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Native push token unregistered',
    });
  } catch (error) {
    return handleApiError('DELETE /api/notifications/native-token', error, 'Failed to unregister token');
  }
});

/**
 * GET - List user's native push tokens
 */
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const userId = request.auth.userId;
    const tokens = getUserNativePushTokens(userId);

    return NextResponse.json({
      tokens: tokens.map(token => ({
        id: token.id,
        platform: token.platform,
        deviceName: token.device_name,
        deviceModel: token.device_model,
        osVersion: token.os_version,
        lastUsedAt: token.last_used_at,
        createdAt: token.created_at,
      })),
    });
  } catch (error) {
    return handleApiError('GET /api/notifications/native-token', error, 'Failed to get tokens');
  }
});
