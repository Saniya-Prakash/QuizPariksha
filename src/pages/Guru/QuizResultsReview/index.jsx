import { useEffect, useState, useMemo } from "react"
import { useParams, useNavigate } from "react-router"
import {
    Box, Flex, Heading, Button, VStack, HStack, Text, Badge, Card, Spinner, Center, Grid, Image, Separator
} from "@chakra-ui/react"
import { Toaster, toaster } from "../../../components/ui/toaster"
import { ArrowLeft, CheckCircle2, XCircle, HelpCircle } from "lucide-react"
import { supabase } from "../../../lib/supabase"

export function AttemptReview() {
    const { batchid, formId, responseId } = useParams()
    const navigate = useNavigate()

    const [loading, setLoading] = useState(true)
    const [attemptData, setAttemptData] = useState(null)
    const [questions, setQuestions] = useState([])

    useEffect(() => {
        const fetchAttemptDetails = async () => {
            if (!formId || !responseId) return
            setLoading(true)

            try {
                // 1. Fetch Response Details + User + Form Info
                const { data: responseData, error: responseError } = await supabase
                    .from('response')
                    .select(`
                        *,
                        User!user_id(name),
                        form(*)
                    `)
                    .eq('response_id', responseId)
                    .single()

                if (responseError) throw responseError
                setAttemptData(responseData)

                // 2. Fetch all Questions and Options for this form
                const { data: questionsData, error: questionsError } = await supabase
                    .from('question')
                    .select(`
                        *,
                        questiontext(*),
                        option(
                            *,
                            optiontext(*)
                        )
                    `)
                    .eq('form_id', formId)
                    .order('created_at', { ascending: true })

                if (questionsError) throw questionsError

                // 3. Fetch the Student's specific answers from the 'answer' table
                const { data: answerData, error: answerError } = await supabase
                    .from('answer')
                    .select('*')
                    .eq('response_id', responseId)

                if (answerError) throw answerError

                // 4. Merge Student Answers into the Questions Array
                const mergedQuestions = questionsData.map(q => {
                    const studentAnswer = answerData.find(a => a.question_id === q.question_id)
                    return {
                        ...q,
                        studentAnswer: studentAnswer || null // Contains option_id or answer_text
                    }
                })

                setQuestions(mergedQuestions)

            } catch (error) {
                console.error("Error fetching attempt:", error)
                toaster.create({ title: "Failed to load attempt details", type: "error" })
            } finally {
                setLoading(false)
            }
        }

        fetchAttemptDetails()
    }, [formId, responseId])

    // --- Calculate Total Possible Marks ---
    const totalPossibleMarks = useMemo(() => {
        return questions.reduce((sum, q) => sum + parseFloat(q.marks || 0), 0)
    }, [questions])

    if (loading) {
        return <Center py={20} w="full"><Spinner size="xl" color="blue.500" /></Center>
    }

    if (!attemptData) {
        return (
            <Center py={20} flexDir="column" gap={4}>
                <Heading size="md" color="fg.muted">Attempt not found.</Heading>
                <Button onClick={() => navigate(-1)}>Go Back</Button>
            </Center>
        )
    }

    const { User: student, form: quiz } = attemptData

    return (
        <Box w="full" p={{ base: 4, md: 8 }} maxW="1000px" mx="auto">
            <Toaster />

            {/* Header Section */}
            <Flex justify="space-between" align="center" bg="bg.panel" p={6} borderRadius="lg" border="1px solid" borderColor="border.muted" mb={8}>
                <VStack align="start" gap={2}>
                    <Button size="xs" variant="ghost" onClick={() => navigate(-1)} ml={-3}>
                        <ArrowLeft size={14} /> Back to Submissions
                    </Button>
                    <Heading size="xl" fontWeight="black">{student?.name || `User #${attemptData.user_id}`}'s Attempt</Heading>
                    <HStack color="fg.muted" fontSize="sm" separator={<Text>•</Text>}>
                        <Text>{quiz.title}</Text>
                        <Text>Submitted: {new Date(attemptData.submitted_at).toLocaleString()}</Text>
                        <Text>Time Taken: {attemptData.time_taken || "N/A"}</Text>
                    </HStack>
                </VStack>

                <Card.Root variant="elevated" bg="blue.50" _dark={{ bg: "blue.900" }} borderColor="blue.200">
                    <Card.Body py={3} px={6} textAlign="center">
                        <Text fontSize="sm" fontWeight="bold" color="blue.600" _dark={{ color: "blue.300" }} textTransform="uppercase">Total Score</Text>
                        <Heading size="2xl" color="blue.700" _dark={{ color: "blue.100" }}>
                            {attemptData.total_score} <Text as="span" fontSize="lg" color="blue.500">/ {totalPossibleMarks}</Text>
                        </Heading>
                    </Card.Body>
                </Card.Root>
            </Flex>

            {/* Questions List */}
            <VStack gap={6} align="stretch">
                {questions.map((q, index) => {
                    const qTextEn = q.questiontext?.find(qt => qt.language_code === 'en') || q.questiontext?.[0]
                    const qTextHi = q.questiontext?.find(qt => qt.language_code === 'hi')

                    const isMultipleChoice = q.question_type === 'MultipleChoice' || q.question_type === 'Checkbox'

                    // FIXED: Using option_id from your actual answer table schema
                    const studentOptId = q.studentAnswer?.option_id

                    // Determine if the student got this specific question right (for UI coloring)
                    let isCorrectAnswer = false
                    if (isMultipleChoice && studentOptId) {
                        const selectedOpt = q.option.find(o => o.option_id === studentOptId)
                        if (selectedOpt?.is_correct) isCorrectAnswer = true
                    }

                    return (
                        <Card.Root key={q.question_id} variant="outline" borderColor={isCorrectAnswer ? "green.300" : (studentOptId ? "red.300" : "border.muted")}>
                            {/* Question Header */}
                            <Card.Header display="flex" flexDirection="row" justifyContent="space-between" alignItems="center" bg={isCorrectAnswer ? "green.50" : (studentOptId ? "red.50" : "gray.50")} _dark={{ bg: isCorrectAnswer ? "green.900" : (studentOptId ? "red.900" : "whiteAlpha.50") }} py={3}>
                                <HStack gap={3}>
                                    <Badge size="lg" colorPalette={isCorrectAnswer ? "green" : (studentOptId ? "red" : "gray")}>
                                        Q{index + 1}
                                    </Badge>
                                    {!studentOptId && !q.studentAnswer?.answer_text && (
                                        <Badge colorPalette="gray" variant="subtle"><HelpCircle size={12} style={{ marginRight: '4px' }} /> Not Attempted</Badge>
                                    )}
                                </HStack>
                                <Text fontWeight="bold" color="fg.muted">
                                    {isCorrectAnswer ? q.marks : 0} / {q.marks} Marks
                                </Text>
                            </Card.Header>

                            <Card.Body>
                                <VStack gap={4} align="stretch">
                                    {/* Question Content */}
                                    <Grid templateColumns={qTextHi?.question_text ? "1fr 1fr" : "1fr"} gap={6}>
                                        <VStack align="start" gap={2}>
                                            <Text fontWeight="medium" fontSize="lg">{qTextEn?.question_text}</Text>
                                            {qTextEn?.image_url && <Image src={qTextEn.image_url} maxH="200px" borderRadius="md" border="1px solid" borderColor="border.muted" />}
                                        </VStack>

                                        {qTextHi?.question_text && (
                                            <VStack align="start" gap={2} pl={6} borderLeft="1px solid" borderColor="border.muted">
                                                <Text fontWeight="medium" fontSize="lg" color="fg.muted">{qTextHi.question_text}</Text>
                                                {qTextHi?.image_url && <Image src={qTextHi.image_url} maxH="200px" borderRadius="md" border="1px solid" borderColor="border.muted" />}
                                            </VStack>
                                        )}
                                    </Grid>

                                    <Separator my={2} />

                                    {/* Options Content */}
                                    {isMultipleChoice ? (
                                        <VStack gap={3} align="stretch">
                                            {q.option?.map((opt) => {
                                                const optTextEn = opt.optiontext?.find(ot => ot.language_code === 'en') || opt.optiontext?.[0]
                                                const optTextHi = opt.optiontext?.find(ot => ot.language_code === 'hi')

                                                const isSelected = studentOptId === opt.option_id
                                                const isCorrect = opt.is_correct

                                                let bg = "transparent"
                                                let borderColor = "border.muted"
                                                let icon = <Circle size={18} color="var(--chakra-colors-fg-muted)" />
                                                let textColor = "fg.default"

                                                if (isSelected && isCorrect) {
                                                    bg = "green.100"
                                                    borderColor = "green.500"
                                                    icon = <CheckCircle2 size={18} color="var(--chakra-colors-green-600)" />
                                                    textColor = "green.800"
                                                } else if (isSelected && !isCorrect) {
                                                    bg = "red.100"
                                                    borderColor = "red.500"
                                                    icon = <XCircle size={18} color="var(--chakra-colors-red-600)" />
                                                    textColor = "red.800"
                                                } else if (!isSelected && isCorrect) {
                                                    bg = "green.50"
                                                    borderColor = "green.300"
                                                    icon = <CheckCircle2 size={18} color="var(--chakra-colors-green-500)" />
                                                    textColor = "green.700"
                                                }

                                                return (
                                                    <Box
                                                        key={opt.option_id}
                                                        p={3}
                                                        borderRadius="md"
                                                        border="1px solid"
                                                        borderColor={borderColor}
                                                        bg={bg}
                                                        _dark={{
                                                            bg: isSelected && isCorrect ? "green.900" : isSelected && !isCorrect ? "red.900" : !isSelected && isCorrect ? "green.900/30" : "transparent",
                                                            textColor: "white"
                                                        }}
                                                    >
                                                        <HStack gap={3} align="start">
                                                            <Box mt={0.5}>{icon}</Box>
                                                            <VStack align="start" gap={1} flex={1}>
                                                                <HStack gap={4} align="start" w="full">
                                                                    <Text color={textColor} fontWeight={isSelected || isCorrect ? "bold" : "normal"} flex={1}>
                                                                        {optTextEn?.option_text}
                                                                    </Text>
                                                                    {optTextHi?.option_text && (
                                                                        <Text color={textColor} opacity={0.8} flex={1} borderLeft="1px solid" borderColor="currentColor" pl={4}>
                                                                            {optTextHi.option_text}
                                                                        </Text>
                                                                    )}
                                                                </HStack>

                                                                {/* Option Images */}
                                                                {(optTextEn?.image_url || optTextHi?.image_url) && (
                                                                    <HStack gap={4} mt={2}>
                                                                        {optTextEn?.image_url && <Image src={optTextEn.image_url} maxH="100px" borderRadius="sm" />}
                                                                        {optTextHi?.image_url && <Image src={optTextHi.image_url} maxH="100px" borderRadius="sm" />}
                                                                    </HStack>
                                                                )}
                                                            </VStack>

                                                            {isSelected && !isCorrect && <Badge colorPalette="red">Your Answer</Badge>}
                                                            {!isSelected && isCorrect && studentOptId && <Badge colorPalette="green">Correct Answer</Badge>}
                                                        </HStack>
                                                    </Box>
                                                )
                                            })}
                                        </VStack>
                                    ) : (
                                        /* For non-MCQ questions */
                                        <Box p={4} bg="bg.panel" borderRadius="md" border="1px solid" borderColor="border.muted">
                                            <Text fontWeight="bold" mb={2} color="fg.muted">Student's Answer:</Text>
                                            {/* FIXED: Using answer_text from your actual answer table schema */}
                                            <Text>{q.studentAnswer?.answer_text || <Text as="span" fontStyle="italic" color="fg.muted">No answer provided.</Text>}</Text>
                                        </Box>
                                    )}
                                </VStack>
                            </Card.Body>
                        </Card.Root>
                    )
                })}
            </VStack>
        </Box>
    )
}