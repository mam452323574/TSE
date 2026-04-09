import React from 'react';
import { render, screen, act } from '@testing-library/react-native';
import { NextScanTimer } from '@/components/NextScanTimer';

// Mock lucide-react-native
jest.mock('lucide-react-native', () => ({
  Clock: 'Clock',
}));

describe('NextScanTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders without crashing', () => {
    const futureDate = Date.now() + 3600000; // 1 hour from now
    const { toJSON } = render(
      <NextScanTimer nextAvailableDate={futureDate} scanLabel="Nutrition" />
    );
    
    expect(toJSON()).toBeTruthy();
  });

  it('shows "Disponible" when time has passed', () => {
    const pastDate = Date.now() - 1000; // 1 second ago
    render(
      <NextScanTimer nextAvailableDate={pastDate} scanLabel="Nutrition" />
    );
    
    expect(screen.getByText('Disponible')).toBeTruthy();
  });

  it('shows time remaining when not available', () => {
    const futureDate = Date.now() + 3600000; // 1 hour from now
    render(
      <NextScanTimer nextAvailableDate={futureDate} scanLabel="Nutrition" />
    );
    
    // Should show "dans X" format
    expect(screen.getByText(/dans/)).toBeTruthy();
  });

  it('shows hours and minutes format for hour+ durations', () => {
    const futureDate = Date.now() + (2 * 60 * 60 * 1000) + (30 * 60 * 1000); // 2h30m from now
    render(
      <NextScanTimer nextAvailableDate={futureDate} scanLabel="Nutrition" />
    );
    
    expect(screen.getByText(/dans/)).toBeTruthy();
  });

  it('shows minutes format for sub-hour durations', () => {
    const futureDate = Date.now() + (30 * 60 * 1000); // 30 minutes from now
    render(
      <NextScanTimer nextAvailableDate={futureDate} scanLabel="Nutrition" />
    );
    
    expect(screen.getByText(/dans/)).toBeTruthy();
  });

  it('shows days format for day+ durations', () => {
    const futureDate = Date.now() + (2 * 24 * 60 * 60 * 1000); // 2 days from now
    render(
      <NextScanTimer nextAvailableDate={futureDate} scanLabel="Nutrition" />
    );
    
    expect(screen.getByText(/dans/)).toBeTruthy();
  });

  it('renders the compact scanner mode on a single line without the default prefix', () => {
    const futureDate = Date.now() + (2 * 24 * 60 * 60 * 1000) + (3 * 60 * 60 * 1000);
    const { UNSAFE_queryByType } = render(
      <NextScanTimer
        nextAvailableDate={futureDate}
        scanLabel="Dispo."
        mode="scannerCompact"
      />
    );

    expect(screen.getByText(/Dispo\./)).toBeTruthy();
    expect(screen.queryByText(/dans/)).toBeNull();
    expect(UNSAFE_queryByType('Clock' as any)).toBeNull();
  });

  it('updates when time passes', async () => {
    const futureDate = Date.now() + 5000; // 5 seconds from now
    render(
      <NextScanTimer nextAvailableDate={futureDate} scanLabel="Nutrition" />
    );
    
    // Initially should show countdown
    expect(screen.getByText(/dans/)).toBeTruthy();
    
    // Fast-forward time
    await act(async () => {
      jest.advanceTimersByTime(6000);
    });
    
    // Now should show "Disponible"
    expect(screen.getByText('Disponible')).toBeTruthy();
  });
});
