import React from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  Stack,
  SimpleGrid,
  Flex,
  Badge,
  Center
} from "@chakra-ui/react";
import { Link } from "react-router"; // react-router for Vite
import { 
  ArrowRight, 
  BookOpen, 
  BarChart3, 
  CheckCircle2, 
  Users, 
  FileText,
  ShieldCheck,
  Zap,
  Globe
} from "lucide-react";

// --- Hero Section ---
const HeroSection = () => {
  return (
    <Box position="relative" overflow="hidden" pt={{ base: 4, md: 16 }} pb={{ base: 16, md: 24 }} px={8}>
      {/* Background Decoration */}
      <Box position="absolute" top="-10%" right="-5%" w="500px" h="500px" bg="blue.100" filter="blur(100px)" opacity="0.5" borderRadius="full" zIndex="-1" />
      <Box position="absolute" bottom="0" left="-10%" w="400px" h="400px" bg="green.100" filter="blur(80px)" opacity="0.5" borderRadius="full" zIndex="-1" />

      <Container maxW="container.xl">
        <Stack gap={8} align="center" textAlign="center">
          <Badge size="lg" variant="surface" colorPalette="blue" borderRadius="full" px={4}>
            🎓 The Digital Classroom Platform
          </Badge>
          
          <Heading size={{ base: "4xl", md: "6xl" }} fontWeight="extrabold" letterSpacing="tight" lineHeight="1.1">
            Master Your Exams, <br />
            <Text as="span" color="blue.600">Ace Your Future.</Text>
          </Heading>
          
          <Text fontSize={{ base: "lg", md: "xl" }} color="fg.muted" maxW="2xl">
            A complete ecosystem for modern education. Students join batches to practice and learn, while Gurus manage institutes and conduct tests seamlessly.
          </Text>

          <Stack direction={{ base: "column", sm: "row" }} gap={4} pt={4}>
            <Button asChild size="xl" colorPalette="blue" px={8} borderRadius="full">
              <Link to="/auth/signup?role=student">
                Start Learning <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="xl" variant="outline" px={8} borderRadius="full">
              <Link to="/features">
                Explore Features
              </Link>
            </Button>
          </Stack>

          {/* Abstract App Preview */}
          <Box 
            mt={12} 
            w="full" 
            maxW="5xl" 
            h={{ base: "200px", md: "500px" }}
            bgGradient="to-b" gradientFrom="gray.100" gradientTo="white"
            borderRadius="2xl"
            borderWidth="1px"
            borderColor="border.subtle"
            shadow="xl"
            position="relative"
            overflow="hidden"
          >
             <Center h="full" flexDirection="column" gap={4}>
                <BookOpen size={64} color="var(--chakra-colors-blue-300)" />
                <Text color="gray.400" fontWeight="medium">App Dashboard Preview</Text>
             </Center>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
};

// --- Highlights Strip (Replaces Stats) ---
// Instead of numbers, we show qualitative benefits to build trust
const HighlightsSection = () => {
    return (
      <Box bg="bg.subtle" py={8} borderYWidth="1px" borderColor="border.subtle">
        <Container maxW="container.lg">
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={8} textAlign="center">
            <Flex justify="center" align="center" gap={3}>
                <ShieldCheck size={24} color="var(--chakra-colors-blue-600)" />
                <Text fontWeight="bold" fontSize="lg" color="fg.muted">Secure & Private</Text>
            </Flex>
            <Flex justify="center" align="center" gap={3}>
                <Zap size={24} color="var(--chakra-colors-orange-500)" />
                <Text fontWeight="bold" fontSize="lg" color="fg.muted">Real-time Results</Text>
            </Flex>
            <Flex justify="center" align="center" gap={3}>
                <Globe size={24} color="var(--chakra-colors-green-600)" />
                <Text fontWeight="bold" fontSize="lg" color="fg.muted">Accessible Anywhere</Text>
            </Flex>
          </SimpleGrid>
        </Container>
      </Box>
    );
  };

// --- Features Section ---
const FeatureCard = ({ icon: Icon, title, description, color }) => (
  <Stack 
    bg="bg.panel" 
    p={8} 
    borderRadius="xl" 
    shadow="sm" 
    borderWidth="1px" 
    borderColor="border.subtle"
    transition="all 0.2s"
    _hover={{ transform: "translateY(-5px)", shadow: "md", borderColor: `${color}.400` }}
  >
    <Box p={3} bg={`${color}.100`} w="fit-content" borderRadius="lg" color={`${color}.600`}>
      <Icon size={24} />
    </Box>
    <Heading size="lg" fontWeight="bold" pt={2}>{title}</Heading>
    <Text color="fg.muted" fontSize="md" lineHeight="tall">
      {description}
    </Text>
  </Stack>
);

const FeaturesSection = () => {
  return (
    <Box py={20} px={8}>
      <Container maxW="container.xl">
        <Stack gap={4} mb={16} textAlign={{ base: "left", md: "center" }} align={{ base: "start", md: "center" }}>
          <Text color="blue.600" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" fontSize="sm">
            Why Choose Quiz Pariksha
          </Text>
          <Heading size="4xl" fontWeight="extrabold">
            Better Management, Smarter Learning
          </Heading>
        </Stack>

        <SimpleGrid columns={{ base: 1, md: 3 }} gap={8}>
          <FeatureCard 
            icon={Users}
            color="purple"
            title="Batch Management"
            description="Teachers can create batches and add students seamlessly. Students simply join their assigned batch to access all materials."
          />
          <FeatureCard 
            icon={FileText}
            color="blue"
            title="Comprehensive Resources"
            description="Access study materials, notes, and practice papers directly within the app. Everything you need to prepare is one click away."
          />
          <FeatureCard 
            icon={BarChart3}
            color="orange"
            title="Performance Analysis"
            description="Get detailed analytics after every test. Compare your score with the batch topper and track your improvement over time."
          />
        </SimpleGrid>
      </Container>
    </Box>
  );
};

// --- Ecosystem Section (Student vs Guru) ---
const EcosystemSection = () => {
  return (
    <Box py={20} bg="bg.muted" px={8}>
      <Container maxW="container.xl">
        <Stack gap={12}>
          <Heading size="3xl" fontWeight="extrabold" textAlign="center">
            One Platform, Two Powerful Roles
          </Heading>

          <SimpleGrid columns={{ base: 1, md: 2 }} gap={10}>
            {/* Student Side */}
            <Flex 
              direction="column" 
              bg="white" 
              _dark={{ bg: "gray.800" }}
              p={10} 
              borderRadius="2xl" 
              shadow="lg"
              borderTopWidth="6px"
              borderColor="blue.500"
            >
              <Badge colorPalette="blue" w="fit-content" mb={4}>For Students</Badge>
              <Heading size="2xl" mb={4}>Learn & Excel</Heading>
              <Stack gap={3} mb={8} color="fg.muted">
                <Flex align="center" gap={3}><CheckCircle2 size={18} color="var(--chakra-colors-blue-500)"/> Join batches assigned by your institute</Flex>
                <Flex align="center" gap={3}><CheckCircle2 size={18} color="var(--chakra-colors-blue-500)"/> Access exclusive study resources</Flex>
                <Flex align="center" gap={3}><CheckCircle2 size={18} color="var(--chakra-colors-blue-500)"/> Take practice & assigned tests</Flex>
              </Stack>
              <Button asChild mt="auto" size="lg" variant="surface" colorPalette="blue">
                <Link to="/auth/signup?role=student">Join as Student</Link>
              </Button>
            </Flex>

            {/* Guru Side */}
            <Flex 
              direction="column" 
              bg="white" 
              _dark={{ bg: "gray.800" }}
              p={10} 
              borderRadius="2xl" 
              shadow="lg"
              borderTopWidth="6px"
              borderColor="green.500"
            >
              <Badge colorPalette="green" w="fit-content" mb={4}>For Gurus & Institutes</Badge>
              <Heading size="2xl" mb={4}>Manage & Assess</Heading>
              <Stack gap={3} mb={8} color="fg.muted">
                <Flex align="center" gap={3}><CheckCircle2 size={18} color="var(--chakra-colors-green-500)"/> Create batches & enroll students</Flex>
                <Flex align="center" gap={3}><CheckCircle2 size={18} color="var(--chakra-colors-green-500)"/> Define tests & assign to batches</Flex>
                <Flex align="center" gap={3}><CheckCircle2 size={18} color="var(--chakra-colors-green-500)"/> View comprehensive batch statistics</Flex>
              </Stack>
              <Button asChild mt="auto" size="lg" variant="surface" colorPalette="green">
                <Link to="/auth/signup?role=guru">Join as Guru</Link>
              </Button>
            </Flex>
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  );
};

// --- Call To Action ---
const CTASection = () => {
  return (
    <Container maxW="container.lg" py={24} px={8}>
      <Box 
        bgGradient="to-r" gradientFrom="blue.600" gradientTo="purple.600"
        borderRadius="3xl"
        px={{ base: 6, md: 16 }}
        py={{ base: 10, md: 16 }}
        textAlign="center"
        color="white"
        shadow="2xl"
      >
        <Stack gap={6} align="center">
          <Heading size="3xl" fontWeight="bold">Ready to transform your education?</Heading>
          <Text fontSize="xl" opacity="0.9" maxW="2xl">
            Join the students and teachers simplifying education with Quiz Pariksha today. 
            Download the app or sign up on the web.
          </Text>
          <Stack direction={{ base: "column", sm: "row" }} gap={4} pt={4}>
             <Button asChild size="xl" bg="white" px={8} color="blue.600" _hover={{ bg: "gray.100" }}>
                <Link to="/download">Download App</Link>
             </Button>
             <Button asChild size="xl" variant="outline" px={8} color="white" borderColor="white" _hover={{ bg: "whiteAlpha.200" }}>
                <Link to="/auth/signup?role=student">Sign Up Now</Link>
             </Button>
          </Stack>
        </Stack>
      </Box>
    </Container>
  );
};

// --- Main Page Component ---
export function Landing() {
  return (
    <Flex justify="center" align="center" w="full" minH={'100vh'} bg="bg.muted" py={16}>
      <Box>
        <HeroSection />
        {/* Replaced quantitative stats with qualitative highlights */}
        <HighlightsSection />
        <FeaturesSection />
        <EcosystemSection />
        <CTASection />
        
        {/* Simple Footer Placeholder */}
        <Box borderTopWidth="1px" borderColor="border.subtle" py={8} textAlign="center">
          <Text color="fg.muted" fontSize="sm">
            © 2025 Quiz Pariksha. All rights reserved.
          </Text>
        </Box>
      </Box>
    </Flex>
  );
}