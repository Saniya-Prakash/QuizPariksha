import { useEffect, useState } from "react"
import { Box, Flex, Heading, Button, Dialog, Input, VStack, HStack, Text, Badge, Separator, Grid } from "@chakra-ui/react"
import { useNavigate, useParams } from "react-router"
import { Megaphone, BookOpen, PlayCircle, Settings, LogOut, Hash, ClipboardCheck } from "lucide-react"
import { supabase } from "../../../lib/supabase"
import { useStudent } from "../../../contexts/StudentContext"
import { Toaster, toaster } from "../../../components/ui/toaster"

export function BatchDashboard() {
    const { batchid } = useParams()
    const { user } = useStudent()
    const navigate = useNavigate()

    const [batch, setBatch] = useState({})
    const [announcements, setAnnouncements] = useState([])
    
    // --- Modal States ---
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)
    const [confirmText, setConfirmText] = useState("")

    useEffect(() => {
        const fetchData = async () => {
            const { data: bData } = await supabase.from('batch').select('*').eq('batch_id', batchid).single()
            if (bData) setBatch(bData)

            const { data: annData } = await supabase.from('announcement').select('*, User(name)').eq('batch_id', batchid).order('posted_at', { ascending: false })
            if (annData) setAnnouncements(annData)
        }
        fetchData()
    }, [batchid])

    const initiateLeave = () => {
        setIsSettingsModalOpen(false)
        setConfirmText("")
        setIsLeaveModalOpen(true)
    }

    const handleLeaveBatch = async () => {
        if (confirmText !== 'CONFIRM') return
        const { error } = await supabase.from('batchstudent').update({ status: 'left', left_at: new Date().toISOString() }).match({ batch_id: batchid, student_id: user.user_id })
        
        if (!error) {
            toaster.create({ title: "Left batch successfully", type: "success" })
            navigate('/student')
        } else {
            toaster.create({ title: "Failed to leave batch", type: "error" })
        }
    }

    // --- Copy Code Logic ---
    const handleCopyCode = async () => {
        if (!batch.batch_code) return
        try {
            await navigator.clipboard.writeText(batch.batch_code)
            toaster.create({ title: "Batch code copied to clipboard!", type: "success" })
        } catch (err) {
            toaster.create({ title: "Failed to copy code", type: "error" })
        }
    }

    return (
        <Box w="full" p={{ base: 4, md: 8 }}>
            <Toaster />
            <Flex justify="space-between" align="center" bg="bg.panel" p={6} borderRadius="lg" border="1px solid" borderColor="border.muted" mb={8}>
                <VStack align="start" gap={1}>
                    <Heading size="xl" fontWeight="bold">{batch.batch_name}</Heading>
                    <Text color="fg.muted" fontSize="sm">{batch.description}</Text>
                </VStack>
                <HStack gap={4}>
                    <Badge 
                        size="lg" 
                        variant="subtle" 
                        colorPalette="blue" 
                        px={4} 
                        py={2} 
                        borderRadius="md"
                        cursor="pointer"
                        title="Click to copy"
                        onClick={handleCopyCode}
                        _hover={{ bg: "blue.200" }}
                        transition="background-color 0.2s"
                    >
                        <Hash size={16}/> {batch.batch_code}
                    </Badge>
                    <Button variant="outline" onClick={() => setIsSettingsModalOpen(true)}>
                        <Settings size={16}/> Settings
                    </Button>
                </HStack>
            </Flex>

            <Grid templateColumns={{ base: "1fr", lg: "3fr 1.2fr" }} gap={8}>
                {/* Announcements Feed */}
                <VStack gap={6} align="stretch">
                    <Heading size="md" display="flex" alignItems="center" gap={2}><Megaphone size={20} /> Announcements</Heading>
                    {announcements.length === 0 ? <Text color="fg.muted">No announcements from the Guru yet.</Text> : announcements.map((ann) => (
                        <Box key={ann.announcement_id} bg="bg.panel" borderRadius="lg" border="1px solid" borderColor="border.muted" p={6} position="relative">
                            <Badge position="absolute" top={6} right={6} colorPalette={ann.category === 'urgent' ? 'red' : 'gray'}>{ann.category.toUpperCase()}</Badge>
                            <Heading size="lg" mb={4} pr="80px">{ann.title}</Heading>
                            <Text color="fg.muted" mb={6}>{ann.message}</Text>
                            <Separator mb={4} />
                            <Flex justify="space-between"><Text fontSize="sm" fontWeight="bold" color="blue.600">{ann.User?.name}</Text><Text fontSize="xs" color="fg.subtle">{new Date(ann.posted_at).toLocaleString()}</Text></Flex>
                        </Box>
                    ))}
                </VStack>

                {/* Sidebar Tools */}
                <VStack gap={6} align="stretch">
                    <Box bg="bg.panel" p={6} borderRadius="lg" border="1px solid" borderColor="border.muted">
                        <Heading mb={4}>Learning Tools</Heading>
                        <VStack align="stretch" gap={3}>
                            <Button variant="outline" justifyContent="start" gap={3} onClick={() => navigate(`/student/batch/${batchid}/assignments`)}>
                                <ClipboardCheck size={18} /> Assignments
                            </Button>
                            <Button variant="outline" justifyContent="start" gap={3} onClick={() => navigate(`/student/batch/${batchid}/practice`)}>
                                <BookOpen size={18} /> Practice Quizzes
                            </Button>
                            <Button variant="outline" justifyContent="start" gap={3} onClick={() => navigate(`/student/batch/${batchid}/live`)}>
                                <PlayCircle size={18} /> Live Tests
                            </Button>
                        </VStack>
                    </Box>
                </VStack>
            </Grid>

            {/* --- Settings Modal --- */}
            <Dialog.Root open={isSettingsModalOpen} onOpenChange={(e) => setIsSettingsModalOpen(e.open)}>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Header>
                            <Dialog.Title>Batch Settings</Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body>
                            <VStack align="stretch" gap={3}>
                                <Text color="fg.muted" fontSize="sm" mb={2}>
                                    Settings for <strong>{batch?.batch_name}</strong>
                                </Text>
                                <Button 
                                    variant="outline" 
                                    colorPalette="red" 
                                    justifyContent="start" 
                                    gap={3} 
                                    onClick={initiateLeave}
                                >
                                    <LogOut size={16} /> Leave Batch
                                </Button>
                            </VStack>
                        </Dialog.Body>
                        <Dialog.Footer>
                            <Button variant="ghost" onClick={() => setIsSettingsModalOpen(false)}>Close</Button>
                        </Dialog.Footer>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Dialog.Root>

            {/* --- Leave Confirm Modal --- */}
            <Dialog.Root open={isLeaveModalOpen} onOpenChange={(e) => setIsLeaveModalOpen(e.open)}>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Header><Dialog.Title>Confirm Leave</Dialog.Title></Dialog.Header>
                        <Dialog.Body>
                            <Text mb={4} color="red.500">Warning: You will lose access to all resources. Type <strong>CONFIRM</strong> to leave.</Text>
                            <Input placeholder="CONFIRM" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
                        </Dialog.Body>
                        <Dialog.Footer>
                            <Button variant="outline" onClick={() => setIsLeaveModalOpen(false)}>Cancel</Button>
                            <Button colorPalette="red" disabled={confirmText !== 'CONFIRM'} onClick={handleLeaveBatch}><LogOut size={16}/> Leave</Button>
                        </Dialog.Footer>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Dialog.Root>
        </Box>
    )
}