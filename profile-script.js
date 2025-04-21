const supabase = window.supabase.createClient(
  "https://eqpmbcbaqgdmrhwmvlya.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxcG1iY2JhcWdkbXJod212bHlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NDg4ODQsImV4cCI6MjA2MDQyNDg4NH0.V3SwBCiBkGO_YxTKnE7jbdFthmXAJNbiEVcjsLUYCaM"
);

document.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return;
  }

  const user = session.user;
  document.getElementById('email').value = user.email;

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, bio')
    .eq('user_id', user.id);

  if (error) {
    console.error('Profile load error:', error.message);
  } else if (profiles.length === 0) {
    console.log('No profile found for user.');
  } else {
    const profile = profiles[0];
    document.getElementById('full_name').value = profile.full_name || '';
    document.getElementById('avatar_url').value = profile.avatar_url || '';
    document.getElementById('bio').value = profile.bio || '';
    document.getElementById('avatar').src = profile.avatar_url || 'https://i.pravatar.cc/100';
  }

  document.getElementById('save').addEventListener('click', async () => {
    const full_name = document.getElementById('full_name').value;
    const avatar_url = document.getElementById('avatar_url').value;
    const bio = document.getElementById('bio').value;

    const { data, error } = await supabase
      .from('profiles')
      .upsert([
        {
          user_id: user.id,
          full_name,
          avatar_url,
          bio
        }
      ]);

    if (error) {
      console.error('Profile update error:', error.message);
    } else {
      document.getElementById('status').textContent = 'Profile updated!';
      document.getElementById('avatar').src = avatar_url || 'https://i.pravatar.cc/100';
    }
  });

  document.getElementById('logout').addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
  });
});
