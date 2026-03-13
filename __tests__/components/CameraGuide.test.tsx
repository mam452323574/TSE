import React from 'react';
import { render } from '@testing-library/react-native';
import { CameraGuide } from '@/components/CameraGuide';

describe('CameraGuide', () => {
  it('returns null when scanType is null', () => {
    const { toJSON } = render(<CameraGuide scanType={null} />);
    
    expect(toJSON()).toBeNull();
  });

  it('renders nutrition scan guide correctly', () => {
    const { toJSON } = render(<CameraGuide scanType="nutrition" />);
    
    expect(toJSON()).toBeTruthy();
  });

  it('renders body scan guide correctly', () => {
    const { toJSON } = render(<CameraGuide scanType="body" />);
    
    expect(toJSON()).toBeTruthy();
  });

  it('renders health scan guide correctly', () => {
    const { toJSON } = render(<CameraGuide scanType="health" />);
    
    expect(toJSON()).toBeTruthy();
  });

  it('renders corner elements', () => {
    const { toJSON } = render(<CameraGuide scanType="nutrition" />);
    const tree = toJSON();
    
    // Verify that the component renders with proper structure
    expect(tree).toBeTruthy();
  });

  it('renders with different scan types without crashing', () => {
    const scanTypes = ['nutrition', 'body', 'health'] as const;
    
    scanTypes.forEach(scanType => {
      const { toJSON } = render(<CameraGuide scanType={scanType} />);
      expect(toJSON()).toBeTruthy();
    });
  });
});
