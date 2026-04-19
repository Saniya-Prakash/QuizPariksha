import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router"
import { Box, Flex, Heading, Button, VStack, HStack, Text, Badge, Grid, Card, Spinner, Center } from "@chakra-ui/react"
import { BookOpen, PlayCircle, Clock, Calendar, CheckCircle2, ArrowRight } from "lucide-react"
import { supabase } from "../../../lib/supabase"
import { useStudent } from "../../../contexts/StudentContext"
import { parseQuizLocalStart, formatQuizLiveStart, getLiveWindowEndMs } from "../../../utils/quizSchedule"

export function BatchQuizList() {
    const { batchid, quizType } = useParams()
    const { user } = useStudent()
    const navigate = useNavigate()
    const isLive = quizType === 'live'

    const [loading, setLoading] = useState(true)
    const [quizzes, setQuizzes] = useState([])

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            const nowMs = Date.now()

            let forms = []
            if (isLive) {
                const { data } = await supabase
                    .from('form')
                    .select('*, batchform!inner(batch_id)')
                    .eq('batchform.batch_id', batchid)
                    .eq('quiz_type', 'live')
                    .eq('status', 'published')
                    .order('created_at', { ascending: false })
                forms = data || []
            } else {
                const { data: practiceRows } = await supabase
                    .from('form')
                    .select('*, batchform!inner(batch_id)')
                    .eq('batchform.batch_id', batchid)
                    .eq('quiz_type', 'practice')
                    .eq('status', 'published')
                    .order('created_at', { ascending: false })

                const { data: liveRows } = await supabase
                    .from('form')
                    .select('*, batchform!inner(batch_id)')
                    .eq('batchform.batch_id', batchid)
                    .eq('quiz_type', 'live')
                    .eq('status', 'published')
                    .order('created_at', { ascending: false })

                const practiceList = practiceRows || []
                const missedLive = (liveRows || [])
                    .filter((q) => {
                        const endMs = getLiveWindowEndMs(q)
                        if (endMs == null || nowMs <= endMs) return false
                        return true
                    })
                    .map((q) => ({ ...q, makeupFromLive: true }))

                const seen = new Set(practiceList.map((f) => f.form_id))
                const extra = missedLive.filter((m) => !seen.has(m.form_id))
                forms = [...practiceList, ...extra]
            }

            if (!forms.length) {
                setQuizzes([])
                setLoading(false)
                return
            }

            const formIds = forms.map((f) => f.form_id)
            const { data: responses } = await supabase
                .from('response')
                .select('response_id, form_id, submitted_at, total_score')
                .eq('user_id', user.user_id)
                .in('form_id', formIds)

            const now = new Date()

            const processedQuizzes = forms
                .filter((quiz) => {
                    const attempt = responses?.find((r) => r.form_id === quiz.form_id)
                    if (isLive) {
                        const start = parseQuizLocalStart(quiz.start_date, quiz.start_time)
                        if (!start) return true
                        const end = new Date(start.getTime() + quiz.duration_minutes * 60000)
                        if (now > end && !attempt) return false
                    } else {
                        if (quiz.makeupFromLive && attempt) return false
                    }
                    return true
                })
                .map((quiz) => ({
                    ...quiz,
                    attempt: responses?.find((r) => r.form_id === quiz.form_id) || null,
                }))

            setQuizzes(processedQuizzes)
            setLoading(false)
        }
        fetchData()
    }, [batchid, quizType, user?.user_id])

    const HeaderIcon = isLive ? PlayCircle : BookOpen

    return (
        <Box w="full" p={{ base: 4, md: 8 }}>
            <Flex justify="space-between" align="center" bg="bg.panel" p={6} borderRadius="lg" border="1px solid" borderColor="border.muted" mb={8}>
                <HStack gap={4}>
                    <Flex p={3} bg={isLive ? "red.100" : "blue.100"} color={isLive ? "red.600" : "blue.600"} borderRadius="md"><HeaderIcon size={24} /></Flex>
                    <VStack align="start" gap={1}>
                        <Heading size="xl" fontWeight="bold" textTransform="capitalize">{quizType} Quizzes</Heading>
                        <Text color="fg.muted" fontSize="sm">
                            {isLive ? "View and attempt your assessments." : "Includes practice quizzes and missed live tests you can complete now."}
                        </Text>
                    </VStack>
                </HStack>
            </Flex>

            {loading ? <Center py={20}><Spinner size="xl" color="blue.500" /></Center> : quizzes.length === 0 ? (
                <Center py={20}><Heading color="fg.muted">No {quizType} quizzes available.</Heading></Center>
            ) : (
                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr", xl: "1fr 1fr 1fr" }} gap={6}>
                    {quizzes.map((quiz) => (
                        <Card.Root key={quiz.form_id} variant="outline" borderColor={quiz.attempt ? "green.300" : "border.muted"}>
                            <Card.Body as={VStack} align="stretch" gap={4}>
                                <Flex justify="space-between" align="start">
                                    <Badge colorPalette="gray">{quiz.subject}</Badge>
                                    {quiz.attempt ? (
                                        <Badge colorPalette="green"><CheckCircle2 size={12} style={{marginRight:'4px'}}/> Attempted</Badge>
                                    ) : quiz.makeupFromLive ? (
                                        <Badge colorPalette="purple">Make-up (missed live)</Badge>
                                    ) : (
                                        <Badge colorPalette="blue">Pending</Badge>
                                    )}
                                </Flex>
                                <Heading size="lg" fontWeight="black">{quiz.title}</Heading>
                                <VStack align="start" gap={2} mt={2}>
                                    <HStack color="fg.muted" fontSize="sm"><Clock size={14} /><Text>{quiz.duration_minutes} Mins</Text></HStack>
                                    {isLive && (
                                        <HStack color="red.500" fontSize="sm">
                                            <Calendar size={14} />
                                            <Text>{formatQuizLiveStart(quiz.start_date, quiz.start_time)}</Text>
                                        </HStack>
                                    )}
                                    {!isLive && quiz.makeupFromLive && (
                                        <HStack color="purple.600" fontSize="sm">
                                            <Calendar size={14} />
                                            <Text>
                                                Was live: {formatQuizLiveStart(quiz.start_date, quiz.start_time)} — window ended; complete as practice
                                            </Text>
                                        </HStack>
                                    )}
                                    {quiz.attempt && <Text fontSize="xs" color="green.600" fontWeight="bold">Score: {quiz.attempt.total_score} | Attempted: {new Date(quiz.attempt.submitted_at).toLocaleDateString()}</Text>}
                                </VStack>
                            </Card.Body>
                            <Card.Footer>
                                {quiz.attempt ? (
                                    <Button w="full" colorPalette="green" variant="outline" onClick={() => navigate(`/student/batch/${batchid}/quiz/${quiz.form_id}/result/${quiz.attempt.response_id}`)}>
                                        View Result <ArrowRight size={16} />
                                    </Button>
                                ) : (
                                    // Placeholder for next step: navigate to Exam Viewer
                                    <Button type="button" w="full" colorPalette="blue" onClick={() => navigate(`/student/batch/${batchid}/quiz/${quiz.form_id}/take`)}>
                                        Start Quiz <PlayCircle size={16} />
                                    </Button>
                                )}
                            </Card.Footer>
                        </Card.Root>
                    ))}
                </Grid>
            )}
        </Box>
    )
}