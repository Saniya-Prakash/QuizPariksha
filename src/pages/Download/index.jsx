"use client"

import React from "react"
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  Stack,
  Flex,
  Button,
  Badge,
  Separator,
  Stat
} from "@chakra-ui/react"
import { 
  Smartphone, 
  GraduationCap, 
  School,
  CheckCircle2,
  ShieldCheck,
  Zap,
  WifiOff
} from "lucide-react"
import { Link } from "react-router" 

export function Download() {
  return (
    <Flex justify="center" align="center" w="full" minH={'100vh'} bg="bg.muted" px={4} py={20}>
    <Box py={6}>
      <Container maxW="4xl">
        
        {/* Header Section */}
        <Stack gap={4} textAlign="center" mb={12}>
          <Heading size="4xl" fontWeight="extrabold" letterSpacing="tight">
            Download our Apps
          </Heading>
          <Text fontSize="lg" color="fg.muted" maxW="2xl" mx="auto">
            Experience seamless learning and management. Whether you are a student preparing for exams or a guru managing an institute, we have the perfect app for you.
          </Text>
        </Stack>

        {/* App Cards Grid */}
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={8}>
          
          {/* --- Student App Card --- */}
          <AppCard 
            title="Quiz Pariksha"
            subtitle="For Students"
            description="Ace your exams with unlimited practice quizzes, real-time results, and performance tracking."
            icon={GraduationCap}
            colorScheme="blue"
            url="https://play.google.com/store/apps/details?id=com.app.quizcal"
            highlights={[
              { icon: WifiOff, label: "Offline Mode" },
              { icon: Zap, label: "Fast & Light" }
            ]}
            features={["Unlimited Quizzes", "Real-time Analytics", "Performance Reports"]}
          />

          {/* --- Teacher App Card --- */}
          <AppCard 
            title="Quiz Pariksha Guru"
            subtitle="For Teachers & Institutes"
            description="Manage your institute efficiently. Create tests, track student progress, and broadcast updates instantly."
            icon={School}
            colorScheme="green"
            url="https://play.google.com/store/apps/details?id=com.app.quizparikshainstitute"
            highlights={[
              { icon: ShieldCheck, label: "Secure Data" },
              { icon: Zap, label: "Instant Results" }
            ]}
            features={["Manage Students", "Create & Edit Tests", "Broadcast Notices"]}
          />

        </SimpleGrid>

        <Text textAlign="center" mt={12} fontSize="sm" color="fg.muted">
          Available exclusively on Android devices. iOS version coming soon.
        </Text>
      </Container>
    </Box>
    </Flex>
  )
}

// --- Reusable App Card Component ---
function AppCard({ title, subtitle, description, icon: MainIcon, colorScheme, url, highlights, features }) {
  const isBlue = colorScheme === 'blue'
  const accentColor = isBlue ? "blue.600" : "green.600"
  const bgColor = isBlue ? "blue.50" : "green.50"
  const badgeColor = isBlue ? "blue" : "green"

  return (
    <Flex 
      direction="column" 
      bg="bg.panel" 
      borderRadius="2xl" 
      borderWidth="1px" 
      borderColor="border.muted"
      overflow="hidden"
      shadow="md"
      transition="all 0.2s"
      _hover={{ transform: "translateY(-4px)", shadow: "xl", borderColor: accentColor }}
    >
      {/* Card Header */}
      <Flex p={8} direction="column" gap={6} flex="1">
        <Flex justify="space-between" align="start">
          <Flex 
            boxSize="16" 
            bg={bgColor} 
            color={accentColor} 
            borderRadius="2xl" 
            align="center" 
            justify="center"
          >
            <MainIcon size={32} />
          </Flex>
          <Badge size="lg" colorPalette={badgeColor} variant="solid" borderRadius="full" px={3}>
            {subtitle}
          </Badge>
        </Flex>

        <Stack gap={2}>
          <Heading size="2xl" fontWeight="bold">{title}</Heading>
          <Text color="fg.muted">{description}</Text>
        </Stack>

        {/* Highlights Row (Replaces Numeric Stats) */}
        <Flex 
          bg="bg.subtle" 
          p={4} 
          borderRadius="xl" 
          gap={4} 
          align="center"
          justify="space-evenly"
          borderWidth="1px"
          borderColor="border.subtle"
        >
          {highlights.map((item, i) => (
            <React.Fragment key={i}>
              <Flex align="center" gap={2} color="fg.muted">
                <item.icon size={18} />
                <Text fontSize="sm" fontWeight="medium">{item.label}</Text>
              </Flex>
              {i < highlights.length - 1 && <Separator orientation="vertical" height="4" />}
            </React.Fragment>
          ))}
        </Flex>

        {/* Features List */}
        <Stack gap={2}>
          {features.map((feat, i) => (
            <Flex key={i} align="center" gap={2} fontSize="sm" color="fg.muted">
              <CheckCircle2 size={16} color="var(--chakra-colors-green-500)" />
              <Text>{feat}</Text>
            </Flex>
          ))}
        </Stack>
      </Flex>

      {/* Card Footer / Action */}
      <Box p={6} pt={0}>
        <Button 
          asChild 
          size="xl" 
          w="full" 
          colorPalette={badgeColor}
          variant="solid"
          h="14"
        >
          <a href={url} target="_blank" rel="noopener noreferrer">
            <Smartphone size={20} />
            <Stack gap={0} align="start" lineHeight={1.2}>
              <Text fontSize="xs" fontWeight="normal" opacity={0.9}>Get now from</Text>
              <Text fontSize="md" fontWeight="bold">Google Play Store</Text>
            </Stack>
          </a>
        </Button>
      </Box>
    </Flex>
  )
}