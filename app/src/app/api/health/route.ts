import { NextResponse } from 'next/server';
import { isDatabaseConnected, getDatabase } from '@/lib/db';
import { initializeDatabase } from '@/lib/db/init';

export async function GET() {
  try {
    // Initialize database (runs migrations if needed)
    initializeDatabase();

    // Check database connection
    const dbConnected = isDatabaseConnected();

    // Try to ping database if not connected
    if (!dbConnected) {
      try {
        const db = getDatabase();
        db.prepare('SELECT 1').get();
      } catch {
        return NextResponse.json(
          {
            status: 'unhealthy',
            database: 'disconnected',
            timestamp: new Date().toISOString(),
          },
          { status: 503 }
        );
      }
    }

    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
