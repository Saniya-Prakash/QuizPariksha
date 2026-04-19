import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router"
import {
    Box, Flex, Heading, Button, VStack, HStack, Text, Badge, Grid, Card, Spinner, Center
} from "@chakra-ui/react"
import { Toaster, toaster } from "../../../components/ui/toaster"
import { Plus, BookOpen, PlayCircle, Clock, Calendar, ArrowRight, FileText } from "lucide-react"
import { supabase } from "../../../lib/supabase"
import { formatQuizLiveStart } from "../../../utils/quizSchedule"

export function BatchQuizList() {
    const { batchid, quizType } = useParams()
    const navigate = useNavigate()

    // Ensure the quizType is valid, default to practice if someone types a weird URL
    const validQuizType = (quizType === 'live' || quizType === 'practice') ? quizType : 'practice'
    const isLive = validQuizType === 'live'

    const [loading, setLoading] = useState(true)
    const [quizzes, setQuizzes] = useState([])
    const [batchName, setBatchName] = useState("")

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!batchid) return
            setLoading(true)

            try {
                // 1. Fetch Batch Name for the header
                const { data: batchData } = await supabase
                    .from('batch')
                    .select('batch_name')
                    .eq('batch_id', batchid)
                    .single()

                if (batchData) setBatchName(batchData.batch_name)

                // 2. Fetch Quizzes by inner joining form and batchform
                // This fetches all forms of the correct quiz_type that are linked to this batch
                const { data: formData, error: formError } = await supabase
                    .from('form')
                    .select(`
                        *,
                        batchform!inner(batch_id)
                    `)
                    .eq('batchform.batch_id', batchid)
                    .eq('quiz_type', validQuizType)
                    .order('created_at', { ascending: false })

                if (formError) throw formError

                setQuizzes(formData || [])

            } catch (error) {
                console.error("Error fetching quizzes:", error)
                toaster.create({ title: "Failed to load quizzes", type: "error" })
            } finally {
                setLoading(false)
            }
        }

        fetchDashboardData()
    }, [batchid, validQuizType])

    const HeaderIcon = isLive ? PlayCircle : BookOpen

    return (
        <Box w="full" p={{ base: 4, md: 8 }}>
            <Toaster />

            {/* Header */}
            <Flex justify="space-between" align="center" bg="bg.panel" p={6} borderRadius="lg" border="1px solid" borderColor="border.muted" mb={8}>
                <HStack gap={4}>
                    <Flex p={3} bg={isLive ? "red.100" : "blue.100"} color={isLive ? "red.600" : "blue.600"} borderRadius="md">
                        <HeaderIcon size={24} />
                    </Flex>
                    <VStack align="start" gap={1}>
                        <Heading size="xl" fontWeight="bold" textTransform="capitalize">
                            {validQuizType} Quizzes - {batchName || "Batch"}
                        </Heading>
                        <Text color="fg.muted" fontSize="sm">
                            Manage your {validQuizType} assessments and view student performance.
                        </Text>
                    </VStack>
                </HStack>

                <Button colorPalette="blue" onClick={() => navigate(`/guru/batch/${batchid}/quizzes/new/${validQuizType}`)}>
                    <Plus size={16} /> Create New
                </Button>
            </Flex>

            {/* Content Grid */}
            {loading ? (
                <Center py={20}>
                    <Spinner size="xl" color="blue.500" />
                </Center>
            ) : quizzes.length === 0 ? (
                <Center py={20} flexDir="column" gap={4} bg="bg.panel" borderRadius="lg" border="1px dashed" borderColor="border.muted">
                    <FileText size={48} color="var(--chakra-colors-fg-muted)" />
                    <Heading size="md" color="fg.muted">No {validQuizType} quizzes yet.</Heading>
                    <Button variant="outline" onClick={() => navigate(`/guru/batch/${batchid}/quizzes/new/${validQuizType}`)}>
                        Create your first {validQuizType} quiz
                    </Button>
                </Center>
            ) : (
                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr", xl: "1fr 1fr 1fr" }} gap={6}>
                    {quizzes.map((quiz) => (
                        <Card.Root key={quiz.form_id} variant="outline" _hover={{ shadow: "md", borderColor: "blue.300" }} transition="all 0.2s">
                            <Card.Body as={VStack} align="stretch" gap={4}>

                                <Flex justify="space-between" align="start">
                                    <Badge colorPalette="gray" size="sm" variant="subtle">
                                        {quiz.subject || "General"}
                                    </Badge>
                                    <Badge colorPalette={quiz.status === 'published' ? 'green' : 'yellow'} variant="solid">
                                        {quiz.status}
                                    </Badge>
                                </Flex>

                                <Heading size="lg" fontWeight="black" lineHeight="1.2">
                                    {quiz.title || "Untitled Quiz"}
                                </Heading>

                                <VStack align="start" gap={2} mt={2}>
                                    <HStack color="fg.muted" fontSize="sm">
                                        <Clock size={14} />
                                        <Text>{quiz.duration_minutes} Minutes</Text>
                                    </HStack>

                                    {isLive && (
                                        <HStack color="red.500" fontSize="sm" fontWeight="medium">
                                            <Calendar size={14} />
                                            <Text>{formatQuizLiveStart(quiz.start_date, quiz.start_time)}</Text>
                                        </HStack>
                                    )}
                                </VStack>
                            </Card.Body>

                            <Card.Footer>
                                <Button
                                    w="full"
                                    colorPalette="blue"
                                    variant="subtle"
                                    justifyContent="space-between"
                                    onClick={() => navigate(`/guru/batch/${batchid}/quizzes/${quiz.form_id}/dashboard`)}
                                >
                                    Dive In <ArrowRight size={16} />
                                </Button>
                            </Card.Footer>
                        </Card.Root>
                    ))}
                </Grid>
            )}
        </Box>
    )
}