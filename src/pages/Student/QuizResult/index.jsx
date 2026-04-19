import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router"
import { Box, Flex, Heading, Button, VStack, HStack, Text, Badge, Card, Spinner, Center, Grid, Image, Separator } from "@chakra-ui/react"
import { ArrowLeft, CheckCircle2, XCircle, Trophy, Clock } from "lucide-react"
import { supabase } from "../../../lib/supabase"

export function QuizResult() {
    const { batchid, formId, responseId } = useParams()
    const navigate = useNavigate()

    const [loading, setLoading] = useState(true)
    const [resultData, setResultData] = useState(null)
    const [questions, setQuestions] = useState([])
    const [rank, setRank] = useState(null)

    useEffect(() => {
        const fetchResult = async () => {
            setLoading(true)
            try {
                // 1. Fetch Response Data
                const { data: response } = await supabase.from('response').select('*, form(title, duration_minutes)').eq('response_id', responseId).single()
                setResultData(response)

                // 2. Fetch Rank (Calculate by comparing total scores for this form)
                const { data: allResponses } = await supabase.from('response').select('response_id, total_score').eq('form_id', formId).order('total_score', { ascending: false })
                if (allResponses) {
                    const myIndex = allResponses.findIndex(r => r.response_id === parseInt(responseId))
                    setRank(myIndex !== -1 ? myIndex + 1 : "-")
                }

                // 3. Fetch Questions & Correct Options
                const { data: qData } = await supabase.from('question')
                    .select('*, questiontext(*), option(*, optiontext(*))')
                    .eq('form_id', formId).order('created_at', { ascending: true })

                // 4. Fetch Student's specific Answers
                const { data: aData } = await supabase.from('answer').select('*').eq('response_id', responseId)

                // Merge student answers into questions
                const merged = qData.map(q => {
                    const studentAns = aData?.find(a => a.question_id === q.question_id)
                    return { ...q, studentAnswer: studentAns }
                })
                setQuestions(merged)
            } catch (err) { console.error(err) } finally { setLoading(false) }
        }
        fetchResult()
    }, [formId, responseId])

    if (loading) return <Center py={20}><Spinner size="xl" color="blue.500" /></Center>

    return (
        <Box w="full" p={{ base: 4, md: 8 }} maxW="1000px" mx="auto">
            <Flex justify="space-between" align="center" bg="bg.panel" p={6} borderRadius="lg" border="1px solid" borderColor="border.muted" mb={8}>
                <VStack align="start" gap={2}>
                    <Button size="xs" variant="ghost" onClick={() => navigate(-1)} ml={-3}><ArrowLeft size={14}/> Back</Button>
                    <Heading size="xl" fontWeight="black">{resultData?.form?.title} - Results</Heading>
                    <Text color="fg.muted" fontSize="sm">Submitted: {new Date(resultData?.submitted_at).toLocaleString()}</Text>
                </VStack>
                <HStack gap={6}>
                    <VStack align="end" gap={0}>
                        <Text fontSize="xs" color="fg.muted" fontWeight="bold" textTransform="uppercase">Your Rank</Text>
                        <HStack color="yellow.500"><Trophy size={20}/><Heading size="xl">#{rank}</Heading></HStack>
                    </VStack>
                    <Separator orientation="vertical" h="40px" />
                    <VStack align="end" gap={0}>
                        <Text fontSize="xs" color="fg.muted" fontWeight="bold" textTransform="uppercase">Total Score</Text>
                        <Heading size="xl" color="blue.600">{resultData?.total_score}</Heading>
                    </VStack>
                </HStack>
            </Flex>

            <VStack gap={6} align="stretch">
                {questions.map((q, index) => {
                    const qTextEn = q.questiontext?.find(qt => qt.language_code === 'en') || q.questiontext?.[0]
                    const studentOptId = q.studentAnswer?.option_id
                    
                    let isCorrect = false
                    if (studentOptId) {
                        const selectedOpt = q.option.find(o => o.option_id === studentOptId)
                        if (selectedOpt?.is_correct) isCorrect = true
                    }

                    return (
                        <Card.Root key={q.question_id} variant="outline" borderColor={isCorrect ? "green.300" : (studentOptId ? "red.300" : "border.muted")}>
                            <Card.Header display="flex" flexDirection="row" justifyContent="space-between" bg={isCorrect ? "green.50" : (studentOptId ? "red.50" : "gray.50")} py={3}>
                                <Badge size="lg" colorPalette={isCorrect ? "green" : (studentOptId ? "red" : "gray")}>Q{index + 1}</Badge>
                                <Text fontWeight="bold" color="fg.muted">{isCorrect ? q.marks : 0} / {q.marks} Marks</Text>
                            </Card.Header>
                            <Card.Body>
                                <VStack gap={4} align="stretch">
                                    <VStack align="start" gap={2}>
                                        <Text fontWeight="medium" fontSize="lg">{qTextEn?.question_text}</Text>
                                        {qTextEn?.image_url && <Image src={qTextEn.image_url} maxH="200px" borderRadius="md" />}
                                    </VStack>
                                    <Separator my={2} />
                                    <VStack gap={3} align="stretch">
                                        {q.option?.map(opt => {
                                            const optTextEn = opt.optiontext?.find(ot => ot.language_code === 'en') || opt.optiontext?.[0]
                                            const isSelected = studentOptId === opt.option_id
                                            const isRightAns = opt.is_correct

                                            let bg = "transparent", borderColor = "border.muted", textColor = "fg.default"
                                            if (isSelected && isRightAns) { bg = "green.100"; borderColor = "green.500"; textColor = "green.800" }
                                            else if (isSelected && !isRightAns) { bg = "red.100"; borderColor = "red.500"; textColor = "red.800" }
                                            else if (!isSelected && isRightAns) { bg = "green.50"; borderColor = "green.300"; textColor = "green.700" }

                                            return (
                                                <Box key={opt.option_id} p={3} borderRadius="md" border="1px solid" borderColor={borderColor} bg={bg}>
                                                    <HStack gap={3}>
                                                        {isSelected && isRightAns ? <CheckCircle2 color="green"/> : isSelected && !isRightAns ? <XCircle color="red"/> : isRightAns ? <CheckCircle2 color="green"/> : <Box w="24px"/>}
                                                        <VStack align="start" flex={1} gap={1}>
                                                            <Text color={textColor} fontWeight={isSelected || isRightAns ? "bold" : "normal"}>{optTextEn?.option_text}</Text>
                                                            {optTextEn?.image_url && <Image src={optTextEn.image_url} maxH="80px" borderRadius="sm" />}
                                                        </VStack>
                                                        {isSelected && !isRightAns && <Badge colorPalette="red">Your Answer</Badge>}
                                                        {isRightAns && <Badge colorPalette="green">Correct Answer</Badge>}
                                                    </HStack>
                                                </Box>
                                            )
                                        })}
                                    </VStack>
                                </VStack>
                            </Card.Body>
                        </Card.Root>
                    )
                })}
            </VStack>
        </Box>
    )
}