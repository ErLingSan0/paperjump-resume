export default function access(initialState: {
  currentUser?: { role?: string };
} | null) {
  const role = initialState?.currentUser?.role ?? 'guest';

  return {
    canManageTemplates: role === 'owner' || role === 'admin',
    canEditResume: role !== 'guest',
  };
}
