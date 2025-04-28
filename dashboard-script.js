document.addEventListener('DOMContentLoaded', async function () {
  const supabaseUrl = 'https://eqpmbcbaqgdmrhwmvlya.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxcG1iY2JhcWdkbXJod212bHlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NDg4ODQsImV4cCI6MjA2MDQyNDg4NH0.V3SwBCiBkGO_YxTKnE7jbdFthmXAJNbiEVcjsLUYCaM';

  const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No user found');
      window.location.href = 'login.html';
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, email, bio, avatar_url')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error loading profile:', error.message);
    } else {
      document.getElementById('full-name').textContent = data.full_name || 'No Name';
      document.getElementById('email').textContent = data.email || 'No Email';
      document.getElementById('bio').textContent = data.bio || 'No Bio';
      document.getElementById('avatar').src = data.avatar_url || 'https://via.placeholder.com/100';
    }
  }

  async function loadCollaborations() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('collaborations')
      .select('*')
      .eq('user_id', user.id);

    const collabList = document.getElementById('collaborations-list');
    collabList.innerHTML = '';

    if (error || !data || data.length === 0) {
      collabList.textContent = 'No collaborations found.';
    } else {
      data.forEach(collab => {
        const div = document.createElement('div');
        div.textContent = collab.title || 'Untitled Collaboration';
        collabList.appendChild(div);
      });
    }
  }

  document.getElementById('logout').addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
  });

  await loadProfile();
  await loadCollaborations();
});
