import { useEffect, useState, useMemo, useRef } from "react"
import {
    Box, Flex, Heading, Button, Input, VStack, HStack, Text, Badge, Separator, Grid, createListCollection, Textarea
} from "@chakra-ui/react"
import {
    SelectRoot,
    SelectTrigger,
    SelectValueText,
    SelectContent,
    SelectItem,
    SelectControl
} from "../../../components/ui/select"
import { useParams, useNavigate } from "react-router"
import {
    FileText, Send, Clock, Download, UploadCloud, PlayCircle, CheckCircle2, CalendarClock, Users
} from "lucide-react"
import { supabase } from "../../../lib/supabase"
import { useGuru } from "../../../contexts/GuruContext"
import { Toaster, toaster } from "../../../components/ui/toaster"

export function BatchAssignments({ batchName: initialBatchName }) {
    const { batchid } = useParams()
    const navigate = useNavigate()
    const { user } = useGuru()
    const fileInputRef = useRef(null)

    // --- Select Collection ---
    const assignmentTypes = useMemo(() => createListCollection({
        items: [
            { label: "Homework", value: "homework" },
            { label: "Project", value: "project" },
            { label: "Lab", value: "lab" },
            { label: "Other", value: "other" },
        ],
    }), [])

    // --- Data State ---
    const [loading, setLoading] = useState(false)
    const [assignments, setAssignments] = useState([])
    const [currentBatch, setCurrentBatch] = useState({ name: initialBatchName, description: "", code: "" })

    // --- Filter State ---
    const [filter, setFilter] = useState('all') // 'all', 'active', 'upcoming', 'completed'

    // --- Form States ---
    const [newAssignment, setNewAssignment] = useState({
        title: "",
        instructions: "",
        type: ["homework"],
        startDate: "",
        dueDate: ""
    })
    const [selectedFile, setSelectedFile] = useState(null)

    // --- Helper Functions ---
    const getTimeAgo = (date) => {
        if (!date) return "Unknown"
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        let interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " mins ago";
        return "Just now";
    }

    // Determine the status of an assignment
    const getAssignmentStatus = (assn) => {
        const now = new Date()
        const start = assn.start_date ? new Date(assn.start_date) : new Date(assn.posted_at)
        const due = assn.due_date ? new Date(assn.due_date) : null

        if (start > now) return 'upcoming'
        if (due && due < now) return 'completed'
        return 'active'
    }

    // Filter assignments based on sidebar selection
    const filteredAssignments = useMemo(() => {
        if (filter === 'all') return assignments
        return assignments.filter(a => getAssignmentStatus(a) === filter)
    }, [assignments, filter])

    // --- API Logic ---
    const fetchDashboardData = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('batch')
                .select(`
                    batch_name, 
                    description, 
                    batch_code,
                    batchassignment (
                        assignment (
                            *,
                            User!posted_by(name)
                        )
                    )
                `)
                .eq('batch_id', batchid)
                .single()

            if (error) throw error

            if (data) {
                setCurrentBatch({
                    name: data.batch_name,
                    description: data.description,
                    code: data.batch_code
                })

                if (data.batchassignment) {
                    const formattedAssignments = data.batchassignment
                        .map(item => item.assignment)
                        .filter(Boolean)
                        .sort((a, b) => new Date(b.posted_at) - new Date(a.posted_at))

                    setAssignments(formattedAssignments)
                }
            }
        } catch (error) {
            console.error("Error fetching data:", error)
            toaster.create({ title: "Failed to load assignments", type: "error" })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (batchid && user) fetchDashboardData()
    }, [batchid, user])

    // --- Handlers ---
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0]
            if (file.type !== "application/pdf") {
                toaster.create({ title: "Please upload a valid PDF file", type: "error" })
                if (fileInputRef.current) fileInputRef.current.value = ""
                return
            }
            setSelectedFile(file)
        }
    }

    const handlePostAssignment = async () => {
        if (!newAssignment.title.trim() || !selectedFile) {
            toaster.create({ title: "Title and PDF are required", type: "error" })
            return
        }

        setLoading(true)

        try {
            // 1. Upload the PDF
            const fileExt = selectedFile.name.split('.').pop()
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
            const filePath = `batch_${batchid}/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('assignment')
                .upload(filePath, selectedFile)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('assignment')
                .getPublicUrl(filePath)

            // 2. Set default start date to NOW if not provided manually
            const finalStartDate = newAssignment.startDate
                ? new Date(newAssignment.startDate).toISOString()
                : new Date().toISOString()

            // 3. Insert Assignment
            const { data: newAssn, error: insertError } = await supabase
                .from('assignment')
                .insert({
                    posted_by: user.user_id,
                    title: newAssignment.title,
                    instructions: newAssignment.instructions,
                    pdf_url: publicUrl,
                    start_date: finalStartDate,
                    due_date: newAssignment.dueDate ? new Date(newAssignment.dueDate).toISOString() : null,
                    assignment_type: newAssignment.type[0]
                })
                .select()
                .single()

            if (insertError) throw insertError

            // 4. Link to Batch
            const { error: linkError } = await supabase
                .from('batchassignment')
                .insert({
                    batch_id: batchid,
                    assignment_id: newAssn.assignment_id
                })

            if (linkError) throw linkError

            toaster.create({ title: "Assignment posted successfully!", type: "success" })

            // Reset form
            setNewAssignment({ title: "", instructions: "", type: ["homework"], startDate: "", dueDate: "" })
            setSelectedFile(null)
            if (fileInputRef.current) fileInputRef.current.value = ""

            fetchDashboardData()

        } catch (error) {
            console.error("Error posting assignment:", error)
            const msg = error?.message || String(error)
            const isRls =
                /row-level security|RLS|violates policy/i.test(msg) ||
                (error?.name === "StorageApiError" && /policy/i.test(msg))
            toaster.create({
                title: "Failed to post assignment",
                description: isRls
                    ? "Storage is blocked by Supabase RLS. Run the SQL in supabase/migrations/20260419120000_storage_assignment_submissions.sql (Storage policies for the assignment bucket)."
                    : msg,
                type: "error",
            })
        } finally {
            setLoading(false)
        }
    }

    // Status styling helpers for the UI Badges
    const statusConfig = {
        upcoming: { color: "purple", icon: CalendarClock, label: "Upcoming" },
        active: { color: "green", icon: PlayCircle, label: "Active" },
        completed: { color: "gray", icon: CheckCircle2, label: "Completed" },
    }

    return (
        <Box w="full" p={{ base: 4, md: 8 }}>
            <Toaster />

            {/* Header */}
            <Flex justify="space-between" align="center" bg="bg.panel" p={6} borderRadius="lg" border="1px solid" borderColor="border.muted" mb={8}>
                <VStack align="start" gap={1}>
                    <Heading size="xl" fontWeight="bold">Assignments - {currentBatch.name || "Batch"}</Heading>
                    <Text color="fg.muted" fontSize="sm">Manage course materials and homework.</Text>
                </VStack>
            </Flex>

            <Grid templateColumns={{ base: "1fr", lg: "3fr 1.2fr" }} gap={8}>
                {/* LEFT: Feed Section */}
                <VStack gap={8} align="stretch">

                    {/* Create Assignment Box */}
                    <Box bg="bg.panel" p={6} borderRadius="lg" border="1px solid" borderColor="border.muted">
                        <Heading size="md" mb={6} display="flex" alignItems="center" gap={2}>
                            <FileText size={20} /> Create Assignment
                        </Heading>
                        <VStack gap={4} align="stretch">
                            <HStack w="full" gap={4} align="flex-start">
                                <Input
                                    placeholder="Assignment Title" flex={2} size="md" fontWeight="bold" variant="outline"
                                    value={newAssignment.title} onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                                />
                                <SelectRoot collection={assignmentTypes} value={newAssignment.type} onValueChange={(e) => setNewAssignment({ ...newAssignment, type: e.value })} flex={1} size="md">
                                    <SelectControl>
                                        <SelectTrigger><SelectValueText placeholder="Type" /></SelectTrigger>
                                    </SelectControl>
                                    <SelectContent>
                                        {assignmentTypes.items.map((cat) => (
                                            <SelectItem item={cat} key={cat.value}>{cat.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </SelectRoot>
                            </HStack>

                            <Textarea
                                placeholder="Instructions..." value={newAssignment.instructions} variant="outline"
                                onChange={(e) => setNewAssignment({ ...newAssignment, instructions: e.target.value })} rows={3}
                            />

                            <HStack w="full" gap={4} justify="space-between" wrap="wrap">
                                <HStack gap={4} wrap="wrap">
                                    {/* Start Date Picker */}
                                    <VStack align="start" gap={1}>
                                        <Text fontSize="xs" fontWeight="bold" color="fg.muted">Start Date (Optional)</Text>
                                        <Input
                                            type="datetime-local" size="sm" variant="outline"
                                            value={newAssignment.startDate}
                                            onChange={(e) => setNewAssignment({ ...newAssignment, startDate: e.target.value })}
                                        />
                                    </VStack>

                                    {/* Due Date Picker */}
                                    <VStack align="start" gap={1}>
                                        <Text fontSize="xs" fontWeight="bold" color="fg.muted">Due Date</Text>
                                        <Input
                                            type="datetime-local" size="sm" variant="outline"
                                            value={newAssignment.dueDate}
                                            onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                                        />
                                    </VStack>

                                    {/* PDF Upload Button */}
                                    <VStack align="start" gap={1}>
                                        <Text fontSize="xs" fontWeight="bold" color="transparent">.</Text> {/* Spacer */}
                                        <input
                                            type="file" accept="application/pdf" ref={fileInputRef} style={{ display: "none" }}
                                            onChange={handleFileChange}
                                        />
                                        <Button size="sm" variant="outline" colorPalette={selectedFile ? "green" : "gray"} onClick={() => fileInputRef.current?.click()}>
                                            <UploadCloud size={16} />
                                            {selectedFile ? selectedFile.name : "Upload PDF"}
                                        </Button>
                                    </VStack>
                                </HStack>

                                <Button alignSelf="end" colorPalette="blue" px={10} onClick={handlePostAssignment} loading={loading}>
                                    <Send size={16} /> Post
                                </Button>
                            </HStack>
                        </VStack>
                    </Box>

                    {/* Assignments Feed */}
                    <VStack align="stretch" gap={6}>
                        {filteredAssignments.map((assn) => {
                            const status = getAssignmentStatus(assn)
                            const StatusIcon = statusConfig[status].icon

                            return (
                                <Box key={assn.assignment_id} bg="bg.panel" borderRadius="lg" border="1px solid" borderColor="border.muted" p={6} position="relative">

                                    {/* Badges Container */}
                                    <HStack position="absolute" top={6} right={6} gap={2}>
                                        <Badge size="md" px={3} py={1} borderRadius="full" colorPalette="blue" variant="subtle">
                                            {assn.assignment_type.toUpperCase()}
                                        </Badge>
                                        <Badge size="md" px={3} py={1} borderRadius="full" colorPalette={statusConfig[status].color} variant="solid" display="flex" alignItems="center" gap={1}>
                                            <StatusIcon size={12} />
                                            {statusConfig[status].label}
                                        </Badge>
                                    </HStack>

                                    <Heading size="lg" mb={2} pr="180px" fontWeight="black">{assn.title}</Heading>

                                    <HStack gap={6} mb={4}>
                                        {assn.start_date && (
                                            <HStack color="fg.muted" fontSize="sm" fontWeight="medium">
                                                <CalendarClock size={16} />
                                                <Text>Starts: {new Date(assn.start_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</Text>
                                            </HStack>
                                        )}
                                        {assn.due_date && (
                                            <HStack color="red.500" fontSize="sm" fontWeight="bold">
                                                <Clock size={16} />
                                                <Text>Due: {new Date(assn.due_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</Text>
                                            </HStack>
                                        )}
                                    </HStack>

                                    <Text fontSize="md" color="fg.muted" mb={6} whiteSpace="pre-wrap">
                                        {assn.instructions}
                                    </Text>

                                    <HStack mb={4} gap={4}>
                                        <Button as="a" href={assn.pdf_url} target="_blank" rel="noopener noreferrer" size="sm" colorPalette="gray" variant="outline" gap={2}>
                                            <Download size={16} /> View/Download PDF
                                        </Button>
                                        <Button size="sm" colorPalette="blue" variant="solid" gap={2} onClick={() => navigate(`/guru/batch/${batchid}/assignments/${assn.assignment_id}`)}>
                                            <Users size={16} /> View Submissions
                                        </Button>
                                    </HStack>

                                    <Separator mb={4} />

                                    <Flex justify="space-between" align="center">
                                        <Text fontSize="sm" fontWeight="bold" color="blue.600">{assn.User?.name || 'Teacher'}</Text>
                                        <Text fontSize="xs" color="fg.subtle">Posted {getTimeAgo(assn.posted_at)}</Text>
                                    </Flex>
                                </Box>
                            )
                        })}
                        {filteredAssignments.length === 0 && !loading && (
                            <Text textAlign="center" color="fg.muted" py={10}>
                                {filter === 'all' ? "No assignments posted yet." : `No ${filter} assignments found.`}
                            </Text>
                        )}
                    </VStack>
                </VStack>

                {/* RIGHT: Sidebar Filters */}
                <VStack gap={6} align="stretch">
                    <Box bg="bg.panel" p={6} borderRadius="lg" border="1px solid" borderColor="border.muted">
                        <Heading mb={4} size="md">Filter Assignments</Heading>
                        <VStack align="stretch" gap={3}>
                            <Button
                                variant={filter === 'all' ? "solid" : "ghost"}
                                colorPalette={filter === 'all' ? "blue" : "gray"}
                                justifyContent="start"
                                onClick={() => setFilter('all')}
                            >
                                All Assignments
                            </Button>
                            <Button
                                variant={filter === 'active' ? "solid" : "ghost"}
                                colorPalette={filter === 'active' ? "green" : "gray"}
                                justifyContent="start"
                                onClick={() => setFilter('active')}
                            >
                                <PlayCircle size={16} style={{ marginRight: '8px' }} /> Active
                            </Button>
                            <Button
                                variant={filter === 'upcoming' ? "solid" : "ghost"}
                                colorPalette={filter === 'upcoming' ? "purple" : "gray"}
                                justifyContent="start"
                                onClick={() => setFilter('upcoming')}
                            >
                                <CalendarClock size={16} style={{ marginRight: '8px' }} /> Upcoming
                            </Button>
                            <Button
                                variant={filter === 'completed' ? "solid" : "ghost"}
                                colorPalette={filter === 'completed' ? "gray" : "gray"}
                                justifyContent="start"
                                onClick={() => setFilter('completed')}
                            >
                                <CheckCircle2 size={16} style={{ marginRight: '8px' }} /> Completed
                            </Button>
                        </VStack>
                    </Box>
                </VStack>
            </Grid>
        </Box>
    )
}