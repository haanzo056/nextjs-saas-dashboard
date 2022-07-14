import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MetricCard } from '../metric-card';

describe('MetricCard', () => {
  it('renders value and positive change', () => {
    render(<MetricCard label="Visitors" value="1,204" change={12.345} />);
    expect(screen.getByText('Visitors')).toBeInTheDocument();
    expect(screen.getByText('1,204')).toBeInTheDocument();
    const delta = screen.getByText('+12.3% vs previous period');
    expect(delta).toHaveAttribute('data-direction', 'up');
  });

  it('marks drops as down', () => {
    render(<MetricCard label="Revenue" value="$120" change={-40} />);
    expect(screen.getByText('-40.0% vs previous period')).toHaveAttribute('data-direction', 'down');
  });

  it('treats tiny changes as flat', () => {
    render(<MetricCard label="Pageviews" value="10" change={0.01} />);
    expect(screen.getByText(/vs previous period/)).toHaveAttribute('data-direction', 'flat');
  });

  it('handles missing baseline', () => {
    render(<MetricCard label="Signups" value="3" change={null} />);
    expect(screen.getByText('No prior data')).toBeInTheDocument();
  });
});
