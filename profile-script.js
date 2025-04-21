// ✅ Initialize Supabase
const supabase = supabase.createClient(
  'https://eqpmbcbaqgdmrhwmvlya.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxcG1iY2JhcWdkbXJod212bHlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NDg4ODQsImV4cCI6MjA2MDQyNDg4NH0.V3SwBCiBkGO_YxTKnE7jbdFthmXAJNbiEVcjsLUYCaM'
);

document.addEventListener('DOMContentLoaded', async () => {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    window.location.href = '/login.html';
    return;
  }

  document.getElementById('email').textContent = user.email;

  const avatarImg = document.getElementById('avatar');
  const fullNameInput = document.getElementById('full-name');
  const bioInput = document.getElementById('bio');
  const avatarUrlInput = document.getElementById('avatar-url');
  const collabTypeInput = document.getElementById('collab-type');
  const platformsInput = document.getElementById('platforms');

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, bio, collab_type, platforms')
        .eq('user_id', user.id);

      if (error) throw error;

      if (data.length > 0) {
        const profile = data[0];
        <img id="avatar" src="https://ui-avatars.com/api/?name=Default&background=random" width="100" />
        fullNameInput.value = profile.full_name || '';
        bioInput.value = profile.bio || '';
        avatarUrlInput.value = profile.avatar_url || '';
        collabTypeInput.value = profile.collab_type || '';
        platformsInput.value = profile.platforms || '';
      } else {
        console.log('No profile found for user.');
      }
    } catch (error) {
      console.error('Profile load error:', error.message);
    }
  };

  document.getElementById('save-profile').addEventListener('click', async () => {
    const updates = {
      user_id: user.id,
      full_name: fullNameInput.value,
      avatar_url: avatarUrlInput.value,
      bio: bioInput.value,
      collab_type: collabTypeInput.value,
      platforms: platformsInput.value,
    };

    try {
      const { error } = await supabase.from('profiles').upsert(updates);
      if (error) throw error;
      alert('Profile updated!');
      await loadProfile();
    } catch (error) {
      console.error('Profile update error:', error.message);
    }
  });

  document.getElementById('logout').addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = '/login.html';
  });

  loadProfile();
});
