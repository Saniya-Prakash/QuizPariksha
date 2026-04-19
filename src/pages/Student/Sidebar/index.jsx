import { Box, VStack, Text, HStack, Separator, Menu, Button, Avatar, Tooltip } from "@chakra-ui/react"
import { Settings, LayoutDashboard, LogOut, MoreVertical } from "lucide-react"
import { NavLink, useNavigate } from "react-router"
import { useStudent } from "../../../contexts/StudentContext" // Assuming you have this

const NAV_ITEMS = [
  { name: "My Batches", path: "/student", icon: LayoutDashboard },
]

export function Sidebar() {
  const { user, api } = useStudent()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      localStorage.removeItem('token')
      await api.logout()
      navigate("/")
    } catch (error) {
      console.error("Logout failed", error)
    }
  }

  return (
    <Box h="100vh" bg="bg.panel" borderRightWidth="1px" borderColor="border.muted" w="14rem" display="flex" flexDirection="column">
      <VStack flex="1" justify="space-between" py={4} gap={0} align="start" w="full">
        
        {/* Navigation */}
        <VStack gap={1} w="full" align="start" px={4} mt={4}>
          {NAV_ITEMS.map((item) => (
            <NavLink to={item.path} end={item.path === "/student"} style={{ width: '100%', textDecoration: 'none' }} key={item.path}>
              {({ isActive }) => (
                <HStack py={2.5} px={3} borderRadius="md" bg={isActive ? "colorPalette.subtle" : "transparent"} color={isActive ? "colorPalette.fg" : "fg.muted"} _hover={{ bg: "bg.subtle" }} cursor="pointer">
                  <Box as={item.icon} size={20} />
                  <Text fontSize="sm" fontWeight="medium">{item.name}</Text>
                </HStack>
              )}
            </NavLink>
          ))}
        </VStack>

        {/* Profile */}
        <Box px={2} mb={2} w="full">
          <Separator mb={3} borderColor="border.muted" />
          <Menu.Root positioning={{ placement: "right" }}>
            <Menu.Trigger asChild>
              <Button variant="ghost" w="full" h="auto" py={2} px={0} fontWeight="normal" _hover={{ bg: "bg.subtle" }}>
                <HStack w="full" px={2} gap={3}>
                  <Avatar.Root size="sm"><Avatar.Image src={user?.profile_picture_url} /><Avatar.Fallback name={user?.name} /></Avatar.Root>
                  <VStack align="start" gap={0} flex="1" overflow="hidden">
                    <Text fontSize="sm" fontWeight="semibold" truncate>{user?.name || "Student"}</Text>
                  </VStack>
                  <MoreVertical size={16} />
                </HStack>
              </Button>
            </Menu.Trigger>
            <Menu.Content minW="12rem">
              <Menu.Item value="/settings" onClick={() => navigate('/student/settings')}>
                <Settings size={16} />
                <Text ml={2}>Settings</Text>
              </Menu.Item>
              <Menu.Item value="logout" color="fg.error" onClick={handleLogout}>
                <LogOut size={16} /><Text ml={2}>Log out</Text>
              </Menu.Item>
            </Menu.Content>
          </Menu.Root>
        </Box>

      </VStack>
    </Box>
  )
}