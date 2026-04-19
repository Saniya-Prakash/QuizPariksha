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
  Separator,
  Circle
} from "@chakra-ui/react"
import { 
  Mail, 
  HelpCircle,
  Clock,
  ArrowRight
} from "lucide-react"

export function Contact() {
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
          <Badge size="lg" variant="surface" colorPalette="blue" borderRadius="full" px={4} mb={6}>
            Support
          </Badge>
          <Heading size={{ base: "4xl", md: "5xl" }} fontWeight="extrabold" mb={6} letterSpacing="tight">
            Get in <Text as="span" color="blue.600">Touch</Text>
          </Heading>
          <Text fontSize={{ base: "lg", md: "xl" }} color="fg.muted" maxW="2xl" mx="auto">
            Have questions about the app, features, or enterprise plans? We're here to help.
          </Text>
        </Container>
      </Flex>

      {/* --- Main Content --- */}
      <Container maxW="container.md" py={20} px={{ base: 6, md: 12 }}>
        <Stack gap={12} align="center">
          
          {/* Email Card (The Hero of this page) */}
          <Flex 
            direction="column"
            align="center"
            textAlign="center"
            bg="blue.50" 
            _dark={{ bg: "blue.900/20" }}
            p={{ base: 8, md: 12 }} 
            borderRadius="3xl" 
            borderWidth="2px" 
            borderColor="blue.100"
            gap={6}
            w="full"
            position="relative"
            overflow="hidden"
          >
            {/* Background Blob decoration */}
            <Box position="absolute" top="-50%" left="50%" w="300px" h="300px" bg="blue.200" filter="blur(80px)" opacity="0.4" borderRadius="full" transform="translateX(-50%)" />

            <Circle size="20" bg="blue.600" color="white" shadow="lg" zIndex={1}>
              <Mail size={32} />
            </Circle>

            <Stack gap={2} zIndex={1}>
              <Heading size="2xl" fontWeight="bold">Email Support</Heading>
              <Text color="fg.muted" fontSize="lg" maxW="md" mx="auto">
                For general inquiries, bugs, and feedback. We usually respond within 24 hours.
              </Text>
            </Stack>

            <Button 
              asChild 
              size="2xl" 
              colorPalette="blue" 
              variant="solid" 
              fontSize="xl"
              h="16"
              px={10}
              mt={2}
              shadow="md"
              zIndex={1}
            >
              <a href="mailto:support@quizpariksha.com">
                support@quizpariksha.com
              </a>
            </Button>
          </Flex>

          <Separator maxW="xs" />

          {/* Secondary Info Grid */}
          <SimpleGrid columns={{ base: 1, sm: 2 }} gap={10} w="full">
             <InfoCard 
                icon={HelpCircle}
                title="Help Center"
                desc="Check our FAQs for quick answers."
             />
             <InfoCard 
                icon={Clock}
                title="Response Time"
                desc="Mon-Fri, 9am to 6pm IST."
             />
          </SimpleGrid>

        </Stack>
      </Container>
    </Box>
  )
}

// --- Helper Component ---
function InfoCard({ icon: Icon, title, desc }) {
  return (
    <Flex 
      bg="bg.panel" 
      p={6} 
      borderRadius="xl" 
      borderWidth="1px" 
      borderColor="border.subtle"
      gap={4} 
      align="center"
      shadow="sm"
    >
      <Circle size="12" bg="bg.subtle" color="fg.muted">
        <Icon size={20} />
      </Circle>
      <Stack gap={0}>
        <Text fontWeight="bold" fontSize="lg">{title}</Text>
        <Text color="fg.muted" fontSize="sm">{desc}</Text>
      </Stack>
    </Flex>
  )
}