import { useEffect, useState, useMemo } from "react"
import { useParams, useNavigate } from "react-router"
import {
    Box, Flex, Heading, Button, VStack, HStack, Text, Badge, Grid, Card, Spinner, Center, Table, Separator
} from "@chakra-ui/react"
import { Toaster, toaster } from "../../../components/ui/toaster"
import { ArrowLeft, Users, Trophy, Target, Clock, Search, Eye } from "lucide-react"
import { supabase } from "../../../lib/supabase"

export function QuizDashboard() {
    const { batchid, formId } = useParams()
    const navigate = useNavigate()

    const [loading, setLoading] = useState(true)
    const [quiz, setQuiz] = useState(null)
    const [responses, setResponses] = useState([])

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!formId) return
            setLoading(true)

            try {
                // 1. Fetch Quiz Details
                const { data: quizData, error: quizError } = await supabase
                    .from('form')
                    .select('*')
                    .eq('form_id', formId)
                    .single()

                if (quizError) throw quizError
                setQuiz(quizData)

                // 2. Fetch Student Responses with their Names
                const { data: responseData, error: responseError } = await supabase
                    .from('response')
                    .select(`
                        *,
                        User!user_id(name)
                    `)
                    .eq('form_id', formId)
                    .order('submitted_at', { ascending: false })

                if (responseError) throw responseError
                setResponses(responseData || [])

            } catch (error) {
                console.error("Error fetching quiz dashboard:", error)
                toaster.create({ title: "Failed to load dashboard data", type: "error" })
            } finally {
                setLoading(false)
            }
        }

        fetchDashboardData()
    }, [formId])

    // --- Compute Quick Stats ---
    const stats = useMemo(() => {
        if (!responses.length) return { avgScore: 0, highestScore: 0, total: 0, evaluated: 0 }

        const evaluatedResponses = responses.filter(r => r.status === 'evaluated' || r.status === 'submitted')
        const totalScore = evaluatedResponses.reduce((sum, r) => sum + parseFloat(r.total_score || 0), 0)

        return {
            total: responses.length,
            evaluated: evaluatedResponses.length,
            avgScore: evaluatedResponses.length ? (totalScore / evaluatedResponses.length).toFixed(1) : 0,
            highestScore: evaluatedResponses.length ? Math.max(...evaluatedResponses.map(r => parseFloat(r.total_score || 0))) : 0
        }
    }, [responses])

    // --- Helper for Date Formatting ---
    const formatDateTime = (dateString) => {
        if (!dateString) return "N/A"
        return new Date(dateString).toLocaleString(undefined, {
            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
        })
    }

    if (loading) {
        return (
            <Center py={20} w="full">
                <Spinner size="xl" color="blue.500" />
            </Center>
        )
    }

    if (!quiz) {
        return (
            <Center py={20} flexDir="column" gap={4}>
                <Heading size="md" color="fg.muted">Quiz not found.</Heading>
                <Button onClick={() => navigate(`/guru/batch/${batchid}`)}>Back to Batch</Button>
            </Center>
        )
    }

    return (
        <Box w="full" p={{ base: 4, md: 8 }}>
            <Toaster />

            {/* Header */}
            <Flex justify="space-between" align="center" bg="bg.panel" p={6} borderRadius="lg" border="1px solid" borderColor="border.muted" mb={8}>
                <VStack align="start" gap={1}>
                    <HStack gap={3} mb={1}>
                        <Button size="xs" variant="ghost" onClick={() => navigate(-1)}>
                            <ArrowLeft size={14} /> Back
                        </Button>
                        <Badge colorPalette={quiz.status === 'published' ? 'green' : 'yellow'}>{quiz.status}</Badge>
                        <Badge colorPalette="gray">{quiz.quiz_type}</Badge>
                    </HStack>
                    <Heading size="xl" fontWeight="black">{quiz.title}</Heading>
                    <Text color="fg.muted" fontSize="sm">Subject: {quiz.subject} • Duration: {quiz.duration_minutes} mins</Text>
                </VStack>

                <HStack>
                    {quiz.status !== 'closed' && (
                        <Button variant="outline" colorPalette="red" size="sm">
                            Close Quiz
                        </Button>
                    )}
                </HStack>
            </Flex>

            {/* Quick Stats Grid */}
            <Grid templateColumns={{ base: "1fr 1fr", md: "repeat(4, 1fr)" }} gap={4} mb={8}>
                <Card.Root variant="outline">
                    <Card.Body py={4}>
                        <HStack color="fg.muted" mb={2}><Users size={16} /><Text fontSize="sm" fontWeight="bold">Total Submissions</Text></HStack>
                        <Heading size="2xl">{stats.total}</Heading>
                    </Card.Body>
                </Card.Root>

                <Card.Root variant="outline">
                    <Card.Body py={4}>
                        <HStack color="fg.muted" mb={2}><Target size={16} /><Text fontSize="sm" fontWeight="bold">Average Score</Text></HStack>
                        <Heading size="2xl">{stats.avgScore}</Heading>
                    </Card.Body>
                </Card.Root>

                <Card.Root variant="outline">
                    <Card.Body py={4}>
                        <HStack color="fg.muted" mb={2}><Trophy size={16} color="var(--chakra-colors-yellow-500)" /><Text fontSize="sm" fontWeight="bold">Highest Score</Text></HStack>
                        <Heading size="2xl">{stats.highestScore}</Heading>
                    </Card.Body>
                </Card.Root>

                <Card.Root variant="outline">
                    <Card.Body py={4}>
                        <HStack color="fg.muted" mb={2}><Clock size={16} /><Text fontSize="sm" fontWeight="bold">Pending Evaluation</Text></HStack>
                        <Heading size="2xl">{stats.total - stats.evaluated}</Heading>
                    </Card.Body>
                </Card.Root>
            </Grid>

            {/* Submissions Table */}
            <Box bg="bg.panel" borderRadius="lg" border="1px solid" borderColor="border.muted" overflow="hidden">
                <Box p={4} borderBottom="1px solid" borderColor="border.muted" bg="gray.50" _dark={{ bg: "whiteAlpha.50" }}>
                    <Heading size="md">Student Submissions</Heading>
                </Box>

                <Box overflowX="auto">
                    <Table.Root size="md" variant="line">
                        <Table.Header>
                            <Table.Row bg="gray.50" _dark={{ bg: "whiteAlpha.50" }}>
                                <Table.ColumnHeader>Student Name</Table.ColumnHeader>
                                <Table.ColumnHeader>Submitted At</Table.ColumnHeader>
                                <Table.ColumnHeader>Time Taken</Table.ColumnHeader>
                                <Table.ColumnHeader>Status</Table.ColumnHeader>
                                <Table.ColumnHeader isNumeric>Score</Table.ColumnHeader>
                                <Table.ColumnHeader textAlign="right">Actions</Table.ColumnHeader>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {responses.length === 0 ? (
                                <Table.Row>
                                    <Table.Cell colSpan={6} textAlign="center" py={8} color="fg.muted">
                                        No students have submitted this quiz yet.
                                    </Table.Cell>
                                </Table.Row>
                            ) : (
                                responses.map((response) => (
                                    <Table.Row key={response.response_id} _hover={{ bg: "gray.50", _dark: { bg: "whiteAlpha.50" } }}>
                                        <Table.Cell fontWeight="bold">{response.User?.name || `User #${response.user_id}`}</Table.Cell>
                                        <Table.Cell color="fg.muted">{formatDateTime(response.submitted_at)}</Table.Cell>
                                        <Table.Cell color="fg.muted">{response.time_taken || "Unknown"}</Table.Cell>
                                        <Table.Cell>
                                            <Badge
                                                colorPalette={
                                                    response.status === 'evaluated' ? 'green' :
                                                        response.status === 'submitted' ? 'blue' : 'yellow'
                                                }
                                                variant="subtle"
                                            >
                                                {response.status}
                                            </Badge>
                                        </Table.Cell>
                                        <Table.Cell isNumeric fontWeight="black">{response.total_score}</Table.Cell>
                                        <Table.Cell textAlign="right">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                colorPalette="blue"
                                                onClick={() => navigate(`/guru/batch/${batchid}/quizzes/${formId}/attempt/${response.response_id}`)}
                                            >
                                                <Eye size={16} /> Review
                                            </Button>
                                        </Table.Cell>
                                    </Table.Row>
                                ))
                            )}
                        </Table.Body>
                    </Table.Root>
                </Box>
            </Box>
        </Box>
    )
}