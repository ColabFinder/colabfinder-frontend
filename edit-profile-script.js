// edit-profile-script.js – Handles profile form prefill and submission
document.addEventListener('DOMContentLoaded', async () => {
  const user = supabase.auth.user();
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  // Prefill the form with current profile data
  let { data: profile, error } = await supabase
    .from('profiles')
    .select('full_name, email, bio, avatar_url, collab_type, skills, platforms')
    .eq('id', user.id)
    .single();
  if (error) {
    console.error("Failed to load profile for editing:", error);
    alert("Error loading profile data. Please try again.");
    // We can still allow editing with default (perhaps from auth data)
    profile = { 
      full_name: user.user_metadata?.full_name || "", 
      email: user.email, 
      bio: "", avatar_url: "", collab_type: "", skills: "", platforms: ""
    };
  }
  // Set form field values
  document.getElementById('input-full-name').value = profile.full_name || "";
  document.getElementById('input-email').value = profile.email || user.email || "";
  document.getElementById('input-bio').value = profile.bio || "";
  document.getElementById('input-avatar_url').value = profile.avatar_url || "";
  document.getElementById('input-collab_type').value = profile.collab_type || "";
  document.getElementById('input-skills').value = profile.skills || "";
  document.getElementById('input-platforms').value = profile.platforms || "";

  // Handle form submission for profile update
  const form = document.getElementById('profile-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Gather updated values from form
    const updatedProfile = {
      full_name: document.getElementById('input-full-name').value.trim(),
      email: document.getElementById('input-email').value.trim(),
      bio: document.getElementById('input-bio').value.trim(),
      avatar_url: document.getElementById('input-avatar_url').value.trim(),
      collab_type: document.getElementById('input-collab_type').value.trim(),
      skills: document.getElementById('input-skills').value.trim(),
      platforms: document.getElementById('input-platforms').value.trim()
    };

    // If email changed, update Auth user as well
    if (updatedProfile.email !== user.email) {
      const { error: emailError } = await supabase.auth.update({ email: updatedProfile.email });
      if (emailError) {
        alert("Could not update email: " + emailError.message);
        // Optionally, you could abort saving profile if email fails.
      }
    }

    // Update the profiles table
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: updatedProfile.full_name,
        email: updatedProfile.email,
        bio: updatedProfile.bio,
        avatar_url: updatedProfile.avatar_url,
        collab_type: updatedProfile.collab_type,
        skills: updatedProfile.skills,
        platforms: updatedProfile.platforms
      })
      .eq('id', user.id);
    if (updateError) {
      console.error("Profile update error:", updateError);
      alert("Failed to update profile: " + updateError.message);
    } else {
      alert("Profile updated successfully!");
      window.location.href = "profile.html";
    }
  });

  // Logout link in nav
  document.getElementById('logout-link-edit').addEventListener('click', async (e) => {
    e.preventDefault();
    await supabase.auth.signOut();
    window.location.href = "index.html";
  });
});
