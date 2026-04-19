import {
  Box, Button, Container, Field, Flex, Heading, HStack, Input,
  Stack, Text, Link, IconButton, InputGroup, Separator, VStack
} from "@chakra-ui/react"
import { useState } from "react"
import { Link as RouterLink } from "react-router"
import { Eye, EyeOff, Mail, Lock } from "lucide-react"
import { useAuth } from "../../utils" // Import your hook

export function Login() {
  const [showPassword, setShowPassword] = useState(false)
  
  // Bring in everything we need from the useAuth hook
  const { login, isLoading, errors, setErrors } = useAuth()

  // Helper to clear errors when typing
  const clearError = (field) => {
    setErrors(prev => ({ ...prev, [field]: undefined, form: undefined }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Extract values from the form
    const formData = new FormData(e.currentTarget)
    const email = formData.get("email")
    const password = formData.get("password")

    // The useAuth hook handles the validation, edge function, session, and routing!
    await login({ email, password })
  }

  return (
    <Flex justify="center" align="center" w="full" minH="100vh" bg="bg.muted">
      <Container maxW="sm">
        <Stack gap="6">
          <Stack align="center">
            <Heading size="3xl" fontWeight="extrabold">Welcome back</Heading>
            <Text color="fg.muted" fontSize="md">Please enter your details to sign in</Text>
          </Stack>

          <Separator />

          <form onSubmit={handleSubmit}>
            <Stack gap="6">
              <Stack gap="5">

                {errors.form && (
                  <Box p={3} bg="red.50" color="red.700" borderWidth="1px" borderColor="red.200" borderRadius="md" fontSize="sm">
                    {errors.form}
                  </Box>
                )}

                <Field.Root invalid={!!errors.email}>
                  <InputGroup startElement={<Mail size={16} color="gray" />}>
                    <Input
                      name="email"
                      type="email"
                      placeholder="Email"
                      ps="10"
                      onChange={() => clearError('email')}
                    />
                  </InputGroup>
                  <Field.ErrorText>{errors.email}</Field.ErrorText>
                </Field.Root>

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
                      onChange={() => clearError('password')}
                    />
                  </InputGroup>
                  <Flex w="full" align="baseline">
                    <Field.ErrorText>{errors.password}</Field.ErrorText>
                    <Flex ms="auto" align="baseline">
                      <Link asChild colorPalette="blue" fontSize="xs">
                        <RouterLink to="/auth/forgot">Forgot password?</RouterLink>
                      </Link>
                    </Flex>
                  </Flex>
                </Field.Root>
              </Stack>

              <Button
                type="submit"
                colorPalette="blue"
                size="lg"
                loading={isLoading}
                loadingText="Signing in..."
              >
                Sign in
              </Button>
            </Stack>
          </form>

          <HStack w="full">
            <Separator flex="1" />
            <Text fontSize="xs" color="fg.muted" fontWeight="medium">OR</Text>
            <Separator flex="1" />
          </HStack>

          <VStack gap="1" fontSize="sm">
            <Text color="fg.muted">Don't have an account? Join now</Text>
            <HStack>
              <Link asChild colorPalette="blue">
                <RouterLink to="/auth/signup?role=student">As student</RouterLink>
              </Link>
              <Separator orientation="vertical" height="4" borderColor="fg.muted" />
              <Link asChild colorPalette="blue">
                <RouterLink to="/auth/signup?role=guru">As guru</RouterLink>
              </Link>
            </HStack>
          </VStack>

        </Stack>
      </Container>
    </Flex>
  )
}