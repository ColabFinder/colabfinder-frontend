import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://eqpmbcbaqgdmrhwmvlya.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxcG1iY2JhcWdkbXJod212bHlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NDg4ODQsImV4cCI6MjA2MDQyNDg4NH0.V3SwBCiBkGO_YxTKnE7jbdFthmXAJNbiEVcjsLUYCaM'
);

document.getElementById('back').addEventListener('click', () => {
  window.location.href = 'dashboard.html';
});

document.getElementById('profile-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const updates = {
    id: user.id,
    full_name: document.getElementById('full-name').value,
    bio: document.getElementById('bio').value,
    avatar_url: document.getElementById('avatar-url').value,
    updated_at: new Date(),
  };

  const { error } = await supabase.from('profiles').upsert(updates);
  if (error) return alert('Update failed');
  window.location.href = 'dashboard.html';
});
