import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RangePicker } from '../range-picker';

describe('RangePicker', () => {
  it('marks the current range as checked', () => {
    render(<RangePicker value="30d" onChange={() => {}} />);
    expect(screen.getByRole('radio', { name: '30 days' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: '7 days' })).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onChange with the picked range', async () => {
    const onChange = vi.fn();
    render(<RangePicker value="30d" onChange={onChange} />);
    await userEvent.click(screen.getByRole('radio', { name: '90 days' }));
    expect(onChange).toHaveBeenCalledWith('90d');
  });

  it('ignores clicks on the active range', async () => {
    const onChange = vi.fn();
    render(<RangePicker value="7d" onChange={onChange} />);
    await userEvent.click(screen.getByRole('radio', { name: '7 days' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
