// profile-script.js – Runs on profile.html to display the user's full profile info
document.addEventListener('DOMContentLoaded', async () => {
  const user = supabase.auth.user();
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  // Fetch profile data for the current user
  let { data: profile, error } = await supabase
    .from('profiles')
    .select('full_name, email, bio, avatar_url, collab_type, skills, platforms')
    .eq('id', user.id)
    .single();
  if (error || !profile) {
    console.error("Profile fetch error:", error);
    alert("Unable to load profile information.");
    return;
  }

  // Update profile view fields
  document.getElementById('view-full-name').textContent = profile.full_name || "(No name)";
  document.getElementById('view-email').textContent = profile.email || user.email;
  document.getElementById('view-bio').textContent = profile.bio || "(No bio)";
  document.getElementById('view-collab-type').textContent = profile.collab_type || "(Not set)";
  document.getElementById('view-skills').textContent = profile.skills || "(Not set)";
  document.getElementById('view-platforms').textContent = profile.platforms || "(Not set)";
  const avatarImg = document.getElementById('profile-avatar-img');
  avatarImg.src = profile.avatar_url ? profile.avatar_url : "fallback-avatar.png";

  // Logout handler (for the logout link on this page)
  document.getElementById('logout-link-profile').addEventListener('click', async (e) => {
    e.preventDefault();
    await supabase.auth.signOut();
    window.location.href = "index.html";
  });
});
