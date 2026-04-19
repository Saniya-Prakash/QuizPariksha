import React, { useState } from "react";
import {
  HStack,
  VStack,
  Link as ChakraLink,
  Flex,
  Box,
  Text,
  Image,
  Portal,
  Button,
  Drawer,
  CloseButton,
  Menu
} from "@chakra-ui/react";
import { MenuIcon } from "lucide-react";
import { Link } from "react-router";
import logo from "../../assets/android-chrome-192x192.png";

const NAV_LINKS = [
  { label: 'About us', href: '/about/' },
  { label: 'Features', href: '/features/' },
  { label: 'Contact us', href: '/contact/' },
];

const AUTH_OPTIONS = [
  { label: "Sign up as Student", href: "/auth/signup?role=student" },
  { label: "Sign up as Guru", href: "/auth/signup?role=guru" },
];

const Logo = () => (
  <ChakraLink asChild _hover={{ textDecoration: "none" }}>
    <Link to="/">
      <Flex align="center" gap={2}>
        <Image src={logo} h="8" w="8" alt="Logo" />
        <Text fontSize="lg" fontWeight="bold" color="blue.600">
          Quiz Pariksha
        </Text>
      </Flex>
    </Link>
  </ChakraLink>
);

const NavLinks = ({ isMobile }) => {
  const StackComponent = isMobile ? VStack : HStack;

  return (
    <StackComponent gap={isMobile ? 2 : 4} align={isMobile ? "stretch" : "center"}>
      {NAV_LINKS.map((link) => (
        <Button
          key={link.label}
          variant="ghost"
          fontSize="sm"
          asChild
        >
          <Link to={link.href}>{link.label}</Link>
        </Button>
      ))}
    </StackComponent>
  );
};

const AccountLinks = ({ isMobile, withAuth }) => {

  if (isMobile) {
    return (
      <VStack gap={4} width="full">
        {AUTH_OPTIONS.map((link) => (
          <Button
            key={link.label}
            asChild
            width='full'
            variant="outline"
            borderRadius="full"
          >
            <Link to={link.href}>{link.label}</Link>
          </Button>
        ))}
        <Button asChild w="full" bg="blue.600" color="white" borderRadius="full">
          <Link to="/download/">Download now</Link>
        </Button>
      </VStack>
    );
  }

  return (
    <HStack gap={4}>
      {withAuth && (
        <Menu.Root positioning={{ placement: 'bottom' }}>
          <Menu.Trigger asChild>
            <Button
              bg="green.700"
              borderRadius="full"
              color="white"
              px={8}
              _hover={{ transform: "translateY(-2px)", bg: "green.600" }}
              transition="all 0.2s"
            >
              Get started
            </Button>
          </Menu.Trigger>

          <Menu.Positioner>
            <Menu.Content>
              {AUTH_OPTIONS.map((item, index) => (
                <Menu.Item
                  key={item.label}
                  value={item.label}
                  asChild
                  cursor="pointer"
                  pl={6}
                  pr={3}
                  borderRadius="md"
                  transition="0.15s ease"
                >
                  <Link to={item.href}>
                    {item.label}
                  </Link>
                </Menu.Item>
              ))}
            </Menu.Content>
          </Menu.Positioner>
        </Menu.Root>
      )}

      <Button
        bg="blue.600"
        color="white"
        borderRadius="full"
        px={6}
        _hover={{ transform: "translateY(-2px)", bg: "blue.500", boxShadow: "md" }}
        transition="all 0.2s ease"
        asChild
      >
        <Link to="/auth/login/">Log in</Link>
      </Button>

      <Button
        bg="blue.600"
        color="white"
        borderRadius="full"
        px={6}
        _hover={{ transform: "translateY(-2px)", bg: "blue.500", boxShadow: "md" }}
        transition="all 0.2s ease"
        asChild
      >
        <Link to="/download/">Download now</Link>
      </Button>
    </HStack>
  );
};

const MobileDrawer = ({ withIcons }) => {
  const [open, setOpen] = useState(false);

  return (
    <Drawer.Root open={open} onOpenChange={(e) => setOpen(e.open)} placement="top">
      <Drawer.Trigger asChild>
        <Button variant="ghost">
          <MenuIcon size={24} />
        </Button>
      </Drawer.Trigger>
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content boxShadow="2xl">
            <Drawer.Header py={4}>
              <Flex justify="space-between" align="center">
                <Logo />
                <Drawer.CloseTrigger asChild>
                  <CloseButton size="md" />
                </Drawer.CloseTrigger>
              </Flex>
            </Drawer.Header>
            <Drawer.Body py={4}>
              <VStack gap={4} align="stretch">
                <Box onClick={() => setOpen(false)}>
                  <NavLinks isMobile />
                </Box>
                <Box h="1px" bg="gray.100" />
                <Box onClick={() => setOpen(false)}>
                  <AccountLinks isMobile withAuth={withIcons} />
                </Box>
              </VStack>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
};

export const Navbar = ({ withIcons }) => {
  return (
    <Box
      as="nav"
      position="absolute"
      width='100%'
      zIndex={10}
      borderBottomWidth="1px"
    >
      <Flex
        justify="space-between"
        py={3}
        px={{ base: 4, lg: 12 }}
        align="center"
      >
        <Logo />

        <HStack display={{ base: "none", md: "flex" }} gap={8}>
          {withIcons && <NavLinks />}
          <AccountLinks withAuth={withIcons} />
        </HStack>

        <Box display={{ base: "block", md: "none" }}>
          <MobileDrawer withIcons={withIcons} />
        </Box>
      </Flex>
    </Box>
  );
};