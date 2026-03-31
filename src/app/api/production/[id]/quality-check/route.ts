import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const QualityScoresSchema = z.object({
  scores: z.object({
    visualQuality: z.number().min(1).max(10),
    characterConsistency: z.number().min(1).max(10),
    storytellingClarity: z.number().min(1).max(10),
    hookStrength: z.number().min(1).max(10),
    subtitleQuality: z.number().min(1).max(10),
    voiceQuality: z.number().min(1).max(10),
    lipSyncAccuracy: z.number().min(1).max(10),
    thumbnailStrength: z.number().min(1).max(10),
    platformFit: z.number().min(1).max(10),
    musicFit: z.number().min(1).max(10),
    overallPublishWorthiness: z.number().min(1).max(10),
  }),
  notes: z.string().optional(),
});

type QualityOutcome = 'approve' | 'revise' | 'regenerate' | 'discard';

function determineOutcome(
  averageScore: number,
  scores: Record<string, number>
): { outcome: QualityOutcome; reason: string } {
  // Hard fails — trigger regenerate
  if (scores.visualQuality < 4 || scores.characterConsistency < 4) {
    return {
      outcome: 'regenerate',
      reason: 'Critical visual quality or character consistency issues detected.',
    };
  }

  // Discard if overall is very low and hook is weak
  if (averageScore < 4 && scores.hookStrength < 4) {
    return {
      outcome: 'discard',
      reason: 'Overall quality and hook strength are both too low to salvage.',
    };
  }

  // Approve if quality is high
  if (averageScore >= 7.5 && scores.overallPublishWorthiness >= 7) {
    return {
      outcome: 'approve',
      reason: 'Content meets quality standards for publishing.',
    };
  }

  // Revise if moderate scores with fixable issues
  if (
    averageScore >= 5.5 &&
    (scores.subtitleQuality < 6 ||
      scores.thumbnailStrength < 6 ||
      scores.musicFit < 6)
  ) {
    return {
      outcome: 'revise',
      reason:
        'Content needs minor revisions (subtitles, thumbnail, or music) before publishing.',
    };
  }

  // Regenerate if structural issues
  if (averageScore < 5.5) {
    return {
      outcome: 'regenerate',
      reason: 'Multiple quality dimensions are below acceptable threshold.',
    };
  }

  // Default to revise for borderline scores
  return {
    outcome: 'revise',
    reason: 'Content requires review and minor improvements before publishing.',
  };
}

const outcomeToStatus: Record<QualityOutcome, string> = {
  approve: 'Approved',
  revise: 'NeedsRevision',
  regenerate: 'NeedsRegeneration',
  discard: 'Discarded',
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = QualityScoresSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const video = await prisma.video.findUnique({ where: { id } });
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    const { scores, notes } = parsed.data;
    const scoreValues = Object.values(scores);
    const averageScore =
      scoreValues.reduce((sum, s) => sum + s, 0) / scoreValues.length;
    const roundedAvg = Math.round(averageScore * 10) / 10;

    const { outcome, reason } = determineOutcome(averageScore, scores);
    const newStatus = outcomeToStatus[outcome];

    const qualityDetails = {
      scores,
      averageScore: roundedAvg,
      outcome,
      reason,
      notes: notes ?? null,
      reviewedAt: new Date().toISOString(),
    };

    const updatedVideo = await prisma.video.update({
      where: { id },
      data: {
        qualityScore: roundedAvg,
        qualityDetails: qualityDetails,
        status: newStatus,
        qualityCheckedAt: new Date(),
      },
      include: {
        channel: { select: { id: true, name: true } },
        script: {
          select: {
            id: true,
            titleOptions: true,
            thumbnailConcepts: true,
          },
        },
      },
    });

    return NextResponse.json({
      ...updatedVideo,
      qualityCheck: {
        averageScore: roundedAvg,
        outcome,
        reason,
        newStatus,
        scores,
      },
    });
  } catch (error) {
    console.error('POST /api/production/[id]/quality-check error:', error);
    return NextResponse.json(
      { error: 'Failed to process quality check' },
      { status: 500 }
    );
  }
}
