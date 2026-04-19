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
  Badge,
  Button,
  Circle,
  Separator,
  Icon
} from "@chakra-ui/react"
import { Link } from "react-router"
import { 
  CheckCircle2, 
  BarChart3, 
  Clock, 
  FileText, 
  Users, 
  ShieldCheck, 
  Smartphone,
  Download,
  WifiOff,
  Bell,
  Trophy,
  User,
  GraduationCap
} from "lucide-react"

export function Features() {
  return (
    <Box bg="bg.default" minH="100vh">
      
      {/* --- Hero Section --- */}
      <Flex 
        direction="column" 
        align="center" 
        justify="center" 
        textAlign="center" 
        bg="bg.subtle" 
        py={20}
        px={{ base: 6, md: 12 }}
        borderBottomWidth="1px"
        borderColor="border.subtle"
      >
        <Container maxW="container.lg">
          <Badge size="lg" variant="surface" colorPalette="purple" borderRadius="full" px={4} mb={6}>
            Platform Features
          </Badge>
          <Heading size={{ base: "4xl", md: "5xl" }} fontWeight="extrabold" mb={6} letterSpacing="tight">
            Two Roles, One Powerful <br />
            <Text as="span" color="purple.600">Ecosystem</Text>
          </Heading>
          <Text fontSize={{ base: "lg", md: "xl" }} color="fg.muted" maxW="2xl" mx="auto">
            Whether you are here to learn or to teach, Quiz Pariksha provides a dedicated suite of tools tailored to your specific needs.
          </Text>
        </Container>
      </Flex>

      {/* --- Side-by-Side Comparison Section --- */}
      <Box position="relative">
        
        {/* Desktop Vertical Divider */}
        <Box 
            display={{ base: "none", xl: "block" }}
            position="absolute" 
            left="50%" 
            top="0" 
            bottom="0" 
            w="1px" 
            bg="border.subtle" 
            transform="translateX(-50%)" 
            zIndex={1}
        />

        <Container maxW="container.2xl" px={0}>
          <SimpleGrid columns={{ base: 1, xl: 2 }} gap={0}>
            
            {/* ================= LEFT SIDE: STUDENTS ================= */}
            <Box 
                py={20} 
                px={{ base: 6, md: 16 }} 
                bg="blue.50/30" 
                _dark={{ bg: "blue.900/10" }}
            >
              <Stack gap={12} maxW="xl" mx="auto" xl={{ mx: 0, ml: "auto" }}>
                <RoleHeader 
                  icon={GraduationCap}
                  title="For Students"
                  subtitle="Learn & Excel"
                  description="Tools designed to help you practice effectively, track your growth, and ace your exams."
                  color="blue"
                />

                <Stack gap={6}>
                  <FeatureRow 
                    icon={Clock} color="blue" 
                    title="Real-time Quizzes" 
                    desc="Exam-like conditions with timers & negative marking." 
                  />
                  <FeatureRow 
                    icon={BarChart3} color="blue" 
                    title="Deep Analytics" 
                    desc="Analyze accuracy, speed, and compare with toppers." 
                  />
                  <FeatureRow 
                    icon={FileText} color="blue" 
                    title="Study Resources" 
                    desc="Access notes and practice papers instantly." 
                  />
                  <FeatureRow 
                    icon={WifiOff} color="blue" 
                    title="Offline Mode" 
                    desc="Download tests to practice without internet." 
                  />
                  <FeatureRow 
                    icon={Trophy} color="blue" 
                    title="Leaderboards" 
                    desc="Compete with peers and improve your rank." 
                  />
                </Stack>

                <Button asChild size="xl" colorPalette="blue" variant="surface" mt={4}>
                    <Link to="/auth/signup?role=student">Join as Student</Link>
                </Button>
              </Stack>
            </Box>

            {/* ================= RIGHT SIDE: GURUS ================= */}
            <Box 
                py={20} 
                px={{ base: 6, md: 16 }} 
                bg="green.50/30"
                _dark={{ bg: "green.900/10" }}
            >
               <Stack gap={12} maxW="xl" mx="auto" xl={{ mx: 0, mr: "auto" }}>
                <RoleHeader 
                  icon={Users}
                  title="For Gurus"
                  subtitle="Manage & Assess"
                  description="A complete command center for your institute. Manage batches, tests, and results with ease."
                  color="green"
                />

                <Stack gap={6}>
                  <FeatureRow 
                    icon={Users} color="green" 
                    title="Batch Management" 
                    desc="Create batches and enroll students in seconds." 
                  />
                  <FeatureRow 
                    icon={CheckCircle2} color="green" 
                    title="Custom Test Creation" 
                    desc="Set sections, marking schemes, and time limits." 
                  />
                  <FeatureRow 
                    icon={BarChart3} color="green" 
                    title="Automated Grading" 
                    desc="Auto-generated result sheets save hours of work." 
                  />
                  <FeatureRow 
                    icon={ShieldCheck} color="green" 
                    title="Secure Platform" 
                    desc="Anti-screenshot protection for your content." 
                  />
                  <FeatureRow 
                    icon={Smartphone} color="green" 
                    title="Broadcast Notices" 
                    desc="Send announcements directly to students." 
                  />
                </Stack>

                <Button asChild size="xl" colorPalette="green" variant="surface" mt={4}>
                    <Link to="/auth/signup?role=guru">Join as Guru</Link>
                </Button>
              </Stack>
            </Box>

          </SimpleGrid>
        </Container>
      </Box>

      {/* --- CTA Section --- */}
      <Box py={20} px={{ base: 6, md: 12 }} borderTopWidth="1px" borderColor="border.subtle">
        <Container maxW="container.lg">
          <Stack 
            textAlign="center"
            gap={8}
            align="center"
          >
            <Heading size="3xl" fontWeight="bold">Ready to get started?</Heading>
            <Text fontSize="xl" color="fg.muted" maxW="2xl">
              Join the ecosystem today. Whether you're a student or a teacher, we have the tools you need to succeed.
            </Text>
            <Flex gap={4} direction={{ base: "column", sm: "row" }}>
               <Button asChild size="xl" px={8} colorPalette="blue">
                  <Link to="/download">Download App</Link>
               </Button>
            </Flex>
          </Stack>
        </Container>
      </Box>

    </Box>
  )
}

// --- Helper Components ---

function RoleHeader({ icon: Icon, title, subtitle, description, color }) {
    return (
        <Stack gap={4}>
            <Flex align="center" gap={3}>
                <Circle size="10" bg={`${color}.100`} color={`${color}.600`}>
                    <Icon size={20} />
                </Circle>
                <Badge colorPalette={color} variant="solid" size="lg" borderRadius="full" px={3}>
                    {title}
                </Badge>
            </Flex>
            <Heading size="3xl" fontWeight="bold">{subtitle}</Heading>
            <Text fontSize="lg" color="fg.muted" lineHeight="tall">
                {description}
            </Text>
        </Stack>
    )
}

function FeatureRow({ icon: Icon, title, desc, color }) {
    return (
        <Flex gap={4} align="start">
            <Circle 
                size="10" 
                bg="bg.panel" 
                borderWidth="1px" 
                borderColor="border.subtle" 
                color={`${color}.600`}
                flexShrink={0}
            >
                <Icon size={18} />
            </Circle>
            <Stack gap={0}>
                <Text fontWeight="bold" fontSize="lg">{title}</Text>
                <Text color="fg.muted" fontSize="md">{desc}</Text>
            </Stack>
        </Flex>
    )
}