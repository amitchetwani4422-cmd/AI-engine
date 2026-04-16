export const dynamic = "force-dynamic";
/**
 * POST /api/production/[id]/backfill-characters
 *
 * Re-scans every scene in the video's script using the alias map and
 * writes correct characterIds for scenes that were generated before the
 * character-matching fix. Safe to call multiple times (idempotent).
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const RAMAYANA_NAME_ALIASES: Record<string, string[]> = {
  'ram':         ['राम', 'श्री राम', 'shri ram', 'lord ram', 'rama'],
  'sita':        ['सीता', 'sita mata', 'janaki', 'maithili', 'vaidehi'],
  'hanuman':     ['हनुमान', 'bajrangbali', 'pawanputra', 'mahavir'],
  'lakshman':    ['लक्ष्मण', 'laxman', 'lakshmana', 'saumitra'],
  'ravan':       ['रावण', 'ravana', 'ravanan', 'dashanan', 'dashagriva'],
  'dasharath':   ['दशरथ', 'dasharatha', 'dashrath', 'king dasharath'],
  'kaushalya':   ['कौशल्या', 'kausalya'],
  'kaikeyi':     ['कैकेयी', 'kekeyi'],
  'vashishtha':  ['वशिष्ठ', 'vasishtha', 'vasistha', 'maharishi vashishtha', 'maharishi vasishtha', 'guru vashishtha'],
  'vishwamitra': ['विश्वामित्र', 'vishvamitra', 'maharishi vishwamitra'],
  'sugriva':     ['सुग्रीव', 'sugreeva'],
  'vibhishan':   ['विभीषण', 'vibhishana', 'vibheeshana'],
  'jatayu':      ['जटायु'],
  'shabari':     ['शबरी', 'sabari'],
  'mandodari':   ['मंदोदरी', 'mandodhari'],
  'manthara':    ['मंथरा'],
  'bharat':      ['भरत', 'bharata'],
  'shatrughan':  ['शत्रुघ्न', 'shatrughna', 'shatrughnan'],
  'angad':       ['अंगद', 'angada'],
  'jambavan':    ['जामवंत', 'jambavant', 'jambavanta'],
  'shurpanakha': ['शूर्पणखा', 'surpanakha', 'shoorpanakha'],
  'kumbhakarna': ['कुंभकर्ण', 'kumbhakaran'],
  'indrajit':    ['इंद्रजीत', 'meghnad', 'meghnaad', 'meghanad'],
  'vali':        ['वाली', 'bali'],
};

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: videoId } = await params;

    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: {
        channelId: true,
        script: {
          select: {
            sceneBreakdown: {
              select: { id: true, description: true, prompt: true, visualGuidance: true, narrationText: true },
            },
          },
        },
      },
    });

    if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    if (!video.script) return NextResponse.json({ error: 'No script found' }, { status: 404 });

    // Build alias-expanded token → character id map.
    // If this channel has no characters of its own, fall back to all characters in DB
    // (handles the common case where Ramayana characters are seeded to one channel
    // but videos are produced under a different channel).
    let channelCharacters = await prisma.character.findMany({
      where: { channelId: video.channelId },
      select: { id: true, name: true },
    });
    const usedChannelId = channelCharacters.length > 0 ? video.channelId : 'ALL';
    if (channelCharacters.length === 0) {
      channelCharacters = await prisma.character.findMany({
        select: { id: true, name: true },
      });
    }

    const charTokenLookup = new Map<string, string>();
    for (const c of channelCharacters) {
      const canonical = c.name.toLowerCase();
      charTokenLookup.set(canonical, c.id);
      for (const [key, aliases] of Object.entries(RAMAYANA_NAME_ALIASES)) {
        if (key === canonical || aliases.some((a) => a.toLowerCase() === canonical)) {
          charTokenLookup.set(key, c.id);
          aliases.forEach((a) => charTokenLookup.set(a.toLowerCase(), c.id));
        }
      }
    }

    // Re-scan each scene and update characterIds
    const results: { sceneId: string; characterIds: string[]; matched: string[] }[] = [];
    for (const scene of video.script.sceneBreakdown) {
      const sceneText = [scene.description, scene.prompt, scene.visualGuidance, scene.narrationText]
        .filter(Boolean).join(' ').toLowerCase();

      const matched = new Map<string, string>(); // id → name
      for (const [token, id] of charTokenLookup.entries()) {
        if (sceneText.includes(token)) matched.set(id, token);
      }

      const sceneCharIds = [...matched.keys()];

      await prisma.scene.update({
        where: { id: scene.id },
        data: { characterIds: sceneCharIds },
      });

      results.push({ sceneId: scene.id, characterIds: sceneCharIds, matched: [...matched.values()] });
    }

    const totalLinked = results.filter((r) => r.characterIds.length > 0).length;

    // Debug info to diagnose zero-match cases
    const firstScene = video.script.sceneBreakdown[0];
    const sampleText = firstScene
      ? [firstScene.description, firstScene.prompt, firstScene.visualGuidance, firstScene.narrationText]
          .filter(Boolean).join(' ').slice(0, 300)
      : '(no scenes)';

    return NextResponse.json({
      message: `Backfilled ${results.length} scenes. ${totalLinked} now have characters linked.`,
      debug: {
        videoChannelId: video.channelId,
        searchedScope: usedChannelId,
        charactersFound: channelCharacters.length,
        characterNames: channelCharacters.map((c) => c.name),
        tokenCount: charTokenLookup.size,
        sampleSceneText: sampleText,
      },
      results,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
