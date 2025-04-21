// Initialize Supabase client at the top!
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

  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, email, bio, avatar_url")
    .eq("user_id", user.id)
    .single();

  if (error) {
    console.error("Profile load error:", error.message);
    return;
  }

  document.getElementById("full-name").textContent = data.full_name || "N/A";
  document.getElementById("email").textContent = user.email || "N/A";
  document.getElementById("bio").textContent = data.bio || "N/A";

  const avatarImg = document.getElementById("avatar");
  avatarImg.src = data.avatar_url || "https://placehold.co/100x100";
  avatarImg.onerror = () => {
    avatarImg.src = "https://placehold.co/100x100";
  };
});

// Logout handler
document.getElementById("logout-btn").addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "login.html";
});
