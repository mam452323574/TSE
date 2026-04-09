import {
  buildAnalyzeScanRequest,
  buildCanonicalScanImagePath,
  buildCheckAndRecordScanRequest,
  getProviderScanType,
} from '@/shared/scanContract';

describe('scan contract helpers', () => {
  it('maps app scan types to provider scan types consistently', () => {
    expect(getProviderScanType('health')).toBe('face');
    expect(getProviderScanType('body')).toBe('body');
    expect(getProviderScanType('nutrition')).toBe('nutrition');
    expect(getProviderScanType('super')).toBe('super_health_v2');
  });

  it('builds the canonical scan image path used by both client and server', () => {
    expect(
      buildCanonicalScanImagePath('user-123', 'scan-456')
    ).toBe('user-123/scans/scan-456.jpg');
  });

  it('builds the canonical reservation and analysis request bodies', () => {
    expect(buildCheckAndRecordScanRequest('health')).toEqual({
      scan_type: 'health',
    });
    expect(buildCheckAndRecordScanRequest('super', { checkOnly: true })).toEqual({
      scan_type: 'super',
      check_only: true,
    });
    expect(buildAnalyzeScanRequest('scan-456', 'nutrition', 'fr')).toEqual({
      scan_id: 'scan-456',
      scan_type: 'nutrition',
      language: 'fr',
    });
  });
});
