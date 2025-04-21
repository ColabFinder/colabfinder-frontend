// Initialize Supabase client
const supabase = supabase.createClient(
  'https://eqpmbcbaqgdmrhwmvlya.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxcG1iY2JhcWdkbXJod212bHlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NDg4ODQsImV4cCI6MjA2MDQyNDg4NH0.V3SwBCiBkGO_YxTKnE7jbdFthmXAJNbiEVcjsLUYCaM'
);

document.addEventListener("DOMContentLoaded", async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  // Load existing profile data
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, bio, avatar_url")
    .eq("user_id", user.id)
    .single();

  if (error) {
    console.error("Failed to load profile:", error.message);
    return;
  }

  // Pre-fill form
  document.getElementById("full-name").value = data.full_name || "";
  document.getElementById("bio").value = data.bio || "";
  document.getElementById("avatar-url").value = data.avatar_url || "";
});

// Handle form submission
document.getElementById("edit-profile-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const fullName = document.getElementById("full-name").value;
  const bio = document.getElementById("bio").value;
  const avatarUrl = document.getElementById("avatar-url").value;

  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      bio: bio,
      avatar_url: avatarUrl,
    })
    .eq("user_id", user.id);

  if (error) {
    console.error("Profile update failed:", error.message);
    alert("Failed to update profile.");
  } else {
    alert("Profile updated successfully!");
    window.location.href = "dashboard.html";
  }
});
