"use client"

import {
  Box,
  Button,
  Container,
  Field,
  Flex,
  Heading,
  HStack,
  Input,
  Stack,
  Text,
  Link,
  IconButton,
  InputGroup,
  Separator,
  Center,
  Image
} from "@chakra-ui/react"
import { useState, useRef, useEffect } from "react"
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  Building2,
  MapPin,
  Camera
} from "lucide-react"
import { useSearchParams, Link as RouterLink } from "react-router"
import { useAuth } from "../../utils"

// Validation Logic
const validateForm = (data, currentRole, imageFile) => {
  const newErrors = {}

  // 1. Photo Validation
  if (!imageFile) {
    newErrors.photo = "Profile photo is required"
  }

  // 2. Standard Fields
  if (!data.fullName?.trim()) newErrors.fullName = "Name is required"
  if (!data.email?.trim()) newErrors.email = "Email is required"
  if (!data.phone?.trim()) newErrors.phone = "Phone number is required"

  // 3. Password Validation
  if (!data.password) {
    newErrors.password = "Password is required"
  } else if (data.password.length < 6) {
    newErrors.password = "Password must be at least 6 characters"
  }

  if (data.password !== data.confirmPassword) {
    newErrors.confirmPassword = "Passwords do not match"
  }

  // 4. Role Specific (Guru)
  if (currentRole === 'guru') {
    if (!data.institute?.trim()) newErrors.institute = "Institute name is required"
    if (!data.director?.trim()) newErrors.director = "Director name is required"
    // Location remains optional
  }

  return newErrors
}

export function Signup() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialRole = searchParams.get("role") === "guru" ? "guru" : "student"
  const [role, setRole] = useState(initialRole)

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  const fileInputRef = useRef(null)
  const { signup, isLoading, errors, setErrors } = useAuth()

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview)
    }
  }, [imagePreview])

  const handleRoleChange = (newRole) => {
    if (role === newRole) return
    setRole(newRole)
    setSearchParams({ role: newRole })
    setErrors({})
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file (JPEG, PNG).")
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Image size should be less than 2MB.")
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setImageFile(file)
    setImagePreview(previewUrl)

    // Clear photo error immediately upon successful selection
    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors.photo
      return newErrors
    })
  }

  const handleInputChange = (field) => {
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)
    const rawData = Object.fromEntries(formData.entries())

    // Validation
    const validationErrors = validateForm(rawData, role, imageFile)

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    const payload = {
      ...rawData,
      role,
      photo: imageFile,
      fullName: rawData.fullName.trim(),
      email: rawData.email.trim(),
      phone: rawData.phone.trim(),
      ...(role === 'guru' && {
        institute: rawData.institute?.trim(),
        director: rawData.director?.trim(),
        location: rawData.location?.trim()
      })
    }

    // Call hook
    await signup(payload)
  }

  return (
    <Flex justify="center" align="center" w="full" minH={'100vh'} bg="bg.muted" px={4} py={20}>

      <Container maxW="md">
        <Stack gap="6">
          <Stack align={'center'}>
            <Heading size="3xl" fontWeight="extrabold">
              Create Account
            </Heading>
            <Text color="fg.muted" fontSize="md">
              Sign up as a {role === 'guru' ? 'Guru' : 'Student'}
            </Text>
          </Stack>

          <Flex
            bg="bg.subtle"
            p="1"
            borderRadius="lg"
            borderWidth="1px"
            borderColor="border.muted"
          >
            <Button
              flex="1"
              size="sm"
              variant={role === 'student' ? 'surface' : 'ghost'}
              colorPalette={role === 'student' ? 'blue' : 'gray'}
              onClick={() => handleRoleChange('student')}
            >
              Student
            </Button>
            <Button
              flex="1"
              size="sm"
              variant={role === 'guru' ? 'surface' : 'ghost'}
              colorPalette={role === 'guru' ? 'blue' : 'gray'}
              onClick={() => handleRoleChange('guru')}
            >
              Guru
            </Button>
          </Flex>

          <Separator />

          {/* Display Server Errors if they exist */}
          {errors.server && (
            <Box p={3} bg="red.50" color="red.700" borderWidth="1px" borderColor="red.200" borderRadius="md" fontSize="sm">
              {errors.server}
            </Box>
          )}

          <form onSubmit={handleSubmit}>
            <Stack gap="5">

              {/* Photo Upload */}
              <Flex direction="column" align="center" gap="2">
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  name="photo"
                  hidden
                  ref={fileInputRef}
                  onChange={handleImageChange}
                />

                <Box
                  boxSize="120px"
                  borderRadius="full"
                  bg="bg.subtle"
                  borderWidth="2px"
                  borderColor={errors.photo ? "red.500" : "border.muted"}
                  borderStyle="dashed"
                  cursor="pointer"
                  overflow="hidden"
                  position="relative"
                  flexShrink={0}
                  role="group"
                  onClick={() => fileInputRef.current?.click()}
                  transition="all 0.2s"
                  _hover={{ borderColor: errors.photo ? "red.600" : "blue.500" }}
                >
                  {imagePreview ? (
                    <>
                      <Image
                        src={imagePreview}
                        alt="Profile"
                        boxSize="full"
                        objectFit="cover"
                        display="block"
                      />
                      <Center
                        position="absolute"
                        inset="0"
                        bg="blackAlpha.600"
                        opacity="0"
                        _groupHover={{ opacity: 1 }}
                        transition="opacity 0.2s"
                        flexDirection="column"
                        gap="1"
                      >
                        <Camera size={20} color="white" />
                        <Text color="white" fontSize="xs" fontWeight="bold">Change</Text>
                      </Center>
                    </>
                  ) : (
                    <Center w="full" h="full" flexDirection="column" gap="1" color="fg.muted">
                      <Camera size={24} />
                      <Text fontSize="xs" fontWeight="medium">Upload</Text>
                    </Center>
                  )}
                </Box>

                {errors.photo && (
                  <Text color="red.500" fontSize="xs" fontWeight="medium">
                    {errors.photo}
                  </Text>
                )}
              </Flex>

              {/* Form Fields */}
              <Stack gap="4">
                <Field.Root invalid={!!errors.fullName}>
                  <InputGroup startElement={<User size={16} color="gray" />}>
                    <Input
                      name="fullName"
                      placeholder="Full Name"
                      ps="10"
                      onChange={() => handleInputChange('fullName')}
                    />
                  </InputGroup>
                  <Field.ErrorText>{errors.fullName}</Field.ErrorText>
                </Field.Root>

                <Field.Root invalid={!!errors.email}>
                  <InputGroup startElement={<Mail size={16} color="gray" />}>
                    <Input
                      name="email"
                      type="email"
                      placeholder="Email"
                      ps="10"
                      onChange={() => handleInputChange('email')}
                    />
                  </InputGroup>
                  <Field.ErrorText>{errors.email}</Field.ErrorText>
                </Field.Root>

                <Field.Root invalid={!!errors.phone}>
                  <InputGroup startElement={<Phone size={16} color="gray" />}>
                    <Input
                      name="phone"
                      type="tel"
                      placeholder="Phone Number"
                      ps="10"
                      onChange={() => handleInputChange('phone')}
                    />
                  </InputGroup>
                  <Field.ErrorText>{errors.phone}</Field.ErrorText>
                </Field.Root>

                {/* Guru Specific Fields */}
                {role === 'guru' && (
                  <>
                    <Field.Root invalid={!!errors.institute}>
                      <InputGroup startElement={<Building2 size={16} color="gray" />}>
                        <Input
                          name="institute"
                          placeholder="Institute Name"
                          ps="10"
                          onChange={() => handleInputChange('institute')}
                        />
                      </InputGroup>
                      <Field.ErrorText>{errors.institute}</Field.ErrorText>
                    </Field.Root>

                    <Field.Root invalid={!!errors.director}>
                      <InputGroup startElement={<User size={16} color="gray" />}>
                        <Input
                          name="director"
                          placeholder="Director Name"
                          ps="10"
                          onChange={() => handleInputChange('director')}
                        />
                      </InputGroup>
                      <Field.ErrorText>{errors.director}</Field.ErrorText>
                    </Field.Root>

                    <Field.Root invalid={!!errors.location}>
                      <InputGroup startElement={<MapPin size={16} color="gray" />}>
                        <Input name="location" placeholder="Location (Optional)" ps="10" />
                      </InputGroup>
                      <Field.ErrorText>{errors.location}</Field.ErrorText>
                    </Field.Root>
                  </>
                )}

                <Field.Root invalid={!!errors.password}>
                  <InputGroup
                    startElement={<Lock size={16} color="gray" />}
                    endElement={
                      <IconButton variant="ghost" size="sm" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </IconButton>
                    }
                  >
                    <Input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      ps="10"
                      onChange={() => handleInputChange('password')}
                    />
                  </InputGroup>
                  <Field.ErrorText>{errors.password}</Field.ErrorText>
                </Field.Root>

                <Field.Root invalid={!!errors.confirmPassword}>
                  <InputGroup
                    startElement={<Lock size={16} color="gray" />}
                    endElement={
                      <IconButton variant="ghost" size="sm" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </IconButton>
                    }
                  >
                    <Input
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm Password"
                      ps="10"
                      onChange={() => handleInputChange('confirmPassword')}
                    />
                  </InputGroup>
                  <Field.ErrorText>{errors.confirmPassword}</Field.ErrorText>
                </Field.Root>
              </Stack>


              <Stack>
                <Button
                  type="submit"
                  colorPalette="blue"
                  size="lg"
                  loading={isLoading}
                  loadingText="Signing up..."
                >
                  Sign Up as {role === 'guru' ? 'Guru' : 'Student'}
                </Button>
              </Stack>
            </Stack>
          </form>


          <HStack w="full">
            <Separator flex="1" />
            <Text fontSize="xs" color="fg.muted" fontWeight="medium">OR</Text>
            <Separator flex="1" />
          </HStack>

          <HStack gap="1" justify="center" fontSize="sm">
            <Text color="fg.muted">Already have an account?</Text>
            <Link asChild colorPalette="blue" fontWeight="semibold">
              <RouterLink to="/auth/login">Log in</RouterLink>
            </Link>
          </HStack>

        </Stack>
      </Container>
    </Flex>
  )
}