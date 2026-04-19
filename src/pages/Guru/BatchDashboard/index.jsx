import { useEffect, useState, useMemo } from "react"
import {
    Box, Flex, Heading, Button, Dialog, Input, VStack, HStack, Text, Table, IconButton,
    Textarea, Card, Badge, Separator, Grid, createListCollection, Spinner
} from "@chakra-ui/react"
import { Field } from "../../../components/ui/field"
import {
    SelectRoot,
    SelectTrigger,
    SelectValueText,
    SelectContent,
    SelectItem,
    SelectControl
} from "../../../components/ui/select"
import { InputGroup } from "../../../components/ui/input-group"
import { useNavigate, useParams } from "react-router"
import {
    Users, Trash2, X, Megaphone, Send, Ban,
    BookOpen, ClipboardCheck, PlayCircle, GraduationCap, Settings2, Hash, Mail
} from "lucide-react"
import { supabase } from "../../../lib/supabase"
import { useGuru } from "../../../contexts/GuruContext"
import { Toaster, toaster } from "../../../components/ui/toaster"
import { Branding } from "../../../components/ui/branding" // IMPORTED BRANDING

export function BatchDashboard({ batchName: initialBatchName }) {
    const { batchid } = useParams()
    const { user } = useGuru()
    const navigate = useNavigate()

    // --- Select Collection ---
    const categories = useMemo(() => createListCollection({
        items: [
            { label: "General", value: "general" },
            { label: "Urgent", value: "urgent" },
            { label: "Event", value: "event" },
            { label: "Reminder", value: "reminder" },
        ],
    }), [])

    // --- Data State ---
    const [loading, setLoading] = useState(false)
    const [isStudentsLoading, setIsStudentsLoading] = useState(false)
    const [isTeachersLoading, setIsTeachersLoading] = useState(false)

    const [myRole, setMyRole] = useState(null)
    const [announcements, setAnnouncements] = useState([])
    const [students, setStudents] = useState([])
    const [teachers, setTeachers] = useState([])
    const [currentBatch, setCurrentBatch] = useState({ name: initialBatchName, description: "", code: "" })

    // --- Form States ---
    const [newAnn, setNewAnn] = useState({ title: "", message: "", category: ["general"] })
    const [updateData, setUpdateData] = useState({ name: "", description: "" })
    const [teacherEmail, setTeacherEmail] = useState("")
    const [deleteConfirmation, setDeleteConfirmation] = useState("")

    // --- UI/Modal States ---
    const [isListModalOpen, setIsListModalOpen] = useState(false)
    const [isStudentListModalOpen, setIsStudentListModalOpen] = useState(false)
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false) // Combined Settings Modal
    const [isAddTeacherModalOpen, setIsAddTeacherModalOpen] = useState(false)
    const [isDeleteBatchModalOpen, setIsDeleteBatchModalOpen] = useState(false)
    const [isRemoveTeacherOpen, setIsRemoveTeacherOpen] = useState(false)
    const [isStudentConfirmOpen, setIsStudentConfirmOpen] = useState(false)

    const [teacherToRemove, setTeacherToRemove] = useState(null)
    const [studentToManage, setStudentToManage] = useState(null)
    const [manageAction, setManageAction] = useState("")

    const getTimeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        let interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " mins ago";
        return "Just now";
    }

    // --- API Fetching Methods ---

    const fetchDashboardData = async () => {
        setLoading(true)
        try {
            const { data: bData } = await supabase
                .from('batch').select('batch_name, description, batch_code').eq('batch_id', batchid).single()
            if (bData) {
                setCurrentBatch({
                    name: bData.batch_name,
                    description: bData.description,
                    code: bData.batch_code
                })
                setUpdateData({ name: bData.batch_name, description: bData.description || "" })
            }

            const { data: annData } = await supabase
                .from('announcement').select('*, User(name)').eq('batch_id', batchid).order('posted_at', { ascending: false })
            if (annData) setAnnouncements(annData)
        } catch (error) { console.error(error) } finally { setLoading(false) }
    }

    const fetchStudentsData = async () => {
        setIsStudentsLoading(true)
        try {
            const { data: stuData } = await supabase
                .from('batchstudent').select('*, User(name, email)').eq('batch_id', batchid).eq('status', 'approved')
            if (stuData) setStudents(stuData)
        } catch (error) { console.error(error) } finally { setIsStudentsLoading(false) }
    }

    const fetchTeachersData = async () => {
        setIsTeachersLoading(true)
        try {
            const { data: teacherData, error } = await supabase
                .from('batchteacher')
                .select(`role, teacher_id, User ( name, email )`)
                .eq('batch_id', batchid)

            if (teacherData) {
                setTeachers(teacherData)
                const me = teacherData.find(t => t.teacher_id === user.user_id)
                if (me) setMyRole(me.role)
            }
        } catch (error) { console.error(error) } finally { setIsTeachersLoading(false) }
    }

    useEffect(() => { if (batchid && user) fetchDashboardData() }, [batchid, user])

    // --- Handlers ---
    const handlePostAnnouncement = async () => {
        if (!newAnn.title.trim() || !newAnn.message.trim()) return
        setLoading(true)
        const { error } = await supabase.from('announcement').insert({
            batch_id: batchid,
            posted_by: user.user_id,
            title: newAnn.title,
            message: newAnn.message,
            category: newAnn.category[0]
        })
        if (!error) {
            toaster.create({ title: "Announcement posted", type: "success" })
            setNewAnn({ title: "", message: "", category: ["general"] })
            fetchDashboardData()
        }
        setLoading(false)
    }

    const handleUpdateBatch = async () => {
        if (!updateData.name.trim()) return
        setLoading(true)
        const { error } = await supabase
            .from('batch')
            .update({ batch_name: updateData.name, description: updateData.description })
            .eq('batch_id', batchid)

        if (!error) {
            toaster.create({ title: "Batch updated", type: "success" })
            setCurrentBatch(prev => ({ ...prev, name: updateData.name, description: updateData.description }))
            setIsSettingsModalOpen(false)
        } else {
            toaster.create({ title: "Failed to update", type: "error" })
        }
        setLoading(false)
    }

    const handleStudentAction = async () => {
        const isBan = manageAction === "ban"
        const { error } = await supabase.from('batchstudent').update({
            status: isBan ? 'removed' : 'left',
            is_blocked: isBan,
            removed_by_teacher: true
        }).match({ batch_id: batchid, student_id: studentToManage.student_id })

        if (!error) {
            toaster.create({ title: `Student ${isBan ? 'Banned' : 'Removed'}`, type: "success" })
            setIsStudentConfirmOpen(false)
            fetchStudentsData() 
        }
    }

    const handleAddTeacher = async () => {
        setLoading(true)
        const { data: targetUser, error: userError } = await supabase
            .from('User').select('user_id, role').eq('email', teacherEmail).single()

        if (userError || !targetUser || targetUser.role !== 'Teacher') {
            toaster.create({ title: "Valid Teacher not found", type: "error" })
            setLoading(false); return
        }

        const { error: insError } = await supabase
            .from('batchteacher').insert({ batch_id: batchid, teacher_id: targetUser.user_id, role: 2 })

        if (insError) toaster.create({ title: "Error or User already added", type: "error" })
        else {
            toaster.create({ title: "Teacher added", type: "success" })
            setTeacherEmail("")
            setIsAddTeacherModalOpen(false)
            fetchTeachersData() 
        }
        setLoading(false)
    }

    const confirmRemoveTeacher = async () => {
        const { error } = await supabase.from('batchteacher').delete()
            .match({ batch_id: batchid, teacher_id: teacherToRemove.teacher_id })

        if (!error) {
            toaster.create({ title: "Teacher removed", type: "success" })
            setIsRemoveTeacherOpen(false)
            fetchTeachersData() 
        }
    }

    const handleDeleteBatch = async () => {
        if (deleteConfirmation !== 'DELETE') return
        const { error } = await supabase.from('batch').delete().eq('batch_id', batchid)
        if (!error) {
            navigate('/guru')
            toaster.create({ title: "Batch deleted", type: "success" })
        }
    }

    const handleCopyCode = async () => {
        if (!currentBatch.code) return
        try {
            await navigator.clipboard.writeText(currentBatch.code)
            toaster.create({ title: "Batch code copied to clipboard!", type: "success" })
        } catch (err) {
            toaster.create({ title: "Failed to copy code", type: "error" })
        }
    }

    return (
        <Box w="full" p={{ base: 4, md: 8 }}>
            <Toaster />
            
            {/* ADDED BRANDING HERE */}
            <Branding />

            {/* Header: Displays Batch Name and Code */}
            <Flex justify="space-between" align="center" bg="bg.panel" p={6} borderRadius="lg" border="1px solid" borderColor="border.muted" mb={8}>
                <VStack align="start" gap={1}>
                    <Heading size="xl" fontWeight="bold">{currentBatch.name || "Batch Dashboard"}</Heading>
                    <Text color="fg.muted" fontSize="sm">{currentBatch.description || "Welcome back, Guru."}</Text>
                </VStack>
                <HStack gap={4}>
                    <Badge 
                        size="lg" 
                        variant="subtle" 
                        colorPalette="blue" 
                        px={4} 
                        py={2} 
                        borderRadius="md" 
                        display="flex" 
                        alignItems="center" 
                        gap={2}
                        cursor="pointer"
                        title="Click to copy batch code"
                        onClick={handleCopyCode}
                        _hover={{ bg: "blue.200" }}
                        transition="background-color 0.2s"
                    >
                        <Hash size={16} />
                        <Text fontWeight="bold" fontSize="md" letterSpacing="widest">
                            {currentBatch.code || "----"}
                        </Text>
                    </Badge>
                    <Button variant="outline" onClick={() => setIsSettingsModalOpen(true)}>
                        <Settings2 size={16}/> Settings
                    </Button>
                </HStack>
            </Flex>

            <Grid templateColumns={{ base: "1fr", lg: "3fr 1.2fr" }} gap={8}>
                {/* LEFT: Feed Section */}
                <VStack gap={8} align="stretch">
                    <Box bg="bg.panel" p={6} borderRadius="lg" border="1px solid" borderColor="border.muted">
                        <Heading size="md" mb={6} display="flex" alignItems="center" gap={2}>
                            <Megaphone size={20} /> Create Announcement
                        </Heading>
                        <VStack gap={4}>
                            <HStack w="full" gap={4} align="flex-start">
                                <Input
                                    placeholder="Announcement Title" flex={2} size="md" fontWeight="bold" variant="outline"
                                    value={newAnn.title} onChange={(e) => setNewAnn({ ...newAnn, title: e.target.value })}
                                />
                                <SelectRoot collection={categories} value={newAnn.category} onValueChange={(e) => setNewAnn({ ...newAnn, category: e.value })} flex={1} size="md">
                                    <SelectControl>
                                        <SelectTrigger><SelectValueText placeholder="Category" /></SelectTrigger>
                                    </SelectControl>
                                    <SelectContent>
                                        {categories.items.map((cat) => (
                                            <SelectItem item={cat} key={cat.value}>{cat.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </SelectRoot>
                            </HStack>
                            <Textarea
                                placeholder="Details..." value={newAnn.message} variant="outline"
                                onChange={(e) => setNewAnn({ ...newAnn, message: e.target.value })} rows={3}
                            />
                            <Button alignSelf="end" colorPalette="blue" px={10} onClick={handlePostAnnouncement} loading={loading}>
                                <Send size={16} /> Post
                            </Button>
                        </VStack>
                    </Box>

                    <VStack align="stretch" gap={6}>
                        {announcements.map((ann) => (
                            <Box key={ann.announcement_id} bg="bg.panel" borderRadius="lg" border="1px solid" borderColor="border.muted" p={6} position="relative">
                                <Badge position="absolute" top={6} right={6} size="md" px={3} py={1} borderRadius="full" colorPalette={ann.category === 'urgent' ? 'red' : 'gray'} variant="subtle">
                                    {ann.category.toUpperCase()}
                                </Badge>
                                <Heading size="xl" mb={4} pr="100px" fontWeight="black">{ann.title}</Heading>
                                <Text fontSize="lg" color="fg.muted" mb={6}>{ann.message}</Text>
                                <Separator mb={4} />
                                <Flex justify="space-between" align="center">
                                    <Text fontSize="sm" fontWeight="bold" color="blue.600">{ann.User?.name}</Text>
                                    <Text fontSize="xs" color="fg.subtle">{getTimeAgo(ann.posted_at)}</Text>
                                </Flex>
                            </Box>
                        ))}
                    </VStack>
                </VStack>

                {/* RIGHT: Sidebar Section */}
                <VStack gap={6} align="stretch">
                    <Box bg="bg.panel" p={6} borderRadius="lg" border="1px solid" borderColor="border.muted">
                        <Heading mb={4}>Learning Tools</Heading>
                        <VStack align="stretch" gap={3}>
                            <Button
                                variant="outline"
                                justifyContent="start"
                                gap={3}
                                onClick={() => navigate(`/guru/batch/${batchid}/assignments`)}
                            >
                                <ClipboardCheck size={18} /> Assignments
                            </Button>

                            <Button
                                variant="outline"
                                justifyContent="start"
                                gap={3}
                                onClick={() => navigate(`/guru/batch/${batchid}/practice`)}
                            >
                                <BookOpen size={18} /> Practice Quizzes
                            </Button>

                            <Button
                                variant="outline"
                                justifyContent="start"
                                gap={3}
                                onClick={() => navigate(`/guru/batch/${batchid}/live`)}
                            >
                                <PlayCircle size={18} /> Live Tests
                            </Button>
                        </VStack>
                    </Box>

                    <Box bg="bg.panel" p={6} borderRadius="lg" border="1px solid" borderColor="border.muted">
                        <Heading mb={4}>Management</Heading>
                        <VStack align="stretch" gap={3}>
                            <Button
                                variant="outline"
                                justifyContent="start"
                                gap={3}
                                onClick={() => {
                                    setIsStudentListModalOpen(true)
                                    fetchStudentsData()
                                }}
                            >
                                <GraduationCap size={18} /> Students
                            </Button>
                            <Button
                                variant="outline"
                                justifyContent="start"
                                gap={3}
                                onClick={() => {
                                    setIsListModalOpen(true)
                                    fetchTeachersData()
                                }}
                            >
                                <Users size={18} /> Teachers
                            </Button>
                        </VStack>
                    </Box>
                </VStack>
            </Grid>

            {/* --- MODALS Section --- */}

            {/* Combined Settings & Update Batch Modal */}
            <Dialog.Root open={isSettingsModalOpen} onOpenChange={(e) => setIsSettingsModalOpen(e.open)}>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Header><Dialog.Title>Batch Settings</Dialog.Title></Dialog.Header>
                        <Dialog.Body>
                            <VStack gap={4} align="stretch">
                                <Field label="Batch Name">
                                    <Input value={updateData.name} onChange={(e) => setUpdateData({ ...updateData, name: e.target.value })} />
                                </Field>
                                <Field label="Description">
                                    <Textarea value={updateData.description} onChange={(e) => setUpdateData({ ...updateData, description: e.target.value })} rows={3} />
                                </Field>
                                
                                <Separator my={2} />
                                
                                <Box>
                                    <Text fontWeight="bold" color="red.500" mb={2}>Danger Zone</Text>
                                    <Button 
                                        variant="outline" 
                                        colorPalette="red" 
                                        w="full"
                                        justifyContent="center"
                                        onClick={() => {
                                            setIsSettingsModalOpen(false);
                                            setIsDeleteBatchModalOpen(true);
                                        }}
                                    >
                                        <Trash2 size={16} style={{marginRight: '8px'}} /> Delete Batch
                                    </Button>
                                </Box>
                            </VStack>
                        </Dialog.Body>
                        <Dialog.Footer>
                            <Button variant="outline" onClick={() => setIsSettingsModalOpen(false)}>Cancel</Button>
                            <Button colorPalette="blue" onClick={handleUpdateBatch} loading={loading}>Save Changes</Button>
                        </Dialog.Footer>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Dialog.Root>

            {/* Student List Modal */}
            <Dialog.Root open={isStudentListModalOpen} onOpenChange={(e) => setIsStudentListModalOpen(e.open)} size="lg">
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Header><Dialog.Title>Batch Students</Dialog.Title></Dialog.Header>
                        <Dialog.Body>
                            {isStudentsLoading ? (
                                <Flex w="full" justify="center" align="center" py={10}>
                                    <Spinner size="xl" borderWidth="3px" color="blue.500" />
                                </Flex>
                            ) : students.length === 0 ? (
                                <Text color="fg.muted" textAlign="center" py={4}>No students found.</Text>
                            ) : (
                                <Table.Root variant="outline">
                                    <Table.Header>
                                        <Table.Row>
                                            <Table.ColumnHeader>Name</Table.ColumnHeader>
                                            <Table.ColumnHeader>Actions</Table.ColumnHeader>
                                        </Table.Row>
                                    </Table.Header>
                                    <Table.Body>
                                        {students.map((stu) => (
                                            <Table.Row key={stu.student_id}>
                                                <Table.Cell>
                                                    <Text fontWeight="bold">{stu.User?.name}</Text>
                                                    <Text fontSize="xs" color="fg.muted">{stu.User?.email}</Text>
                                                </Table.Cell>
                                                <Table.Cell>
                                                    <IconButton size="xs" variant="ghost" colorPalette="red" onClick={() => { setStudentToManage(stu); setManageAction("remove"); setIsStudentConfirmOpen(true); }}>
                                                        <X size={14} />
                                                    </IconButton>
                                                    <IconButton size="xs" variant="ghost" colorPalette="gray" onClick={() => { setStudentToManage(stu); setManageAction("ban"); setIsStudentConfirmOpen(true); }}>
                                                        <Ban size={14} />
                                                    </IconButton>
                                                </Table.Cell>
                                            </Table.Row>
                                        ))}
                                    </Table.Body>
                                </Table.Root>
                            )}
                        </Dialog.Body>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Dialog.Root>

            {/* Teacher List Modal */}
            <Dialog.Root open={isListModalOpen} onOpenChange={(e) => setIsListModalOpen(e.open)} size="lg">
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Header><Dialog.Title>Batch Teachers</Dialog.Title></Dialog.Header>
                        <Dialog.Body>
                            {isTeachersLoading ? (
                                <Flex w="full" justify="center" align="center" py={10}>
                                    <Spinner size="xl" borderWidth="3px" color="blue.500" />
                                </Flex>
                            ) : teachers.length === 0 ? (
                                <Text color="fg.muted" textAlign="center" py={4}>No teachers found.</Text>
                            ) : (
                                <Table.Root variant="outline">
                                    <Table.Header>
                                        <Table.Row>
                                            <Table.ColumnHeader>Name</Table.ColumnHeader>
                                            <Table.ColumnHeader>Action</Table.ColumnHeader>
                                        </Table.Row>
                                    </Table.Header>
                                    <Table.Body>
                                        {teachers.map((t) => (
                                            <Table.Row key={t.teacher_id}>
                                                <Table.Cell>
                                                    <Text fontWeight="bold">{t.User?.name}</Text>
                                                    <Text fontSize="xs" color="fg.muted">{t.User?.email}</Text>
                                                </Table.Cell>
                                                <Table.Cell>
                                                    {myRole === 1 && t.role === 2 && (
                                                        <IconButton size="xs" variant="ghost" colorPalette="red" onClick={() => { setTeacherToRemove(t); setIsRemoveTeacherOpen(true); }}>
                                                            <Trash2 size={14} />
                                                        </IconButton>
                                                    )}
                                                </Table.Cell>
                                            </Table.Row>
                                        ))}
                                    </Table.Body>
                                </Table.Root>
                            )}
                        </Dialog.Body>
                        <Dialog.Footer>
                            <Button variant="outline" onClick={() => setIsListModalOpen(false)}>Close</Button>
                            <Button colorPalette="blue" onClick={() => setIsAddTeacherModalOpen(true)}>Add Teacher</Button>
                        </Dialog.Footer>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Dialog.Root>

            {/* Confirm Student Action Modal */}
            <Dialog.Root open={isStudentConfirmOpen} onOpenChange={(e) => setIsStudentConfirmOpen(e.open)}>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Header><Dialog.Title>Confirm {manageAction}</Dialog.Title></Dialog.Header>
                        <Dialog.Body>Are you sure you want to {manageAction} <strong>{studentToManage?.User?.name}</strong>?</Dialog.Body>
                        <Dialog.Footer>
                            <Button variant="outline" onClick={() => setIsStudentConfirmOpen(false)}>Cancel</Button>
                            <Button colorPalette="red" onClick={handleStudentAction}>Confirm</Button>
                        </Dialog.Footer>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Dialog.Root>

            {/* Remove Teacher Modal */}
            <Dialog.Root open={isRemoveTeacherOpen} onOpenChange={(e) => setIsRemoveTeacherOpen(e.open)}>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Header><Dialog.Title>Remove Teacher</Dialog.Title></Dialog.Header>
                        <Dialog.Body>Remove <strong>{teacherToRemove?.User?.name}</strong> from the batch?</Dialog.Body>
                        <Dialog.Footer>
                            <Button variant="outline" onClick={() => setIsRemoveTeacherOpen(false)}>Cancel</Button>
                            <Button colorPalette="red" onClick={confirmRemoveTeacher}>Confirm</Button>
                        </Dialog.Footer>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Dialog.Root>

            {/* Add Teacher Input Modal */}
            <Dialog.Root open={isAddTeacherModalOpen} onOpenChange={(e) => setIsAddTeacherModalOpen(e.open)}>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Header><Dialog.Title>Add Teacher</Dialog.Title></Dialog.Header>
                        <Dialog.Body>
                            <Field label="Teacher Email">
                                <InputGroup startElement={<Mail size={16} color="gray" />} w="full">
                                    <Input
                                        name="email"
                                        type="email"
                                        placeholder="teacher@email.com"
                                        value={teacherEmail}
                                        onChange={(e) => setTeacherEmail(e.target.value)}
                                        ps={10}
                                    />
                                </InputGroup>
                            </Field>
                        </Dialog.Body>
                        <Dialog.Footer>
                            <Button variant="outline" onClick={() => setIsAddTeacherModalOpen(false)}>Cancel</Button>
                            <Button colorPalette="blue" onClick={handleAddTeacher}>Add</Button>
                        </Dialog.Footer>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Dialog.Root>

            {/* Delete Batch Confirmation */}
            <Dialog.Root open={isDeleteBatchModalOpen} onOpenChange={(e) => setIsDeleteBatchModalOpen(e.open)}>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Header><Dialog.Title>Delete Batch</Dialog.Title></Dialog.Header>
                        <Dialog.Body>
                            <Text mb={4}>Type <strong>DELETE</strong> to confirm.</Text>
                            <Input value={deleteConfirmation} onChange={(e) => setDeleteConfirmation(e.target.value)} placeholder="DELETE" />
                        </Dialog.Body>
                        <Dialog.Footer>
                            <Button variant="outline" onClick={() => setIsDeleteBatchModalOpen(false)}>Cancel</Button>
                            <Button colorPalette="red" disabled={deleteConfirmation !== 'DELETE'} onClick={handleDeleteBatch}>Delete</Button>
                        </Dialog.Footer>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Dialog.Root>
        </Box>
    )
}