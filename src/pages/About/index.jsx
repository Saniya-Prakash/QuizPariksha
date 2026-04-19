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
  Circle,
  Separator,
  Button,
  Badge
} from "@chakra-ui/react"
import { 
  Brain, 
  Zap, 
  Download, 
  Layers, 
  PlayCircle, 
  BookOpenCheck,
  ArrowRight
} from "lucide-react"
import { Link } from "react-router"

export function About() {
  return (
    // Updated Parent Wrapper with improved responsive padding
    <Flex 
      direction="column" 
      w="full" 
      minH="100vh" 
      bg="bg.default"
    >
      
      {/* --- Hero / Intro Section --- */}
      <Flex 
        direction="column" 
        align="center" 
        justify="center" 
        textAlign="center" 
        bg="bg.subtle" 
        py={20}
        px={{ base: 6, md: 12 }} // Responsive padding
      >
        <Container maxW="container.lg">
          <Badge size="lg" variant="surface" colorPalette="blue" borderRadius="full" px={4} mb={6}>
            About Us
          </Badge>
          <Heading size={{ base: "4xl", md: "5xl" }} fontWeight="extrabold" mb={6} letterSpacing="tight">
            Empowering Education <br />
            <Text as="span" color="blue.600">Through Technology</Text>
          </Heading>
          <Text fontSize={{ base: "lg", md: "xl" }} color="fg.muted" maxW="2xl" mx="auto">
            Quiz Pariksha bridges the gap between students and teachers. We provide a seamless platform for conducting tests, analyzing performance, and mastering concepts.
          </Text>
        </Container>
      </Flex>

      {/* --- Why Quiz Pariksha? (Values) --- */}
      <Box py={24} px={{ base: 6, md: 12 }}>
        <Container maxW="container.xl">
          <Heading size="3xl" fontWeight="bold" textAlign="center" mb={16}>
            Why Quiz Pariksha?
          </Heading>

          <SimpleGrid columns={{ base: 1, md: 3 }} gap={10}>
            <ValueCard 
              icon={Brain}
              color="purple"
              title="Concept Clarity"
              description="Solidify your understanding with meticulously crafted quizzes and resources covering core educational concepts."
            />
            <ValueCard 
              icon={Layers} 
              color="blue"
              title="Skill Application"
              description="Apply theoretical knowledge to practical scenarios. Think critically and understand the logic, don't just memorize."
            />
            <ValueCard 
              icon={Zap}
              color="orange"
              title="Rapid Improvement"
              description="Get instant feedback and detailed explanations after every question to learn from mistakes and improve quickly."
            />
          </SimpleGrid>
        </Container>
      </Box>

      {/* --- How It Works (Timeline/Steps) --- */}
      <Box py={24} bg="bg.muted" position="relative" overflow="hidden" px={{ base: 6, md: 12 }}>
        <Container maxW="container.xl">
          <Heading size="3xl" fontWeight="bold" textAlign="center" mb={20}>
            How Quiz Pariksha Works
          </Heading>

          <Stack gap={{ base: 12, md: 0 }} position="relative">
            {/* Desktop Connector Line */}
            <Box 
              display={{ base: "none", md: "block" }}
              position="absolute" 
              left="50%" 
              top="0" 
              bottom="0" 
              w="2px" 
              bg="border.subtle" 
              transform="translateX(-50%)" 
              zIndex={0}
            />

            <StepRow 
              number="1"
              title="Download the App"
              description="Get Quiz Pariksha from the Google Play Store. It’s free, lightweight, and quick to install on your device."
              icon={Download}
              align="left"
            />

            <StepRow 
              number="2"
              title="Choose Your Role"
              description="Sign up as a Student to join batches, or as a Guru to manage your institute and create tests."
              icon={Layers}
              align="right"
            />

            <StepRow 
              number="3"
              title="Take or Assign Quizzes"
              description="Teachers broadcast tests to batches. Students answer interactive questions and submit their responses."
              icon={PlayCircle}
              align="left"
            />

            <StepRow 
              number="4"
              title="Review & Learn"
              description="Get instant results. Review explanations for every question and track performance analytics over time."
              icon={BookOpenCheck}
              align="right"
            />
          </Stack>
        </Container>
      </Box>

      {/* --- CTA Footer --- */}
      <Box py={20} textAlign="center" px={{ base: 6, md: 12 }}>
        <Container maxW="container.md">
          <Heading size="2xl" mb={6}>Ready to get started?</Heading>
          <Stack direction={{ base: "column", sm: "row" }} gap={4} justify="center">
            <Button asChild size="xl" colorPalette="blue" borderRadius="full" px={8}>
              <Link to="/auth/signup?role=student">Sign Up Now <ArrowRight /></Link>
            </Button>
            <Button asChild size="xl" variant="outline" borderRadius="full" px={8}>
              <Link to="/download">Download App</Link>
            </Button>
          </Stack>
        </Container>
      </Box>
    </Flex>
  )
}

// --- Helper Components ---

function ValueCard({ icon: Icon, title, description, color }) {
  return (
    <Stack 
      align="center" 
      textAlign="center" 
      p={8} 
      bg="bg.panel" 
      borderRadius="2xl" 
      borderWidth="1px" 
      borderColor="border.subtle"
      shadow="sm"
      transition="all 0.2s"
      _hover={{ transform: "translateY(-5px)", shadow: "md", borderColor: `${color}.400` }}
    >
      <Circle size="16" bg={`${color}.100`} color={`${color}.600`} mb={4}>
        <Icon size={32} />
      </Circle>
      <Heading size="xl" mb={2}>{title}</Heading>
      <Text color="fg.muted" fontSize="lg" lineHeight="tall">
        {description}
      </Text>
    </Stack>
  )
}

function StepRow({ number, title, description, icon: Icon, align }) {
  const isLeft = align === 'left'

  return (
    <Flex 
      direction={{ base: "column", md: isLeft ? "row" : "row-reverse" }} 
      align="center" 
      justify="center"
      gap={{ base: 4, md: 16 }}
      position="relative"
      zIndex={1}
    >
      {/* Content Side */}
      <Box flex="1" textAlign={{ base: "center", md: isLeft ? "right" : "left" }}>
        <Heading size="2xl" mb={2} color="blue.600">Step {number}</Heading>
        <Heading size="xl" mb={3}>{title}</Heading>
        <Text fontSize="lg" color="fg.muted">{description}</Text>
      </Box>

      {/* Icon Circle Center */}
      <Circle 
        size="20" 
        bg="bg.panel" 
        borderWidth="4px" 
        borderColor="blue.100" 
        color="blue.600"
        shadow="lg"
      >
        <Icon size={32} />
      </Circle>

      {/* Empty Space for Balance */}
      <Box flex="1" display={{ base: "none", md: "block" }} />
    </Flex>
  )
}