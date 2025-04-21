import { createClient } from 'https://esm.sh/@supabase/supabase-js'

const supabaseUrl = 'https://eqpmbcbaqgdmrhwmvlya.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxcG1iY2JhcWdkbXJod212bHlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NDg4ODQsImV4cCI6MjA2MDQyNDg4NH0.V3SwBCiBkGO_YxTKnE7jbdFthmXAJNbiEVcjsLUYCaM'
const supabase = createClient(supabaseUrl, supabaseKey)

const fullNameInput = document.getElementById('full_name')
const emailInput = document.getElementById('email')
const bioInput = document.getElementById('bio')
const avatarInput = document.getElementById('avatar_url')
const avatarImage = document.getElementById('avatar')
const skillsInput = document.getElementById('skills')
const collabTypeInput = document.getElementById('collab_type')
const platformsInput = document.getElementById('platforms')

const saveBtn = document.getElementById('save')
const logoutBtn = document.getElementById('logout')

let user = null

async function loadProfile() {
  const {
    data: { session },
    error
  } = await supabase.auth.getSession()

  if (!session?.user) {
    window.location.href = '/login.html'
    return
  }

  user = session.user
  emailInput.value = user.email

  const { data, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, bio, avatar_url, skills, collab_type, platforms')
    .eq('user_id', user.id)
    .single()

  if (profileError && profileError.code !== 'PGRST116') {
    console.error('Profile load error:', profileError.message)
    return
  }

  if (data) {
    fullNameInput.value = data.full_name || ''
    bioInput.value = data.bio || ''
    avatarInput.value = data.avatar_url || ''
    avatarImage.src = data.avatar_url || 'https://via.placeholder.com/100'
    skillsInput.value = data.skills || ''
    collabTypeInput.value = data.collab_type || ''
    platformsInput.value = data.platforms || ''
  }
}

async function saveProfile() {
  if (!user) return

  const updates = {
    user_id: user.id,
    full_name: fullNameInput.value,
    bio: bioInput.value,
    avatar_url: avatarInput.value,
    skills: skillsInput.value,
    collab_type: collabTypeInput.value,
    platforms: platformsInput.value,
  }

  const { error } = await supabase
    .from('profiles')
    .upsert(updates, { onConflict: ['user_id'] })

  if (error) {
    console.error('Error updating profile:', error.message)
    alert('Failed to save profile.')
  } else {
    alert('Profile saved!')
    avatarImage.src = avatarInput.value || 'https://via.placeholder.com/100'
  }
}

saveBtn.addEventListener('click', saveProfile)
logoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut()
  window.location.href = '/login.html'
})

loadProfile()
