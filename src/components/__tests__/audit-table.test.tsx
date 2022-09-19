import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AuditTable } from '../audit-table';

describe('AuditTable', () => {
  it('shows an empty state', () => {
    render(<AuditTable rows={[]} />);
    expect(screen.getByText('Nothing here yet.')).toBeInTheDocument();
  });

  it('renders actor and description, handling deleted users', () => {
    render(
      <AuditTable
        rows={[
          {
            id: '1',
            action: 'member.invited',
            target: 'new@pulse.dev',
            meta: '{"role":"admin"}',
            createdAt: new Date('2024-05-01T10:00:00Z'),
            actor: { name: 'Sam Patel', email: 'sam@pulse.dev' },
          },
          {
            id: '2',
            action: 'member.removed',
            target: 'old@pulse.dev',
            meta: null,
            createdAt: new Date('2024-05-02T10:00:00Z'),
            actor: null,
          },
        ]}
      />,
    );
    expect(screen.getByText('Sam Patel')).toBeInTheDocument();
    expect(screen.getByText('invited new@pulse.dev as admin')).toBeInTheDocument();
    expect(screen.getByText('deleted user')).toBeInTheDocument();
  });
});
