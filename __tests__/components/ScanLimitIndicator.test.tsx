import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { ScanLimitIndicator } from '@/components/ScanLimitIndicator';
import { ScanEligibilityResponse } from '@/types';

describe('ScanLimitIndicator', () => {
  it('displays "Limite atteinte" when allowed is false', () => {
    const eligibility: ScanEligibilityResponse = {
      success: true,
      allowed: false,
      message: 'Limite atteinte',
      current_count: 3,
      limit: 3,
    };

    render(<ScanLimitIndicator eligibility={eligibility} />);

    expect(screen.getByText('Limite atteinte')).toBeTruthy();
  });

  it('displays "disponible" when 1 scan remaining', () => {
    const eligibility: ScanEligibilityResponse = {
      success: true,
      allowed: true,
      message: 'Scan autorisé',
      current_count: 2,
      limit: 3,
    };

    render(<ScanLimitIndicator eligibility={eligibility} />);

    expect(screen.getByText('disponible')).toBeTruthy();
    expect(screen.getByText('1')).toBeTruthy(); // remaining count
  });

  it('displays "disponible" when 2 scans remaining', () => {
    const eligibility: ScanEligibilityResponse = {
      success: true,
      allowed: true,
      message: 'Scan autorisé',
      current_count: 1,
      limit: 3,
    };

    render(<ScanLimitIndicator eligibility={eligibility} />);

    expect(screen.getByText('disponible')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy(); // remaining count
  });

  it('displays "disponible" when no scans used', () => {
    const eligibility: ScanEligibilityResponse = {
      success: true,
      allowed: true,
      message: 'Scan autorisé',
      current_count: 0,
      limit: 3,
    };

    render(<ScanLimitIndicator eligibility={eligibility} />);

    expect(screen.getByText('disponible')).toBeTruthy();
    // When remaining equals limit, both show '3', so use getAllByText
    expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1);
  });

  it('handles single scan limit correctly', () => {
    const eligibility: ScanEligibilityResponse = {
      success: true,
      allowed: true,
      message: 'Scan autorisé',
      current_count: 0,
      limit: 1,
    };

    render(<ScanLimitIndicator eligibility={eligibility} />);

    expect(screen.getByText('disponible')).toBeTruthy();
  });

  it('renders without crashing with minimal data', () => {
    const eligibility: ScanEligibilityResponse = {
      success: true,
      allowed: true,
      message: 'OK',
    };

    const { toJSON } = render(<ScanLimitIndicator eligibility={eligibility} />);
    expect(toJSON()).toBeTruthy();
  });
});
