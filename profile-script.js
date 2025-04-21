// ✅ Supabase Initialization
const SUPABASE_URL = 'https://eqpmbcbaqgdmrhwmvlya.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxcG1iY2JhcWdkbXJod212bHlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NDg4ODQsImV4cCI6MjA2MDQyNDg4NH0.V3SwBCiBkGO_YxTKnE7jbdFthmXAJNbiEVcjsLUYCaM';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    window.location.href = '/login.html';
    return;
  }

  const user = session.user;
  const userId = user.id;

  const fullNameInput = document.getElementById('full-name');
  const emailInput = document.getElementById('email');
  const bioInput = document.getElementById('bio');
  const avatarInput = document.getElementById('avatar-url');
  const avatarImg = document.getElementById('avatar');
  const profileForm = document.getElementById('profile-form');
  const logoutButton = document.getElementById('logout-button');

  emailInput.value = user.email;

  async function loadProfile() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, bio, avatar_url')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.warn('No profile found or error:', error.message);
        return;
      }

      fullNameInput.value = data.full_name || '';
      bioInput.value = data.bio || '';
      avatarInput.value = data.avatar_url || '';
      avatarImg.src = data.avatar_url || 'https://ui-avatars.com/api/?name=User&background=random';
    } catch (error) {
      console.error('Profile load error:', error);
    }
  }

  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const full_name = fullNameInput.value;
    const bio = bioInput.value;
    const avatar_url = avatarInput.value;

    const { error } = await supabase
      .from('profiles')
      .upsert({
        user_id: userId,
        full_name,
        bio,
        avatar_url
      });

    if (error) {
      alert('Error updating profile: ' + error.message);
    } else {
      alert('Profile updated!');
      avatarImg.src = avatar_url || 'https://ui-avatars.com/api/?name=User&background=random';
    }
  });

  logoutButton.addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = '/login.html';
  });

  loadProfile();
});
