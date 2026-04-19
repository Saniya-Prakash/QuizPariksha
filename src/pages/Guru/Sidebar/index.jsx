import {
  Box,
  Flex,
  VStack,
  Text,
  IconButton,
  HStack,
  Separator,
  Menu,
  Button,
  Avatar, Tooltip
} from "@chakra-ui/react"
import {
  LayoutDashboard,
  Dumbbell,
  Radio,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Settings,
  LogOut,
  MoreVertical
} from "lucide-react"
import { useState } from "react"
import { NavLink, useNavigate } from "react-router"
import { useGuru } from "../../../contexts/GuruContext"

// --- Constants ---
const EXPANDED_W = "14rem"
const COLLAPSED_W = "4rem"

const NAV_ITEMS = [
  { name: "Dashboard", path: "/guru", icon: LayoutDashboard },
  // { name: "Practice", path: "/guru/practice", icon: Dumbbell },
  // { name: "Live Quiz", path: "/guru/livequiz", icon: Radio },
  // { name: "Results", path: "/guru/results", icon: Trophy },
]

// --- Sub-Component: Sidebar Item ---
const SidebarItem = ({ item, isCollapsed }) => {
  return (
    <Tooltip.Root
      showArrow
      content={item.name}
      positioning={{ placement: "right" }}
      disabled={!isCollapsed} // Only show tooltip when collapsed
    >
      <Tooltip.Trigger asChild>
        <NavLink
          to={item.path}
          end={item.path === "/guru"}
          style={{ width: '100%', textDecoration: 'none' }}
        >
          {({ isActive }) => (
            <HStack
              py={2.5}
              px={0}
              borderRadius="md"
              bg={isActive ? "colorPalette.subtle" : "transparent"}
              color={isActive ? "colorPalette.fg" : "fg.muted"}
              _hover={{
                bg: isActive ? "colorPalette.subtle" : "bg.subtle",
                color: isActive ? "colorPalette.fg" : "fg"
              }}
              cursor="pointer"
              transition="background 0.2s"
              w="full"
              overflow="hidden" // Ensure mask works
            >
              {/* Masking Container */}
              <HStack minW={EXPANDED_W} px={3} gap={3}>
                <Box as={item.icon} size={20} flexShrink={0} />

                <Text
                  fontSize="sm"
                  fontWeight="medium"
                  opacity={isCollapsed ? 0 : 1}
                  transition="opacity 0.2s"
                  transitionDelay={isCollapsed ? "0ms" : "100ms"}
                  whiteSpace="nowrap"
                >
                  {item.name}
                </Text>
              </HStack>
            </HStack>
          )}
        </NavLink>
      </Tooltip.Trigger>
    </Tooltip.Root>
  )
}

// --- Main Component ---
export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { user, api } = useGuru()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await api.logout()
      navigate("/")
    } catch (error) {
      console.error("Logout failed", error)
    }
  }

  return (
    <Box
      h="100vh"
      bg="bg.panel"
      borderRightWidth="1px"
      borderColor="border.muted"
      w={isCollapsed ? COLLAPSED_W : EXPANDED_W}
      transition="width 0.3s cubic-bezier(0.2, 0, 0, 1)"
      position="sticky"
      top="0"
      left="0"
      zIndex="sticky"
      display="flex"
      flexDirection="column"
      overflowX="hidden"
      whiteSpace="nowrap"
    >
      <VStack flex="1" justify="space-between" py={4} gap={0} align="start" w="full">

        {/* --- TOP SECTION --- */}
        <VStack gap={4} px={2} w="full" align="start">

          {/* Collapse Toggle */}
          <Flex w="full" justify={isCollapsed ? "center" : "flex-end"} px={1}>
            <IconButton
              aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              variant="ghost"
              size="sm"
              color="fg.muted"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </IconButton>
          </Flex>

          {/* Navigation Links */}
          <VStack gap={1} w="full" align="start">
            {NAV_ITEMS.map((item) => (
              <SidebarItem
                key={item.path}
                item={item}
                isCollapsed={isCollapsed}
              />
            ))}
          </VStack>
        </VStack>

        {/* --- BOTTOM SECTION: User Profile --- */}
        <Box px={2} mb={2} w="full">
          <Separator mb={3} borderColor="border.muted" />

          <Menu.Root positioning={{ placement: "right" }}>
            <Menu.Trigger asChild>
              <Button
                variant="ghost"
                w="full"
                h="auto"
                py={2}
                px={0}
                fontWeight="normal"
                color="fg"
                _hover={{ bg: "bg.subtle" }}
                overflow="hidden"
              >
                <HStack minW={EXPANDED_W} px={isCollapsed ? 1 : 2} gap={3}>
                  <Avatar.Root size="sm" variant="solid">
                    <Avatar.Image src={user?.profile_picture_url} />
                    <Avatar.Fallback name={user?.name || user?.email} />
                  </Avatar.Root>

                  <HStack
                    gap={3}
                    flex="1"
                    opacity={isCollapsed ? 0 : 1}
                    transition="opacity 0.2s"
                  >
                    <VStack align="start" gap={0} overflow="hidden" flex="1">
                      <Text fontSize="sm" fontWeight="semibold" truncate maxW="110px">
                        {user?.name || "Guru"}
                      </Text>
                      <Text fontSize="xs" color="fg.muted" truncate maxW="110px">
                        {user?.email}
                      </Text>
                    </VStack>

                    <Box pr={4}> {/* Padding right to account for mask edge */}
                      <MoreVertical size={16} />
                    </Box>
                  </HStack>
                </HStack>
              </Button>
            </Menu.Trigger>

            <Menu.Content minW="12rem">
              <Menu.Item value="settings" onClick={() => navigate('/guru/settings')}>
                <Settings size={16} />
                <Text ml={2}>Settings</Text>
              </Menu.Item>
              <Menu.Item value="logout" color="fg.error" onClick={handleLogout}>
                <LogOut size={16} />
                <Text ml={2}>Log out</Text>
              </Menu.Item>
            </Menu.Content>
          </Menu.Root>
        </Box>

      </VStack>
    </Box>
  )
}