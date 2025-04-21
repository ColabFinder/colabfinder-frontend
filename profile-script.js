import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://eqpmbcbaqgdmrhwmvlya.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxcG1iY2JhcWdkbXJod212bHlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NDg4ODQsImV4cCI6MjA2MDQyNDg4NH0.V3SwBCiBkGO_YxTKnE7jbdFthmXAJNbiEVcjsLUYCaM'
const supabase = createClient(supabaseUrl, supabaseKey)

document.addEventListener('DOMContentLoaded', async () => {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    window.location.href = 'login.html'
    return
  }

  document.getElementById('email').value = user.email

  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, bio, collab_type, skills, platforms')
    .eq('user_id', user.id)
    .single()

  if (error) {
    console.error('Profile load error:', error.message)
  } else {
    document.getElementById('full-name').value = data.full_name || ''
    document.getElementById('avatar-url').value = data.avatar_url || ''
    document.getElementById('bio').value = data.bio || ''
    document.getElementById('collab-type').value = data.collab_type || ''
    document.getElementById('skills').value = data.skills || ''
    document.getElementById('platforms').value = data.platforms || ''
    document.getElementById('user-avatar').src = data.avatar_url || 'https://placehold.co/100x100?text=Avatar'
  }

  document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault()

    const updates = {
      user_id: user.id,
      full_name: document.getElementById('full-name').value,
      avatar_url: document.getElementById('avatar-url').value,
      bio: document.getElementById('bio').value,
      collab_type: document.getElementById('collab-type').value,
      skills: document.getElementById('skills').value,
      platforms: document.getElementById('platforms').value,
      updated_at: new Date(),
    }

    const { error } = await supabase
      .from('profiles')
      .upsert(updates, { onConflict: ['user_id'] })

    if (error) {
      alert('Error saving profile: ' + error.message)
    } else {
      alert('Profile saved!')
      document.getElementById('user-avatar').src = updates.avatar_url || 'https://placehold.co/100x100?text=Avatar'
    }
  })

  document.getElementById('logout').addEventListener('click', async () => {
    await supabase.auth.signOut()
    window.location.href = 'login.html'
  })
})
