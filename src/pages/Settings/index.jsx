import { useEffect, useState, useRef } from "react"
import {
    Box, Flex, Heading, Button, VStack, HStack, Text, Card, Input, Separator, Grid, Center, Spinner, Image, Badge
} from "@chakra-ui/react"
import { Field } from "../../components/ui/field"
import { Toaster, toaster } from "../../components/ui/toaster"
import { Camera, Save, Lock, User as UserIcon, Building2, GraduationCap } from "lucide-react"
import { supabase } from "../../lib/supabase"

export function Settings() {
    const fileInputRef = useRef(null)

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [role, setRole] = useState(null)
    const [userId, setUserId] = useState(null) // BIGINT user_id

    // --- Form States ---
    const [profile, setProfile] = useState({ name: "", phone: "", email: "", avatarUrl: "" })
    const [roleData, setRoleData] = useState({}) // Holds either Guru or Student specific data
    const [passwords, setPasswords] = useState({ newPassword: "", confirmPassword: "" })
    
    const [avatarFile, setAvatarFile] = useState(null)
    const [avatarPreview, setAvatarPreview] = useState(null)

    useEffect(() => {
        const fetchUserData = async () => {
            setLoading(true)
            try {
                const { data: { user: authUser } } = await supabase.auth.getUser()
                if (!authUser) return

                // 1. Fetch main User record (Safe to use .single() here because User row always exists)
                const { data: dbUser, error: userError } = await supabase
                    .from('User')
                    .select('*')
                    .eq('id', authUser.id)
                    .single()

                if (userError) throw userError

                setRole(dbUser.role)
                setUserId(dbUser.user_id)
                setProfile({
                    name: dbUser.name || "",
                    phone: dbUser.mobile_number || "",
                    email: dbUser.email || "",
                    avatarUrl: dbUser.profile_picture_url || ""
                })

                // 2. Fetch Role-Specific Record using .maybeSingle() to prevent 406 errors!
                if (dbUser.role === 'Teacher') {
                    const { data: tData } = await supabase
                        .from('teacherprofile')
                        .select('*')
                        .eq('teacher_id', dbUser.user_id)
                        .maybeSingle() // <--- FIX 2 applied here
                    
                    if (tData) {
                        setRoleData({
                            institute: tData.institute_name || "",
                            director: tData.director_name || "",
                            location: tData.location || ""
                        })
                    } else {
                        setRoleData({ institute: "", director: "", location: "" })
                    }
                } else if (dbUser.role === 'Student') {
                    const { data: sData } = await supabase
                        .from('studentprofile')
                        .select('*')
                        .eq('student_id', dbUser.user_id)
                        .maybeSingle() // <--- FIX 2 applied here
                    
                    if (sData) {
                        setRoleData({
                            class: sData.class || "",
                            language: sData.language || ""
                        })
                    } else {
                        setRoleData({ class: "", language: "" })
                    }
                }
            } catch (error) {
                console.error("Error loading settings:", error)
                toaster.create({ title: "Failed to load profile", type: "error" })
            } finally {
                setLoading(false)
            }
        }

        fetchUserData()

        return () => {
            if (avatarPreview) URL.revokeObjectURL(avatarPreview)
        }
    }, [])

    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (!file) return
        if (!file.type.startsWith("image/")) return toaster.create({ title: "Invalid image format", type: "error" })
        if (file.size > 2 * 1024 * 1024) return toaster.create({ title: "Image must be under 2MB", type: "error" })

        setAvatarFile(file)
        setAvatarPreview(URL.createObjectURL(file))
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            let finalAvatarUrl = profile.avatarUrl

            // 1. Upload new avatar if selected
            if (avatarFile) {
                const fileExt = avatarFile.name.split('.').pop()
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
                const filePath = `avatars/${fileName}`

                const { error: uploadError } = await supabase.storage.from('profile').upload(filePath, avatarFile)
                if (uploadError) throw uploadError

                const { data } = supabase.storage.from('profile').getPublicUrl(filePath)
                finalAvatarUrl = data.publicUrl
            }

            // 2. Update Main User Table
            const { error: userUpdateError } = await supabase
                .from('User')
                .update({
                    name: profile.name,
                    mobile_number: profile.phone,
                    profile_picture_url: finalAvatarUrl
                })
                .eq('user_id', userId)

            if (userUpdateError) throw userUpdateError

            // 3. Update Role Specific Table
            if (role === 'Teacher') {
                await supabase
                    .from('teacherprofile')
                    .update({
                        institute_name: roleData.institute,
                        director_name: roleData.director,
                        location: roleData.location
                    })
                    .eq('teacher_id', userId)
            } else if (role === 'Student') {
                await supabase
                    .from('studentprofile')
                    .upsert({
                        student_id: userId,
                        class: roleData.class,
                        language: roleData.language
                    })
            }

            // 4. Update Password if requested
            if (passwords.newPassword) {
                if (passwords.newPassword !== passwords.confirmPassword) {
                    throw new Error("Passwords do not match")
                }
                if (passwords.newPassword.length < 6) {
                    throw new Error("Password must be at least 6 characters")
                }
                const { error: passError } = await supabase.auth.updateUser({ password: passwords.newPassword })
                if (passError) throw passError
                
                setPasswords({ newPassword: "", confirmPassword: "" })
                toaster.create({ title: "Password updated successfully!", type: "success" })
            }

            setProfile(prev => ({ ...prev, avatarUrl: finalAvatarUrl }))
            setAvatarFile(null)
            setAvatarPreview(null)
            toaster.create({ title: "Profile saved successfully!", type: "success" })

        } catch (error) {
            console.error("Save error:", error)
            toaster.create({ title: "Error saving profile", description: error.message, type: "error" })
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <Center py={20}><Spinner size="xl" color="blue.500" /></Center>

    return (
        <Box w="full" p={{ base: 4, md: 8 }} maxW="900px" mx="auto">
            <Toaster />

            <Flex justify="space-between" align="center" bg="bg.panel" p={6} borderRadius="lg" border="1px solid" borderColor="border.muted" mb={8}>
                <VStack align="start" gap={1}>
                    <Heading size="xl" fontWeight="bold">Account Settings</Heading>
                    <Text color="fg.muted" fontSize="sm">Manage your profile, preferences, and security.</Text>
                </VStack>
                <Badge size="lg" colorPalette={role === 'Teacher' ? 'purple' : 'blue'} variant="subtle" px={4} py={2} borderRadius="md">
                    {role === 'Teacher' ? 'Guru Account' : 'Student Account'}
                </Badge>
            </Flex>

            <Grid templateColumns={{ base: "1fr", lg: "1fr" }} gap={8}>
                
                {/* 1. Basic Profile Card */}
                <Card.Root variant="outline" borderColor="border.muted">
                    <Card.Header display="flex" gap={2} bg="bg.subtle" py={4} borderBottom="1px solid" borderColor="border.muted">
                        <UserIcon size={20} color="var(--chakra-colors-blue-500)"/> <Heading size="md">Public Profile</Heading>
                    </Card.Header>
                    <Card.Body py={6}>
                        <Flex direction={{ base: "column", md: "row" }} gap={8} align="start">
                            {/* Avatar Upload */}
                            <VStack align="center" gap={3}>
                                <Box
                                    boxSize="120px" borderRadius="full" bg="bg.subtle" borderWidth="2px" borderColor="border.muted"
                                    borderStyle="dashed" cursor="pointer" overflow="hidden" position="relative" role="group"
                                    onClick={() => fileInputRef.current?.click()} _hover={{ borderColor: "blue.500" }} transition="all 0.2s"
                                >
                                    <Image 
                                        src={avatarPreview || profile.avatarUrl || "https://vhighahragcgqndcsxmn.supabase.co/storage/v1/object/public/profile/Daco_3120300.png"} 
                                        boxSize="full" objectFit="cover" 
                                    />
                                    <Center position="absolute" inset="0" bg="blackAlpha.600" opacity="0" _groupHover={{ opacity: 1 }} transition="opacity 0.2s" flexDirection="column">
                                        <Camera size={20} color="white" />
                                        <Text color="white" fontSize="xs" fontWeight="bold" mt={1}>Change</Text>
                                    </Center>
                                </Box>
                                <input type="file" accept="image/png, image/jpeg, image/jpg" ref={fileInputRef} hidden onChange={handleImageChange} />
                                <Text fontSize="xs" color="fg.muted">JPG, PNG under 2MB</Text>
                            </VStack>

                            {/* Basic Details - FIX 1 APPLIED HERE */}
                            <VStack align="stretch" flex={1} gap={4}>
                                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
                                    <Field label="Full Name">
                                        <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                                    </Field>
                                    <Field label="Email (Read-only)">
                                        <Input value={profile.email} readOnly bg="bg.muted" color="fg.muted" />
                                    </Field>
                                    <Field label="Phone Number">
                                        <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                                    </Field>
                                </Grid>
                            </VStack>
                        </Flex>
                    </Card.Body>
                </Card.Root>

                {/* 2. Role Specific Data Card */}
                <Card.Root variant="outline" borderColor="border.muted">
                    <Card.Header display="flex" gap={2} bg="bg.subtle" py={4} borderBottom="1px solid" borderColor="border.muted">
                        {role === 'Teacher' ? <Building2 size={20} color="var(--chakra-colors-purple-500)"/> : <GraduationCap size={20} color="var(--chakra-colors-blue-500)"/>}
                        <Heading size="md">{role === 'Teacher' ? 'Institute Details' : 'Academic Details'}</Heading>
                    </Card.Header>
                    <Card.Body py={6}>
                        <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={5}>
                            {role === 'Teacher' ? (
                                <>
                                    <Field label="Institute Name"><Input value={roleData.institute} onChange={(e) => setRoleData({ ...roleData, institute: e.target.value })} /></Field>
                                    <Field label="Director Name"><Input value={roleData.director} onChange={(e) => setRoleData({ ...roleData, director: e.target.value })} /></Field>
                                    <Field label="Location"><Input value={roleData.location} onChange={(e) => setRoleData({ ...roleData, location: e.target.value })} /></Field>
                                </>
                            ) : (
                                <>
                                    <Field label="Class / Grade Level"><Input placeholder="e.g., 10th, 12th, JEE" value={roleData.class} onChange={(e) => setRoleData({ ...roleData, class: e.target.value })} /></Field>
                                    <Field label="Preferred Language"><Input placeholder="e.g., English, Hindi" value={roleData.language} onChange={(e) => setRoleData({ ...roleData, language: e.target.value })} /></Field>
                                </>
                            )}
                        </Grid>
                    </Card.Body>
                </Card.Root>

                {/* 3. Security / Password Card */}
                <Card.Root variant="outline" borderColor="border.muted">
                    <Card.Header display="flex" gap={2} bg="bg.subtle" py={4} borderBottom="1px solid" borderColor="border.muted">
                        <Lock size={20} color="var(--chakra-colors-red-500)"/> <Heading size="md">Security</Heading>
                    </Card.Header>
                    <Card.Body py={6}>
                        <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={5}>
                            <Field label="New Password">
                                <Input type="password" placeholder="Leave blank to keep current" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} />
                            </Field>
                            <Field label="Confirm New Password">
                                <Input type="password" placeholder="Confirm new password" value={passwords.confirmPassword} onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })} />
                            </Field>
                        </Grid>
                    </Card.Body>
                </Card.Root>

            </Grid>

            {/* Floating Save Button */}
            <Flex justify="flex-end" mt={8} position="sticky" bottom={8} zIndex="sticky">
                <Button colorPalette="blue" size="lg" shadow="xl" px={8} borderRadius="full" onClick={handleSave} loading={saving}>
                    <Save size={18} /> Save Changes
                </Button>
            </Flex>
        </Box>
    )
}