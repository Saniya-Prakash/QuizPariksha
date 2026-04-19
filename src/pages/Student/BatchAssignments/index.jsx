import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router"
import {
    Box, Flex, Heading, Button, VStack, HStack, Text, Badge, Grid, Card, Spinner, Center, Separator
} from "@chakra-ui/react"
import { FileText, Clock, CheckCircle2, AlertCircle, ArrowRight, Calendar, Info } from "lucide-react"
import { supabase } from "../../../lib/supabase"
import { useStudent } from "../../../contexts/StudentContext"

// --- Time Helpers ---
const getDueStatus = (dueDate) => {
    if (!dueDate) return { text: "No Due Date", color: "gray" }
    const now = new Date()
    const due = new Date(dueDate)
    const diffMins = Math.floor((due - now) / 60000)
    
    if (diffMins < 0) {
        const absMins = Math.abs(diffMins)
        if (absMins < 60) return { text: `Overdue by ${absMins} mins`, color: 'red' }
        const hours = Math.floor(absMins / 60)
        if (hours < 24) return { text: `Overdue by ${hours} hours`, color: 'red' }
        return { text: `Overdue by ${Math.floor(hours / 24)} days`, color: 'red' }
    } else {
        if (diffMins < 60) return { text: `Due in ${diffMins} mins`, color: 'orange' }
        const hours = Math.floor(diffMins / 60)
        if (hours < 24) return { text: `Due in ${hours} hours`, color: 'yellow' }
        return { text: `Due in ${Math.floor(hours / 24)} days`, color: 'blue' }
    }
}

export function BatchAssignments() {
    const { batchid } = useParams()
    const { user } = useStudent()
    const navigate = useNavigate()

    const [loading, setLoading] = useState(true)
    const [assignments, setAssignments] = useState([])
    const [batchName, setBatchName] = useState("")

    useEffect(() => {
        const fetchAssignments = async () => {
            if (!batchid || !user) return
            setLoading(true)

            try {
                const { data: bData } = await supabase.from('batch').select('batch_name').eq('batch_id', batchid).single()
                if (bData) setBatchName(bData.batch_name)

                const { data: assnData } = await supabase
                    .from('assignment')
                    .select('*, batchassignment!inner(batch_id), User!posted_by(name)')
                    .eq('batchassignment.batch_id', batchid)
                    .order('posted_at', { ascending: false })

                // Fetch Submissions ordered by newest first
                const { data: subData } = await supabase
                    .from('assignmentsubmission')
                    .select('*')
                    .eq('student_id', user.user_id)
                    .order('submitted_at', { ascending: false })

                if (assnData) {
                    const merged = assnData.map(assn => ({
                        ...assn,
                        // Because subData is ordered descending, .find() grabs the LATEST attempt
                        submission: subData?.find(s => s.assignment_id === assn.assignment_id) || null
                    }))
                    setAssignments(merged)
                }

            } catch (error) {
                console.error("Error fetching assignments:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchAssignments()
    }, [batchid, user])

    const getStatusInfo = (assn) => {
        if (assn.submission) {
            if (assn.submission.status === 'graded') return { label: "Graded", color: "green", icon: CheckCircle2 }
            return { label: "Submitted", color: "blue", icon: CheckCircle2 }
        }
        const now = new Date()
        const due = assn.due_date ? new Date(assn.due_date) : null
        if (due && now > due) return { label: "Missing", color: "red", icon: AlertCircle }
        return { label: "Pending", color: "yellow", icon: Clock }
    }

    return (
        <Box w="full" p={{ base: 4, md: 8 }}>
            <Flex justify="space-between" align="center" bg="bg.panel" p={6} borderRadius="lg" border="1px solid" borderColor="border.muted" mb={8}>
                <HStack gap={4}>
                    <Flex p={3} bg="blue.100" color="blue.600" borderRadius="md"><FileText size={24} /></Flex>
                    <VStack align="start" gap={1}>
                        <Heading size="xl" fontWeight="bold">Assignments</Heading>
                        <Text color="fg.muted" fontSize="sm">{batchName || "Batch"} • View and submit your homework.</Text>
                    </VStack>
                </HStack>
            </Flex>

            {loading ? <Center py={20}><Spinner size="xl" color="blue.500" /></Center> : assignments.length === 0 ? (
                <Center py={20}><Heading color="fg.muted" size="md">No assignments posted yet.</Heading></Center>
            ) : (
                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr", xl: "1fr 1fr 1fr" }} gap={6}>
                    {assignments.map((assn) => {
                        const status = getStatusInfo(assn)
                        const dueStatus = getDueStatus(assn.due_date)
                        const StatusIcon = status.icon

                        return (
                            <Card.Root key={assn.assignment_id} variant="outline" borderColor={assn.submission ? "blue.300" : "border.muted"}>
                                <Card.Body as={VStack} align="stretch" gap={4}>
                                    <Flex justify="space-between" align="start">
                                        <Badge colorPalette="gray" textTransform="uppercase">{assn.assignment_type}</Badge>
                                        <Badge colorPalette={status.color} display="flex" gap={1} alignItems="center">
                                            <StatusIcon size={12} /> {status.label}
                                        </Badge>
                                    </Flex>

                                    <Heading size="lg" fontWeight="black" lineClamp={2}>{assn.title}</Heading>

                                    <VStack align="start" gap={3} mt={2} w="full">
                                        <Text fontSize="sm" color="fg.muted" lineClamp={2} h="40px">{assn.instructions}</Text>
                                        
                                        {/* Dynamic Pills */}
                                        <HStack w="full" gap={2} flexWrap="wrap">
                                            <Badge variant="subtle" colorPalette="gray" size="sm">
                                                <Info size={10} style={{marginRight:'4px'}}/> Posted on {new Date(assn.posted_at).toLocaleDateString()}
                                            </Badge>
                                            <Badge variant="subtle" colorPalette={dueStatus.color} size="sm">
                                                <Clock size={10} style={{marginRight:'4px'}}/> {dueStatus.text}
                                            </Badge>
                                        </HStack>
                                    </VStack>
                                </Card.Body>

                                <Card.Footer>
                                    <Button w="full" colorPalette={assn.submission ? "gray" : "blue"} variant={assn.submission ? "outline" : "solid"} onClick={() => navigate(`/student/batch/${batchid}/assignment/${assn.assignment_id}`)}>
                                        {assn.submission ? "View Submissions" : "Submit Work"} <ArrowRight size={16} />
                                    </Button>
                                </Card.Footer>
                            </Card.Root>
                        )
                    })}
                </Grid>
            )}
        </Box>
    )
}