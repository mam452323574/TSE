import { Phase2HttpError } from '@/supabase/functions/_shared/phase2Errors';
import {
  isStoredScanAnalysisComplete,
  resolveNormalizedScanAnalysisPayload,
} from '@/supabase/functions/_shared/scanAnalysis';

describe('scan analysis helpers', () => {
  it('normalizes provider payloads and preserves supported schema versions', () => {
    expect(
      resolveNormalizedScanAnalysisPayload(
        {
          success: true,
          data: {
            schema_version: 3,
            scan_type: 'face',
            face_score: 84,
          },
        },
        'health',
      ),
    ).toEqual({
      schema_version: 3,
      scan_type: 'face',
      face_score: 84,
    });
  });

  it('rejects provider payloads whose analysis type does not match the reserved scan type', () => {
    expect(() =>
      resolveNormalizedScanAnalysisPayload(
        {
          success: true,
          data: {
            schema_version: 3,
            scan_type: 'body',
          },
        },
        'health',
      ),
    ).toThrow(Phase2HttpError);

    expect(() =>
      resolveNormalizedScanAnalysisPayload(
        {
          success: true,
          data: {
            schema_version: 3,
            scan_type: 'body',
          },
        },
        'health',
      ),
    ).toThrow('Expected face analysis for health, received body');
  });

  it('marks scans as already finalized only when both analysis_result and analyzed_at exist', () => {
    expect(
      isStoredScanAnalysisComplete({
        analysis_result: { scan_type: 'face' },
        analyzed_at: '2026-04-08T12:00:00.000Z',
      }),
    ).toBe(true);
    expect(
      isStoredScanAnalysisComplete({
        analysis_result: { scan_type: 'face' },
        analyzed_at: null,
      }),
    ).toBe(false);
    expect(
      isStoredScanAnalysisComplete({
        analysis_result: null,
        analyzed_at: '2026-04-08T12:00:00.000Z',
      }),
    ).toBe(false);
  });
});
