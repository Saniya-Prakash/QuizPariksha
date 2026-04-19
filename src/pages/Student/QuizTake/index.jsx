import { useEffect, useState, useRef, useCallback } from "react"
import { useParams, useNavigate } from "react-router"
import {
    Box, Flex, Heading, Button, VStack, HStack, Text, Badge, Card, Spinner, Center, Image, Separator,
} from "@chakra-ui/react"
import { Toaster, toaster } from "../../../components/ui/toaster"
import { ArrowLeft, Send, Clock, Timer, Eraser } from "lucide-react"
import { supabase } from "../../../lib/supabase"
import { useStudent } from "../../../contexts/StudentContext"
import { parseQuizLocalStart, getLiveWindowEndMs } from "../../../utils/quizSchedule"

const TAB_SWITCH_LIMIT = 3
const AWAY_SUBMIT_MS = 30_000

function computeAttemptDeadlineMs(form) {
    const durationMs = (Number(form.duration_minutes) || 0) * 60000
    const now = Date.now()
    const liveEndMs = form.quiz_type === "live" ? getLiveWindowEndMs(form) : null
    const missedLiveMakeup = form.quiz_type === "live" && liveEndMs != null && now > liveEndMs
    if (form.quiz_type !== "live" || missedLiveMakeup) {
        return now + durationMs
    }
    const start = parseQuizLocalStart(form.start_date, form.start_time)
    if (!start || Number.isNaN(start.getTime())) return now + durationMs
    return start.getTime() + durationMs
}

function formatCountdown(totalSeconds) {
    const s = Math.max(0, totalSeconds)
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const r = s % 60
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`
    return `${m}:${String(r).padStart(2, "0")}`
}

export function QuizTake() {
    const { batchid, formId } = useParams()
    const navigate = useNavigate()
    const { user } = useStudent()
    const startedAtRef = useRef(Date.now())
    const deadlineMsRef = useRef(null)
    const timeUpSubmitOnceRef = useRef(false)
    const submitGuardRef = useRef(false)
    const tabLeaveCountRef = useRef(0)
    const awayTimerRef = useRef(null)

    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [quiz, setQuiz] = useState(null)
    const [questions, setQuestions] = useState([])
    const [selections, setSelections] = useState({})
    const [remainingSec, setRemainingSec] = useState(null)
    const [makeupFromLive, setMakeupFromLive] = useState(false)

    const submitAttemptRef = useRef(null)

    const loadQuiz = useCallback(async () => {
        if (!batchid || !formId || !user?.user_id) return
        setLoading(true)
        timeUpSubmitOnceRef.current = false
        try {
            const { data: link, error: linkErr } = await supabase
                .from("batchform")
                .select("batch_id")
                .eq("batch_id", batchid)
                .eq("form_id", formId)
                .maybeSingle()

            if (linkErr) throw linkErr
            if (!link) {
                toaster.create({ title: "Quiz not found in this batch", type: "error" })
                navigate(`/student/batch/${batchid}`, { replace: true })
                return
            }

            const { data: form, error: formErr } = await supabase
                .from("form")
                .select("*")
                .eq("form_id", formId)
                .eq("status", "published")
                .maybeSingle()

            if (formErr) throw formErr
            if (!form) {
                toaster.create({ title: "This quiz is not available", type: "error" })
                navigate(`/student/batch/${batchid}`, { replace: true })
                return
            }

            const { data: existing } = await supabase
                .from("response")
                .select("response_id")
                .eq("form_id", formId)
                .eq("user_id", user.user_id)
                .maybeSingle()

            if (existing?.response_id) {
                navigate(`/student/batch/${batchid}/quiz/${formId}/result/${existing.response_id}`, { replace: true })
                return
            }

            const now = new Date()
            let isMakeup = false
            if (form.quiz_type === "live") {
                const start = parseQuizLocalStart(form.start_date, form.start_time)
                if (!start || Number.isNaN(start.getTime())) {
                    toaster.create({ title: "This live quiz has no valid schedule", type: "error" })
                    navigate(-1)
                    return
                }
                const endMs = getLiveWindowEndMs(form)
                if (now < start) {
                    toaster.create({ title: "This test has not started yet", type: "info" })
                    navigate(-1)
                    return
                }
                if (endMs != null && now.getTime() > endMs) {
                    isMakeup = true
                    toaster.create({
                        title: "Make-up attempt",
                        description: "The live window ended. You can finish this as a timed practice attempt.",
                        type: "info",
                    })
                }
            }

            const { data: qData, error: qErr } = await supabase
                .from("question")
                .select("*, questiontext(*), option(*, optiontext(*))")
                .eq("form_id", formId)
                .order("created_at", { ascending: true })

            if (qErr) throw qErr
            if (!qData?.length) {
                toaster.create({ title: "This quiz has no questions yet", type: "error" })
                navigate(-1)
                return
            }

            const deadlineMs = computeAttemptDeadlineMs(form)
            deadlineMsRef.current = deadlineMs
            tabLeaveCountRef.current = 0
            if (awayTimerRef.current) {
                window.clearTimeout(awayTimerRef.current)
                awayTimerRef.current = null
            }

            setMakeupFromLive(isMakeup)
            setQuiz(form)
            setQuestions(qData)
            startedAtRef.current = Date.now()
            setRemainingSec(Math.max(0, Math.ceil((deadlineMs - Date.now()) / 1000)))
        } catch (e) {
            console.error(e)
            toaster.create({ title: "Failed to load quiz", description: e.message, type: "error" })
            navigate(-1)
        } finally {
            setLoading(false)
        }
    }, [batchid, formId, user?.user_id, navigate])

    useEffect(() => {
        loadQuiz()
    }, [loadQuiz])

    useEffect(() => {
        if (loading || !quiz) return

        const tick = () => {
            const end = deadlineMsRef.current
            if (end == null) return
            setRemainingSec(Math.max(0, Math.ceil((end - Date.now()) / 1000)))
        }

        tick()
        const id = window.setInterval(tick, 1000)
        return () => window.clearInterval(id)
    }, [loading, quiz?.form_id])

    const setOption = (questionId, optionId) => {
        setSelections((prev) => ({ ...prev, [questionId]: optionId }))
    }

    const clearSelection = (questionId) => {
        setSelections((prev) => {
            const next = { ...prev }
            delete next[questionId]
            return next
        })
    }

    const submitAttempt = useCallback(
        async ({ forceTimeUp = false, integrity } = {}) => {
            if (!quiz || !user?.user_id) return
            if (submitGuardRef.current) return
            submitGuardRef.current = true

            if (!forceTimeUp) {
                const unanswered = questions.filter((q) => q.is_required && !selections[q.question_id])
                if (unanswered.length) {
                    submitGuardRef.current = false
                    toaster.create({
                        title: "Please answer all required questions",
                        description: `${unanswered.length} required question(s) left.`,
                        type: "warning",
                    })
                    return
                }
            } else if (integrity === "tab3") {
                toaster.create({ title: "Too many tab switches — submitting your test", type: "warning" })
            } else if (integrity === "away30") {
                toaster.create({ title: "You were away too long — submitting your test", type: "warning" })
            } else if (integrity === "time" || !integrity) {
                toaster.create({ title: "Time is up — submitting your answers", type: "info" })
            }

            setSubmitting(true)
            try {
                let total = 0
                const answerRows = []

                for (const q of questions) {
                    const optId = selections[q.question_id]
                    if (!optId) continue
                    const selected = q.option?.find((o) => o.option_id === optId)
                    if (selected?.is_correct) total += parseFloat(q.marks || 0)
                    answerRows.push({
                        question_id: q.question_id,
                        option_id: optId,
                    })
                }

                const elapsedSec = Math.max(0, Math.round((Date.now() - startedAtRef.current) / 1000))
                const timeTaken = `${Math.floor(elapsedSec / 60)}m ${elapsedSec % 60}s`

                const { data: responseRow, error: respErr } = await supabase
                    .from("response")
                    .insert({
                        form_id: parseInt(formId, 10),
                        user_id: user.user_id,
                        total_score: total,
                        submitted_at: new Date().toISOString(),
                        time_taken: timeTaken,
                        status: "submitted",
                    })
                    .select("response_id")
                    .single()

                if (respErr) throw respErr

                const responseId = responseRow.response_id
                if (answerRows.length) {
                    const { error: ansErr } = await supabase.from("answer").insert(
                        answerRows.map((r) => ({
                            ...r,
                            response_id: responseId,
                        }))
                    )
                    if (ansErr) throw ansErr
                }

                toaster.create({ title: "Quiz submitted", type: "success" })
                navigate(`/student/batch/${batchid}/quiz/${formId}/result/${responseId}`, { replace: true })
            } catch (e) {
                console.error(e)
                toaster.create({ title: "Submit failed", description: e.message, type: "error" })
                submitGuardRef.current = false
                if (integrity === "time") timeUpSubmitOnceRef.current = false
            } finally {
                setSubmitting(false)
            }
        },
        [quiz, user?.user_id, questions, selections, formId, batchid, navigate]
    )

    submitAttemptRef.current = submitAttempt

    const handleSubmit = () => submitAttempt({ forceTimeUp: false })

    useEffect(() => {
        if (remainingSec !== 0 || submitting || !quiz || timeUpSubmitOnceRef.current) return
        timeUpSubmitOnceRef.current = true
        submitAttempt({ forceTimeUp: true, integrity: "time" })
    }, [remainingSec, submitting, quiz, submitAttempt])

    useEffect(() => {
        if (loading || !quiz) return

        const hasBeenVisibleRef = { current: document.visibilityState === "visible" }

        const runIntegritySubmit = (integrity) => {
            if (submitGuardRef.current) return
            submitAttemptRef.current?.({ forceTimeUp: true, integrity })
        }

        const onVisibility = () => {
            if (document.visibilityState === "visible") {
                hasBeenVisibleRef.current = true
                if (awayTimerRef.current) {
                    window.clearTimeout(awayTimerRef.current)
                    awayTimerRef.current = null
                }
                return
            }

            if (!hasBeenVisibleRef.current) return

            tabLeaveCountRef.current += 1
            if (awayTimerRef.current) window.clearTimeout(awayTimerRef.current)
            awayTimerRef.current = window.setTimeout(() => {
                awayTimerRef.current = null
                runIntegritySubmit("away30")
            }, AWAY_SUBMIT_MS)

            if (tabLeaveCountRef.current >= TAB_SWITCH_LIMIT) {
                if (awayTimerRef.current) {
                    window.clearTimeout(awayTimerRef.current)
                    awayTimerRef.current = null
                }
                runIntegritySubmit("tab3")
            }
        }

        document.addEventListener("visibilitychange", onVisibility)
        return () => {
            document.removeEventListener("visibilitychange", onVisibility)
            if (awayTimerRef.current) {
                window.clearTimeout(awayTimerRef.current)
                awayTimerRef.current = null
            }
        }
    }, [loading, quiz?.form_id])

    const urgent = remainingSec != null && remainingSec > 0 && remainingSec <= 60
    const danger = remainingSec != null && remainingSec > 0 && remainingSec <= 15

    if (loading) {
        return (
            <Center py={20}>
                <Spinner size="xl" color="blue.500" />
            </Center>
        )
    }

    if (!quiz) return null

    return (
        <Box w="full" p={{ base: 4, md: 8 }} maxW="1000px" mx="auto">
            <Toaster />

            <Flex
                justify="space-between"
                align="center"
                bg="bg.panel"
                p={6}
                borderRadius="lg"
                border="1px solid"
                borderColor="border.muted"
                mb={8}
                flexWrap="wrap"
                gap={4}
            >
                <VStack align="start" gap={2}>
                    <Button size="xs" variant="ghost" onClick={() => navigate(-1)} ml={-3}>
                        <ArrowLeft size={14} /> Back
                    </Button>
                    <Heading size="xl" fontWeight="black">
                        {quiz.title}
                    </Heading>
                    <HStack color="fg.muted" fontSize="sm" flexWrap="wrap">
                        <Clock size={14} />
                        <Text>{quiz.duration_minutes} minutes allowed</Text>
                        {quiz.quiz_type === "live" && !makeupFromLive && (
                            <Badge colorPalette="red" size="sm">
                                Live
                            </Badge>
                        )}
                        {makeupFromLive && (
                            <Badge colorPalette="purple" size="sm">
                                Make-up (after live window)
                            </Badge>
                        )}
                    </HStack>
                    <Text fontSize="xs" color="fg.muted" maxW="lg">
                        Stay on this tab: leaving {TAB_SWITCH_LIMIT} times or staying away over {AWAY_SUBMIT_MS / 1000}s will auto-submit.
                    </Text>
                </VStack>
                <HStack gap={3} flexWrap="wrap" justify="flex-end">
                    {remainingSec != null && (
                        <HStack
                            gap={2}
                            px={4}
                            py={2}
                            borderRadius="md"
                            border="2px solid"
                            borderColor={danger ? "red.500" : urgent ? "orange.400" : "blue.400"}
                            bg={danger ? "red.50" : urgent ? "orange.50" : "blue.50"}
                            _dark={{
                                borderColor: danger ? "red.400" : urgent ? "orange.300" : "blue.400",
                                bg: danger ? "red.950" : urgent ? "orange.950" : "blue.950",
                            }}
                        >
                            <Timer size={20} color={danger ? "var(--chakra-colors-red-600)" : undefined} />
                            <VStack align="start" gap={0}>
                                <Text fontSize="xs" fontWeight="bold" color="fg.muted" textTransform="uppercase">
                                    Time left
                                </Text>
                                <Text
                                    fontSize="2xl"
                                    fontWeight="black"
                                    fontVariantNumeric="tabular-nums"
                                    color={danger ? "red.600" : urgent ? "orange.700" : "blue.700"}
                                    lineHeight="1"
                                >
                                    {formatCountdown(remainingSec)}
                                </Text>
                            </VStack>
                        </HStack>
                    )}
                    <Button colorPalette="blue" onClick={handleSubmit} loading={submitting} disabled={submitting}>
                        <Send size={16} /> Submit test
                    </Button>
                </HStack>
            </Flex>

            <VStack gap={6} align="stretch">
                {questions.map((q, index) => {
                    const qTextEn = q.questiontext?.find((qt) => qt.language_code === "en") || q.questiontext?.[0]
                    const selected = selections[q.question_id]

                    return (
                        <Card.Root key={q.question_id} variant="outline" borderColor="border.muted">
                            <Card.Header
                                display="flex"
                                flexDirection="row"
                                justifyContent="space-between"
                                alignItems="center"
                                bg="gray.50"
                                py={3}
                                flexWrap="wrap"
                                gap={2}
                            >
                                <Badge size="lg" colorPalette="blue">
                                    Q{index + 1}
                                </Badge>
                                <HStack gap={2} flexWrap="wrap">
                                    <Text fontWeight="bold" color="fg.muted">
                                        {q.marks} marks{q.is_required ? " • Required" : ""}
                                    </Text>
                                    {selected != null && (
                                        <Button
                                            type="button"
                                            size="xs"
                                            variant="outline"
                                            colorPalette="gray"
                                            onClick={() => clearSelection(q.question_id)}
                                        >
                                            <Eraser size={14} style={{ marginRight: 4 }} />
                                            Clear choice
                                        </Button>
                                    )}
                                </HStack>
                            </Card.Header>
                            <Card.Body>
                                <VStack gap={4} align="stretch">
                                    <VStack align="start" gap={2}>
                                        <Text fontWeight="medium" fontSize="lg">
                                            {qTextEn?.question_text}
                                        </Text>
                                        {qTextEn?.image_url && (
                                            <Image src={qTextEn.image_url} maxH="200px" borderRadius="md" alt="" />
                                        )}
                                    </VStack>
                                    <Separator my={2} />
                                    <VStack gap={3} align="stretch">
                                        {q.option?.map((opt) => {
                                            const optTextEn =
                                                opt.optiontext?.find((ot) => ot.language_code === "en") ||
                                                opt.optiontext?.[0]
                                            const isSelected = selected === opt.option_id
                                            return (
                                                <Box
                                                    key={opt.option_id}
                                                    role="button"
                                                    tabIndex={0}
                                                    cursor="pointer"
                                                    onClick={() => setOption(q.question_id, opt.option_id)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter" || e.key === " ") {
                                                            e.preventDefault()
                                                            setOption(q.question_id, opt.option_id)
                                                        }
                                                    }}
                                                    p={3}
                                                    borderRadius="md"
                                                    border="2px solid"
                                                    borderColor={isSelected ? "blue.500" : "border.muted"}
                                                    bg={isSelected ? "blue.50" : "transparent"}
                                                    _hover={{ borderColor: "blue.300" }}
                                                >
                                                    <HStack gap={3} align="start">
                                                        <Box
                                                            w="18px"
                                                            h="18px"
                                                            borderRadius="full"
                                                            border="2px solid"
                                                            borderColor={isSelected ? "blue.600" : "border.muted"}
                                                            flexShrink={0}
                                                            mt={1}
                                                            display="flex"
                                                            alignItems="center"
                                                            justifyContent="center"
                                                        >
                                                            {isSelected && (
                                                                <Box w="8px" h="8px" borderRadius="full" bg="blue.600" />
                                                            )}
                                                        </Box>
                                                        <VStack align="start" flex={1} gap={1}>
                                                            <Text fontWeight={isSelected ? "semibold" : "normal"}>
                                                                {optTextEn?.option_text}
                                                            </Text>
                                                            {optTextEn?.image_url && (
                                                                <Image
                                                                    src={optTextEn.image_url}
                                                                    maxH="80px"
                                                                    borderRadius="sm"
                                                                    alt=""
                                                                />
                                                            )}
                                                        </VStack>
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

            <Flex justify="center" mt={10}>
                <Button size="lg" colorPalette="blue" onClick={handleSubmit} loading={submitting} disabled={submitting}>
                    <Send size={18} /> Submit test
                </Button>
            </Flex>
        </Box>
    )
}
