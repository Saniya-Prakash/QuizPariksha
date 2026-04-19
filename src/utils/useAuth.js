import { useState } from 'react'
import { useNavigate } from 'react-router'
import { supabase } from '../lib/supabase' 
import { toaster } from "../components/ui/toaster"

export function useAuth() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})

  // ==========================================
  // SIGNUP LOGIC
  // ==========================================
  const signup = async (payload) => {
    setIsLoading(true)
    setErrors({}) 

    try {
      // // 1. Upload Profile Photo to Storage ('profile' bucket)
      // const file = payload.photo
      // const fileExt = file.name.split('.').pop()
      // const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      // const filePath = `avatars/${fileName}`

      // const { error: uploadError } = await supabase.storage
      //   .from('profile') 
      //   .upload(filePath, file)
      

      // if (uploadError) throw new Error("Photo upload failed: " + uploadError.message)

      // const { data: { publicUrl } } = supabase.storage.from('profile').getPublicUrl(filePath)

      // 2. Map role to match DB constraints
      const mappedRole = payload.role === 'guru' ? 'Teacher' : 'Student'

      // 3. Call Edge Function 'signup' to create Auth User
      const { data: authData, error: edgeError } = await supabase.functions.invoke('create-user', {
        body: {
          email: payload.email,
          password: payload.password,
          role: mappedRole
        }
      })

      // --- NEW ERROR HANDLING BLOCK ---
      if (edgeError) {
        let errorMessage = edgeError.message

        // Forcefully extract the hidden JSON body from the Supabase error context
        if (edgeError.context && typeof edgeError.context.clone === 'function') {
          try {
            const rawResponse = await edgeError.context.clone().json()
            if (rawResponse.error) {
              errorMessage = rawResponse.error
            }
          } catch (e) {
            console.error("Could not parse hidden edge error body")
          }
        } 
        
        // If it still says non-2xx, it's almost always a duplicate email from auth.admin
        if (errorMessage.includes("non-2xx")) {
          errorMessage = "A user with this email address has already been registered."
        }

        throw new Error(errorMessage)
      }
      // --------------------------------

      if (!authData) throw new Error("Server did not return valid authentication data.")

      // Safely extract token and user ID (handles both flat and nested session objects)
      const accessToken = authData.access_token || authData.session?.access_token
      const refreshToken = authData.refresh_token || authData.session?.refresh_token
      const authUserId = authData.user?.id || authData.session?.user?.id

      if (!accessToken || !authUserId) {
        throw new Error("Invalid response structure from signup edge function.")
      }

      // 4. Set the session locally so subsequent DB inserts bypass RLS restrictions
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      })
      
      if (sessionError) throw sessionError

      // 5. Insert into public."User" table
      const { data: newUser, error: userError } = await supabase
        .from('User')
        .insert({
          id: authUserId,
          name: payload.fullName,
          email: payload.email,
          mobile_number: payload.phone,
          profile_picture_url: "",
          role: mappedRole,
          email_verified: true,
          phone_verified: true
        })
        .select()
        .single()

      if (userError) throw new Error("Failed to create user profile: " + userError.message)

      // 6. If Guru, Insert into public.teacherprofile
      if (mappedRole === 'Teacher') {
        const { error: guruError } = await supabase
          .from('teacherprofile')
          .insert({
            teacher_id: newUser.user_id, 
            institute_name: payload.institute,
            director_name: payload.director,
            location: payload.location,
            email: payload.email
          })

        if (guruError) throw new Error("Failed to create institute profile: " + guruError.message)
      }

      // 7. Success! Save token and redirect
      localStorage.setItem('token', accessToken)
      toaster.create({ title: "Account created successfully!", type: "success" })
      
      // Route to correct dashboard based on role
      if (mappedRole === 'Teacher') {
        navigate("/guru")
      } else {
        navigate("/student")
      }

    } catch (error) {
      console.error("Signup failed:", error)
      setErrors({ server: error.message })
      toaster.create({ title: "Signup Failed", description: error.message, type: "error" })
    } finally {
      setIsLoading(false)
    }
  }

  // ==========================================
  // LOGIN LOGIC
  // ==========================================
  const login = async (data) => {
    setIsLoading(true)
    setErrors({}) 

    // 1. Client-side Validation
    const newErrors = {}
    if (!data.email?.trim()) newErrors.email = "Email is required"
    if (!data.password) newErrors.password = "Password is required"

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setIsLoading(false)
      return
    }

    try {
      // 2. Auth Logic using Edge Function
      const { data: responseData, error } = await supabase.functions.invoke('login', {
        body: { email: data.email.trim(), password: data.password },
      })

      // 3. Handle Edge Function Errors
      if (error) {
        let msg = error.message
        try { msg = JSON.parse(msg).error || msg } catch { }
        if (msg.includes("non-2xx")) msg = "Invalid email or password"
        throw new Error(msg)
      }

      if (!responseData?.session) throw new Error("Server did not return a valid session.")

      // 4. Set Local Supabase Session
      const { error: sessionError } = await supabase.auth.setSession(responseData.session)
      if (sessionError) throw sessionError
      
      localStorage.setItem('token', responseData.session.access_token)

      // 5. Conditional Redirect based on Role in metadata
      const role = responseData.session.user?.user_metadata?.role

      if (role === 'teacher' || role === 'Teacher') {
        navigate("/guru")
      } else if (role === 'student' || role === 'Student') {
        navigate("/student")
      } else {
        navigate("/")
      }

    } catch (err) {
      console.error("Login failed:", err)
      setErrors({ form: err.message || "An unexpected error occurred" })
    } finally {
      setIsLoading(false)
    }
  }

  return {
    signup,
    login,
    isLoading,
    errors, 
    setErrors
  }
}