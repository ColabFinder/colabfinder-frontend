const supabase = supabase.createClient(
  'https://eqpmbcbaqgdmrhwmvlya.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxcG1iY2JhcWdkbXJod212bHlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NDg4ODQsImV4cCI6MjA2MDQyNDg4NH0.V3SwBCiBkGO_YxTKnE7jbdFthmXAJNbiEVcjsLUYCaM'
);

document.addEventListener('DOMContentLoaded', async () => {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  document.getElementById('email').value = user.email;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, bio')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Profile load error:', error.message);
  } else if (profile) {
    document.getElementById('fullName').value = profile.full_name || '';
    document.getElementById('avatarUrl').value = profile.avatar_url || '';
    document.getElementById('bio').value = profile.bio || '';

    document.getElementById('avatar').src =
      profile.avatar_url || 'https://via.placeholder.com/100';
  }
});

document.getElementById('profile-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const full_name = document.getElementById('fullName').value;
  const avatar_url = document.getElementById('avatarUrl').value;
  const bio = document.getElementById('bio').value;

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  let response;
  if (existingProfile) {
    response = await supabase.from('profiles').update({
      full_name,
      avatar_url,
      bio
    }).eq('user_id', user.id);
  } else {
    response = await supabase.from('profiles').insert({
      user_id: user.id,
      full_name,
      avatar_url,
      bio
    });
  }

  if (response.error) {
    console.error('Profile update error:', response.error.message);
    document.getElementById('statusMessage').textContent = 'Error updating profile.';
  } else {
    document.getElementById('avatar').src = avatar_url || 'https://via.placeholder.com/100';
    document.getElementById('statusMessage').textContent = 'Profile updated!';
  }
});

document.getElementById('logout').addEventListener('click', async () => {
  await supabase.auth.signOut();
  window.location.href = 'login.html';
});
