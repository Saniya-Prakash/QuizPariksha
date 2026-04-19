import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router"
import {
    Box, Flex, Heading, Button, VStack, HStack, Text, Badge, Card, Spinner, Center, Table,
    Dialog, Input, Textarea, Separator, Grid, IconButton
} from "@chakra-ui/react"
import { Field } from "../../../components/ui/field"
import { Toaster, toaster } from "../../../components/ui/toaster"
import { ArrowLeft, Download, CheckCircle2, Clock, AlertCircle, FileText, Check, ExternalLink } from "lucide-react"
import { supabase } from "../../../lib/supabase"
import { useGuru } from "../../../contexts/GuruContext"

export function AssignmentSubmissions() {
    const { batchid, assignmentid } = useParams()
    const { user } = useGuru()
    const navigate = useNavigate()

    const [loading, setLoading] = useState(true)
    const [assignment, setAssignment] = useState(null)
    const [studentData, setStudentData] = useState([])
    
    // Grading Modal State
    const [isGradeModalOpen, setIsGradeModalOpen] = useState(false)
    const [selectedSubmission, setSelectedSubmission] = useState(null)
    const [gradeForm, setGradeForm] = useState({ marks: "", remarks: "" })
    const [savingGrade, setSavingGrade] = useState(false)

    useEffect(() => {
        fetchData()
    }, [batchid, assignmentid, user])

    const fetchData = async () => {
        if (!assignmentid || !batchid) return

        setLoading(true)

        try {
            // 1. Fetch Assignment Details

            const { data: assnData } = await supabase
                .from('assignment')
                .select('*')
                .eq('assignment_id', assignmentid)
                .single()

            if (assnData) setAssignment(assnData)

            // 2. Fetch all approved students in this batch
            const { data: students } = await supabase
                .from('batchstudent')
                .select('student_id, User(name, email)')
                .eq('batch_id', batchid)
                .eq('status', 'approved')

            // 3. Fetch all submissions for this assignment
            const { data: submissions } = await supabase
                .from('assignmentsubmission')
                .select('*')
                .eq('assignment_id', assignmentid)
                .order('submitted_at', { ascending: false })

            // 4. Merge data: Match each student with their LATEST submission
            if (students) {
                const merged = students.map(student => {
                    const studentSubs = submissions?.filter(s => s.student_id === student.student_id) || []
                    const latestSub = studentSubs.length > 0 ? studentSubs[0] : null
                    
                    return {
                        ...student,
                        submission: latestSub,
                        history: studentSubs // Keep history in case we want to show multiple attempts later
                    }
                })
                
                // Sort by name
                merged.sort((a, b) => a.User?.name.localeCompare(b.User?.name))
                setStudentData(merged)
            }

        } catch (error) {
            console.error("Error fetching submission data:", error)
            toaster.create({ title: "Failed to load data", type: "error" })
        } finally {
            setLoading(false)
        }
    }

    const openGradeModal = (studentItem) => {
        setSelectedSubmission(studentItem)
        setGradeForm({
            marks: studentItem.submission?.marks || "",
            remarks: studentItem.submission?.remarks || ""
        })
        setIsGradeModalOpen(true)
    }

    const handleSaveGrade = async () => {
        if (!selectedSubmission?.submission) return
        
        setSavingGrade(true)
        try {
            const { error } = await supabase
                .from('assignmentsubmission')
                .update({
                    marks: gradeForm.marks ? parseFloat(gradeForm.marks) : null,
                    remarks: gradeForm.remarks,
                    status: 'graded'
                })
                .eq('submission_id', selectedSubmission.submission.submission_id)

            if (error) throw error

            toaster.create({ title: "Grade saved successfully!", type: "success" })
            setIsGradeModalOpen(false)
            fetchData() // Refresh the list to show updated status
            
        } catch (error) {
            console.error("Grading error:", error)
            toaster.create({ title: "Failed to save grade", type: "error" })
        } finally {
            setSavingGrade(false)
        }
    }

    // --- Helpers ---
    const getStatusBadge = (submission, dueDateStr) => {
        if (!submission) {
            const isMissing = dueDateStr && new Date() > new Date(dueDateStr)
            return isMissing ? 
                <Badge colorPalette="red"><AlertCircle size={12} style={{marginRight: '4px'}}/> Missing</Badge> : 
                <Badge colorPalette="gray"><Clock size={12} style={{marginRight: '4px'}}/> Pending</Badge>
        }
        
        switch (submission.status) {
            case 'graded': return <Badge colorPalette="green"><CheckCircle2 size={12} style={{marginRight: '4px'}}/> Graded</Badge>
            case 'late': return <Badge colorPalette="orange"><Clock size={12} style={{marginRight: '4px'}}/> Turned in Late</Badge>
            case 'submitted': return <Badge colorPalette="blue"><Check size={12} style={{marginRight: '4px'}}/> Submitted</Badge>
            default: return <Badge>{submission.status}</Badge>
        }
    }

    // --- Derived Stats ---
    const totalStudents = studentData.length
    const submittedCount = studentData.filter(s => s.submission && s.submission.status !== 'graded').length
    const gradedCount = studentData.filter(s => s.submission?.status === 'graded').length
    const pendingCount = totalStudents - submittedCount - gradedCount

    if (loading) return <Center py={20}><Spinner size="xl" color="blue.500" /></Center>

    return (
        <Box w="full" p={{ base: 4, md: 8 }} maxW="1200px" mx="auto">
            <Toaster />
            <Button size="sm" variant="ghost" onClick={() => navigate(-1)} mb={4} ml={-3}>
                <ArrowLeft size={16} /> Back to Assignments
            </Button>

            {/* HEADER */}
            <Flex justify="space-between" align="start" bg="bg.panel" p={6} borderRadius="lg" border="1px solid" borderColor="border.muted" mb={6} direction={{ base: "column", md: "row" }} gap={4}>
                <VStack align="start" gap={2}>
                    <Badge colorPalette="purple" textTransform="uppercase">{assignment?.assignment_type}</Badge>
                    <Heading size="2xl" fontWeight="bold">{assignment?.title}</Heading>
                    {assignment?.due_date && (
                        <Text color="red.500" fontSize="sm" fontWeight="bold" display="flex" alignItems="center" gap={1}>
                            <Clock size={14}/> Due: {new Date(assignment.due_date).toLocaleString()}
                        </Text>
                    )}
                </VStack>
                {assignment?.pdf_url && (
                    <Button as="a" href={assignment.pdf_url} target="_blank" variant="outline">
                        <Download size={16}/> View Question File
                    </Button>
                )}
            </Flex>

            {/* STATS */}
            <Grid templateColumns={{ base: "1fr 1fr", md: "repeat(4, 1fr)" }} gap={4} mb={8}>
                <Card.Root variant="outline"><Card.Body p={4} textAlign="center"><Text color="fg.muted" fontSize="sm">Total Students</Text><Heading size="xl">{totalStudents}</Heading></Card.Body></Card.Root>
                <Card.Root variant="outline" borderColor="gray.300"><Card.Body p={4} textAlign="center"><Text color="fg.muted" fontSize="sm">Pending</Text><Heading size="xl">{pendingCount}</Heading></Card.Body></Card.Root>
                <Card.Root variant="outline" borderColor="blue.300"><Card.Body p={4} textAlign="center"><Text color="blue.600" fontSize="sm" fontWeight="bold">Needs Grading</Text><Heading size="xl" color="blue.600">{submittedCount}</Heading></Card.Body></Card.Root>
                <Card.Root variant="outline" borderColor="green.300"><Card.Body p={4} textAlign="center"><Text color="green.600" fontSize="sm" fontWeight="bold">Graded</Text><Heading size="xl" color="green.600">{gradedCount}</Heading></Card.Body></Card.Root>
            </Grid>

            {/* STUDENT LIST TABLE */}
            <Card.Root variant="outline">
                <Card.Header pb={0}>
                    <Heading size="md">Submissions List</Heading>
                </Card.Header>
                <Card.Body>
                    <Table.Root size="sm" variant="line">
                        <Table.Header>
                            <Table.Row>
                                <Table.ColumnHeader>Student Name</Table.ColumnHeader>
                                <Table.ColumnHeader>Status</Table.ColumnHeader>
                                <Table.ColumnHeader>Submitted At</Table.ColumnHeader>
                                <Table.ColumnHeader>Marks</Table.ColumnHeader>
                                <Table.ColumnHeader textAlign="right">Action</Table.ColumnHeader>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {studentData.map((student) => (
                                <Table.Row key={student.student_id}>
                                    <Table.Cell>
                                        <Text fontWeight="bold">{student.User?.name}</Text>
                                        <Text fontSize="xs" color="fg.muted">{student.User?.email}</Text>
                                    </Table.Cell>
                                    <Table.Cell>
                                        {getStatusBadge(student.submission, assignment?.due_date)}
                                    </Table.Cell>
                                    <Table.Cell color="fg.muted" fontSize="sm">
                                        {student.submission ? new Date(student.submission.submitted_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                                    </Table.Cell>
                                    <Table.Cell fontWeight="bold">
                                        {student.submission?.status === 'graded' ? student.submission.marks : '-'}
                                    </Table.Cell>
                                    <Table.Cell textAlign="right">
                                        {student.submission ? (
                                            <Button size="sm" colorPalette={student.submission.status === 'graded' ? 'gray' : 'blue'} variant="outline" onClick={() => openGradeModal(student)}>
                                                {student.submission.status === 'graded' ? 'Edit Grade' : 'Review & Grade'}
                                            </Button>
                                        ) : (
                                            <Button size="sm" variant="ghost" disabled>Not Submitted</Button>
                                        )}
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table.Root>
                </Card.Body>
            </Card.Root>

            {/* GRADING MODAL */}
            <Dialog.Root open={isGradeModalOpen} onOpenChange={(e) => setIsGradeModalOpen(e.open)} size="xl" scrollBehavior="inside">
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Header>
                            <Dialog.Title>Grading: {selectedSubmission?.User?.name}</Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body>
                            <VStack align="stretch" gap={6}>
                                {/* Student Work Section */}
                                <Box bg="bg.subtle" p={4} borderRadius="md" border="1px solid" borderColor="border.muted">
                                    <Heading size="sm" mb={3} display="flex" alignItems="center" gap={2}>
                                        <FileText size={16}/> Student's Work
                                    </Heading>
                                    
                                    {selectedSubmission?.submission?.submission_file_url && (
                                        <Button as="a" href={selectedSubmission.submission.submission_file_url} target="_blank" colorPalette="blue" w="full" mb={4}>
                                            <ExternalLink size={16}/> Open Attached PDF
                                        </Button>
                                    )}

                                    {selectedSubmission?.submission?.answer_text ? (
                                        <Box bg="bg.panel" p={3} borderRadius="md" border="1px solid" borderColor="border.muted">
                                            <Text fontSize="sm" whiteSpace="pre-wrap">{selectedSubmission.submission.answer_text}</Text>
                                        </Box>
                                    ) : (
                                        !selectedSubmission?.submission?.submission_file_url && 
                                        <Text color="fg.muted" fontSize="sm" fontStyle="italic">No text response provided.</Text>
                                    )}
                                </Box>

                                <Separator />

                                {/* Grading Inputs Section */}
                                <Grid templateColumns="1fr 2fr" gap={4}>
                                    <Field label="Marks (Optional)">
                                        <Input 
                                            type="number" 
                                            placeholder="e.g. 10" 
                                            value={gradeForm.marks} 
                                            onChange={(e) => setGradeForm({...gradeForm, marks: e.target.value})}
                                        />
                                    </Field>
                                    <Field label="Feedback Remarks (Optional)">
                                        <Textarea 
                                            placeholder="Great job on the second question..." 
                                            rows={3}
                                            value={gradeForm.remarks} 
                                            onChange={(e) => setGradeForm({...gradeForm, remarks: e.target.value})}
                                        />
                                    </Field>
                                </Grid>
                            </VStack>
                        </Dialog.Body>
                        <Dialog.Footer>
                            <Button variant="outline" onClick={() => setIsGradeModalOpen(false)}>Cancel</Button>
                            <Button colorPalette="blue" onClick={handleSaveGrade} loading={savingGrade}>
                                <Check size={16}/> Save Grade
                            </Button>
                        </Dialog.Footer>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Dialog.Root>

        </Box>
    )
}