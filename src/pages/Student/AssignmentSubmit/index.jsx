import { useEffect, useState, useRef } from "react"
import { useParams, useNavigate } from "react-router"
import {
    Box, Flex, Heading, Button, VStack, HStack, Text, Badge, Card, Spinner, Center, Separator, Textarea, Grid
} from "@chakra-ui/react"
import { Toaster, toaster } from "../../../components/ui/toaster"
import { ArrowLeft, FileText, Download, UploadCloud, CheckCircle2, Clock, Check, History, Plus } from "lucide-react"
import { supabase } from "../../../lib/supabase"
import { useStudent } from "../../../contexts/StudentContext"

export function AssignmentSubmit() {
    const { batchid, assignmentId } = useParams()
    const { user } = useStudent()
    const navigate = useNavigate()
    const fileInputRef = useRef(null)

    const [loading, setLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showResubmitForm, setShowResubmitForm] = useState(false)
    
    const [assignment, setAssignment] = useState(null)
    const [submissions, setSubmissions] = useState([]) // Array of all attempts
    const latestSubmission = submissions[0] // The most recent one

    // Form State
    const [answerText, setAnswerText] = useState("")
    const [selectedFile, setSelectedFile] = useState(null)

    useEffect(() => {
        const fetchDetails = async () => {
            if (!assignmentId || !user) return
            setLoading(true)

            try {
                const { data: assnData } = await supabase
                    .from('assignment')
                    .select('*, User!posted_by(name)')
                    .eq('assignment_id', assignmentId)
                    .single()

                if (assnData) setAssignment(assnData)

                // Fetch ALL submissions for history, newest first
                const { data: subData } = await supabase
                    .from('assignmentsubmission')
                    .select('*')
                    .eq('assignment_id', assignmentId)
                    .eq('student_id', user.user_id)
                    .order('submitted_at', { ascending: false })

                if (subData) setSubmissions(subData)

            } catch (error) {
                console.error("Error fetching assignment:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchDetails()
    }, [assignmentId, user])

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (!file) return
        if (file.type !== "application/pdf") {
            toaster.create({ title: "Please upload a valid PDF file", type: "error" })
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            toaster.create({ title: "File too large. Max 5MB.", type: "error" })
            return
        }
        setSelectedFile(file)
    }

    const handleSubmitWork = async () => {
        if (!answerText.trim() && !selectedFile) {
            return toaster.create({ title: "Please write an answer or attach a PDF", type: "error" })
        }

        setIsSubmitting(true)

        try {
            let publicUrl = null
            if (selectedFile) {
                const fileExt = selectedFile.name.split('.').pop()
                const fileName = `${user.user_id}_${Date.now()}.${fileExt}`
                const filePath = `batch_${batchid}/${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('submissions')
                    .upload(filePath, selectedFile, { contentType: selectedFile.type || 'application/pdf', upsert: false })
                if (uploadError) throw uploadError

                const { data: urlData } = supabase.storage.from('submissions').getPublicUrl(filePath)
                publicUrl = urlData.publicUrl
            }

            const now = new Date()
            const dueDate = assignment.due_date ? new Date(assignment.due_date) : null
            const status = (dueDate && now > dueDate) ? 'late' : 'submitted'

            const assignmentIdNum = parseInt(String(assignmentId), 10)
            if (Number.isNaN(assignmentIdNum)) throw new Error('Invalid assignment id')

            // INSERT creates a new row, preserving previous attempts
            const { data: newSub, error: insertError } = await supabase
                .from('assignmentsubmission')
                .insert({
                    assignment_id: assignmentIdNum,
                    student_id: user.user_id,
                    answer_text: answerText.trim() || null,
                    submission_file_url: publicUrl,
                    status,
                    submitted_at: now.toISOString(),
                })
                .select()
                .single()

            if (insertError) throw insertError

            toaster.create({ title: "Assignment submitted successfully!", type: "success" })
            
            // Add the new submission to the top of the history stack
            setSubmissions([newSub, ...submissions])
            setShowResubmitForm(false)
            setAnswerText("")
            setSelectedFile(null)

        } catch (error) {
            console.error("Submit assignment error:", error)
            const msg = error?.message || String(error)
            const isRls = /row-level security|RLS|violates policy/i.test(msg)
            const bucketMissing = /bucket not found/i.test(msg)
            let description = msg
            if (bucketMissing) {
                description =
                    'The Storage bucket "submissions" is missing. Run supabase/migrations/20260419160000_storage_create_buckets.sql in the SQL Editor, or create a public bucket named submissions in Dashboard → Storage.'
            } else if (isRls) {
                description =
                    'Database or Storage blocked this action. Run 20260419140000_assignmentsubmission_rls.sql and 20260419120000_storage_assignment_submissions.sql if you have not already.'
            }
            toaster.create({
                title: "Failed to submit assignment",
                description,
                type: "error",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    if (loading) return <Center py={20}><Spinner size="xl" color="blue.500" /></Center>

    return (
        <Box w="full" p={{ base: 4, md: 8 }} maxW="1000px" mx="auto">
            <Toaster />
            <Button size="sm" variant="ghost" onClick={() => navigate(-1)} mb={4} ml={-3}>
                <ArrowLeft size={16} /> Back to Assignments
            </Button>

            <Grid templateColumns={{ base: "1fr", lg: "1.2fr 1fr" }} gap={8}>
                
                {/* LEFT: ASSIGNMENT DETAILS */}
                <VStack gap={6} align="stretch">
                    <Box bg="bg.panel" p={6} borderRadius="lg" border="1px solid" borderColor="border.muted">
                        <Flex justify="space-between" align="start" mb={4}>
                            <Badge colorPalette="purple" textTransform="uppercase">{assignment?.assignment_type}</Badge>
                            <Text fontSize="sm" color="fg.muted">Posted by {assignment?.User?.name}</Text>
                        </Flex>

                        <Heading size="2xl" mb={4} fontWeight="black">{assignment?.title}</Heading>
                        <Text fontSize="md" color="fg.default" mb={6} whiteSpace="pre-wrap">{assignment?.instructions}</Text>

                        {assignment?.due_date && (
                            <HStack color="red.500" fontSize="sm" fontWeight="bold" mb={6} bg="red.50" _dark={{bg: "red.900/20"}} p={3} borderRadius="md">
                                <Clock size={16} />
                                <Text>Due: {new Date(assignment.due_date).toLocaleString()}</Text>
                            </HStack>
                        )}

                        {assignment?.pdf_url && (
                            <Button as="a" href={assignment.pdf_url} target="_blank" colorPalette="blue" variant="surface" w="full">
                                <Download size={16} /> Download Material
                            </Button>
                        )}
                    </Box>
                </VStack>

                {/* RIGHT: SUBMISSION LOGIC */}
                <VStack gap={6} align="stretch">
                    
                    {/* View: Shows Latest Submission */}
                    {latestSubmission && !showResubmitForm && (
                        <Box bg="bg.panel" p={6} borderRadius="lg" border="1px solid" borderColor={latestSubmission.status === 'graded' ? 'green.400' : 'blue.300'}>
                            <VStack align="center" gap={4} py={4} textAlign="center">
                                <CheckCircle2 size={48} color={latestSubmission.status === 'graded' ? "var(--chakra-colors-green-500)" : "var(--chakra-colors-blue-500)"} />
                                <Heading size="lg">Current Submission</Heading>
                                <Text color="fg.muted" fontSize="sm">
                                    Turned in {new Date(latestSubmission.submitted_at).toLocaleString()}
                                </Text>

                                <Badge size="lg" colorPalette={latestSubmission.status === 'late' ? 'orange' : latestSubmission.status === 'graded' ? 'green' : 'blue'}>
                                    {latestSubmission.status.toUpperCase()}
                                </Badge>

                                <Separator w="full" my={2} />

                                {latestSubmission.status === 'graded' ? (
                                    <Card.Root variant="outline" w="full" bg="green.50" _dark={{bg: "green.900/20"}} borderColor="green.200">
                                        <Card.Body py={4}>
                                            <Heading size="md" color="green.600" mb={2}>Marks: {latestSubmission.marks}</Heading>
                                            {latestSubmission.remarks && <Text fontSize="sm" color="fg.muted">Feedback: {latestSubmission.remarks}</Text>}
                                        </Card.Body>
                                    </Card.Root>
                                ) : (
                                    <Button variant="outline" size="sm" w="full" onClick={() => setShowResubmitForm(true)}>
                                        <Plus size={16} /> Submit a New Version
                                    </Button>
                                )}

                                {latestSubmission.submission_file_url && (
                                    <Button as="a" href={latestSubmission.submission_file_url} target="_blank" w="full" variant="subtle" mt={2}>
                                        <FileText size={16}/> View Attached File
                                    </Button>
                                )}

                                {latestSubmission.answer_text && (
                                    <Box w="full" p={4} bg="bg.subtle" borderRadius="md" textAlign="left" mt={2}>
                                        <Text fontSize="xs" fontWeight="bold" color="fg.muted" mb={2}>TEXT RESPONSE:</Text>
                                        <Text fontSize="sm" whiteSpace="pre-wrap">{latestSubmission.answer_text}</Text>
                                    </Box>
                                )}
                            </VStack>
                        </Box>
                    )}

                    {/* View: Form to Submit Work */}
                    {(!latestSubmission || showResubmitForm) && (
                        <Box bg="bg.panel" p={6} borderRadius="lg" border="1px solid" borderColor="border.muted">
                            <Flex justify="space-between" align="center" mb={6}>
                                <Heading size="md">Your Work</Heading>
                                {latestSubmission && (
                                    <Button size="xs" variant="ghost" onClick={() => setShowResubmitForm(false)}>Cancel</Button>
                                )}
                            </Flex>
                            
                            <VStack align="stretch" gap={5}>
                                <Box>
                                    <Text fontSize="sm" fontWeight="bold" mb={2}>Text Response (Optional)</Text>
                                    <Textarea placeholder="Type your answer here..." rows={6} value={answerText} onChange={(e) => setAnswerText(e.target.value)} />
                                </Box>

                                <Box>
                                    <Text fontSize="sm" fontWeight="bold" mb={2}>Attach PDF (Optional)</Text>
                                    <input type="file" accept="application/pdf" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileChange} />
                                    <Button w="full" variant="outline" borderStyle="dashed" borderWidth="2px" h="50px" colorPalette={selectedFile ? "green" : "gray"} onClick={() => fileInputRef.current?.click()}>
                                        <UploadCloud size={16} /> {selectedFile ? selectedFile.name : "Click to Upload PDF"}
                                    </Button>
                                </Box>

                                <Separator my={2} />

                                <Button colorPalette="blue" size="lg" w="full" onClick={handleSubmitWork} loading={isSubmitting}>
                                    <Check size={18} /> Turn In
                                </Button>
                            </VStack>
                        </Box>
                    )}

                    {/* View: Previous Submissions History List */}
                    {submissions.length > 1 && (
                        <Box bg="bg.panel" p={5} borderRadius="lg" border="1px solid" borderColor="border.muted">
                            <Heading size="sm" mb={4} display="flex" alignItems="center" gap={2}>
                                <History size={16}/> Previous Attempts
                            </Heading>
                            <VStack align="stretch" gap={3}>
                                {submissions.slice(1).map((sub, index) => (
                                    <Box key={sub.submission_id} p={3} bg="bg.subtle" borderRadius="md" borderLeft="3px solid" borderColor="gray.400">
                                        <Flex justify="space-between" align="center" mb={1}>
                                            <Text fontSize="sm" fontWeight="bold">Attempt {submissions.length - 1 - index}</Text>
                                            <Badge size="xs" colorPalette={sub.status === 'graded' ? 'green' : 'gray'}>{sub.status}</Badge>
                                        </Flex>
                                        <Text fontSize="xs" color="fg.muted">{new Date(sub.submitted_at).toLocaleString()}</Text>
                                        {(sub.submission_file_url || sub.answer_text) && (
                                            <HStack gap={3} mt={2}>
                                                {sub.submission_file_url && <Text fontSize="xs" color="blue.500" as="a" href={sub.submission_file_url} target="_blank">PDF Attached</Text>}
                                                {sub.answer_text && <Text fontSize="xs" color="gray.500">Text Provided</Text>}
                                            </HStack>
                                        )}
                                    </Box>
                                ))}
                            </VStack>
                        </Box>
                    )}
                </VStack>
            </Grid>
        </Box>
    )
}