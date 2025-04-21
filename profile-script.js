// profile-script.js

const supabaseUrl = 'https://eqpmbcbaqgdmrhwmvlya.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxcG1iY2JhcWdkbXJod212bHlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NDg4ODQsImV4cCI6MjA2MDQyNDg4NH0.V3SwBCiBkGO_YxTKnE7jbdFthmXAJNbiEVcjsLUYCaM';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', async () => {
  const {
    data: { session },
    error: sessionError
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    console.error('Not logged in:', sessionError);
    window.location.href = '/login.html';
    return;
  }

  const user = session.user;

  document.getElementById('email').value = user.email;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, bio')
    .eq('id', user.id) // Adjust this if your column is named differently
    .single();

  if (profileError) {
    console.error('Error loading profile:', profileError.message);
  } else if (profile) {
    document.getElementById('full-name').value = profile.full_name || '';
    document.getElementById('bio').value = profile.bio || '';
    document.getElementById('avatar-preview').src = profile.avatar_url || 'https://placehold.co/100x100';
    document.getElementById('avatar-preview').setAttribute('data-url', profile.avatar_url || '');
  }

  document.getElementById('save-profile').addEventListener('click', async () => {
    const fullName = document.getElementById('full-name').value;
    const bio = document.getElementById('bio').value;
    const avatarUrl = document.getElementById('avatar-url').value;

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id, // Ensure this matches your primary key
        full_name: fullName,
        bio: bio,
        avatar_url: avatarUrl
      });

    if (error) {
      alert('Failed to update profile: ' + error.message);
    } else {
      alert('Profile updated!');
      document.getElementById('avatar-preview').src = avatarUrl || 'https://placehold.co/100x100';
    }
  });

  document.getElementById('logout').addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = '/login.html';
  });
});
