import { useState, useMemo, useRef, useEffect } from "react"
import {
    Box, Flex, Heading, Button, Input, VStack, HStack, Text, IconButton,
    Card, Grid, createListCollection, Textarea, Badge, Separator, Image, Dialog, Spinner
} from "@chakra-ui/react"
import { Field } from "../../../components/ui/field"
import {
    SelectRoot, SelectTrigger, SelectValueText, SelectContent, SelectItem, SelectControl
} from "../../../components/ui/select"
import { Switch } from "../../../components/ui/switch"
import { Toaster, toaster } from "../../../components/ui/toaster"
import { Plus, Trash2, Save, CheckCircle2, Circle, ArrowLeft, ArrowRight, Upload, Sparkles, PencilRuler, Image as ImageIcon, FileText, Download } from "lucide-react"
import { useGuru } from "../../../contexts/GuruContext"
import { useParams, useNavigate } from "react-router"
import { supabase } from "../../../lib/supabase"
import * as XLSX from "xlsx"

export function QuizBuilder() {
    const { batchid, quizType } = useParams()
    const navigate = useNavigate()
    const { user } = useGuru()

    const excelInputRef = useRef(null)
    const imageInputRef = useRef(null)
    const aiFileInputRef = useRef(null)

    const initialQuizType = (quizType === "live" || quizType === "practice") ? quizType : "practice"
    const isGlobal = !batchid

    // --- State ---
    const [step, setStep] = useState(1)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [useSecondaryLang, setUseSecondaryLang] = useState(false)
    const [batchName, setBatchName] = useState("")
    const [uploadTarget, setUploadTarget] = useState(null) 

    // --- Modal States ---
    const [isAiModalOpen, setIsAiModalOpen] = useState(false)
    const [isExcelModalOpen, setIsExcelModalOpen] = useState(false)

    // --- AI Generator State ---
    const [aiFile, setAiFile] = useState(null)
    const [numAiQuestions, setNumAiQuestions] = useState(5)
    const [isGeneratingAi, setIsGeneratingAi] = useState(false)

    // --- Fetch Batch Name ---
    useEffect(() => {
        const fetchBatchDetails = async () => {
            if (isGlobal) return
            const { data, error } = await supabase.from('batch').select('batch_name').eq('batch_id', batchid).single()
            if (data && !error) setBatchName(data.batch_name)
        }
        fetchBatchDetails()
    }, [batchid, isGlobal])

    // --- Select Collections ---
    const quizTypes = useMemo(() => createListCollection({ items: [{ label: "Practice", value: "practice" }, { label: "Live", value: "live" }] }), [])
    const classes = useMemo(() => createListCollection({ items: [{ label: "Class 10", value: "10" }, { label: "Class 11", value: "11" }, { label: "Class 12", value: "12" }, { label: "JEE", value: "jee" }, { label: "NEET", value: "neet" }] }), [])

    // --- Form State ---
    const [formDetails, setFormDetails] = useState({
        title: "", subject: "", class: ["10"], quiz_type: [initialQuizType], duration_minutes: 30, start_date: "", start_time: ""
    })

    // --- Questions State ---
    const createDefaultOptions = () => [
        { id: Date.now() + "1", isCorrect: true, textEn: "", textLocal: "", imageFileEn: null, imagePreviewEn: "", imageFileLocal: null, imagePreviewLocal: "" },
        { id: Date.now() + "2", isCorrect: false, textEn: "", textLocal: "", imageFileEn: null, imagePreviewEn: "", imageFileLocal: null, imagePreviewLocal: "" },
        { id: Date.now() + "3", isCorrect: false, textEn: "", textLocal: "", imageFileEn: null, imagePreviewEn: "", imageFileLocal: null, imagePreviewLocal: "" },
        { id: Date.now() + "4", isCorrect: false, textEn: "", textLocal: "", imageFileEn: null, imagePreviewEn: "", imageFileLocal: null, imagePreviewLocal: "" }
    ]

    const [questions, setQuestions] = useState([{
        id: Date.now().toString(), type: ["MultipleChoice"], marks: 1, isRequired: true,
        textEn: "", textLocal: "", imageFileEn: null, imagePreviewEn: "", imageFileLocal: null, imagePreviewLocal: "",
        options: createDefaultOptions()
    }])

    // --- Image Selection Logic ---
    const triggerImageUpload = (qId, optId = null, lang = 'En') => {
        setUploadTarget({ qId, optId, lang })
        imageInputRef.current?.click()
    }

    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (!file || !uploadTarget) return

        const { qId, optId, lang } = uploadTarget
        const isOption = Boolean(optId); 
        const MAX_FILE_SIZE = isOption ? 250 * 1024 : 1 * 1024 * 1024; 
        const sizeLabel = isOption ? "250KB" : "1MB";
        const targetLabel = isOption ? "Option" : "Question";

        if (file.size > MAX_FILE_SIZE) {
            toaster.create({ title: `${targetLabel} image too large`, description: `Please upload an image smaller than ${sizeLabel}.`, type: "error" })
            setUploadTarget(null)
            e.target.value = null 
            return
        }

        const previewUrl = URL.createObjectURL(file)

        if (isOption) {
            setQuestions(qs => qs.map(q => {
                if (q.id === qId) {
                    return { ...q, options: q.options.map(o => o.id === optId ? { ...o, [`imageFile${lang}`]: file, [`imagePreview${lang}`]: previewUrl } : o) }
                }
                return q
            }))
        } else {
            setQuestions(qs => qs.map(q => q.id === qId ? { ...q, [`imageFile${lang}`]: file, [`imagePreview${lang}`]: previewUrl } : q))
        }

        setUploadTarget(null)
        e.target.value = null 
    }

    // --- Excel Parsing Logic ---
    const handleDownloadTemplate = () => {
        const templateData = [{
            "Question": "What is the capital of France?",
            "Option 1": "London",
            "Option 2": "Paris",
            "Option 3": "Berlin",
            "Option 4": "Madrid",
            "CorrectOption": 2,
            "Marks": 1,
            "QuestionLocal": "फ्रांस की राजधानी क्या है?",
            "Option 1 (Local)": "लंदन",
            "Option 2 (Local)": "पेरिस",
            "Option 3 (Local)": "बर्लिन",
            "Option 4 (Local)": "मैड्रिड"
        }];

        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, "Quiz_Template.xlsx");
    }

    const handleExcelUpload = (e) => {
        const file = e.target.files[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result
                const wb = XLSX.read(bstr, { type: 'binary' })
                const wsname = wb.SheetNames[0]
                const ws = wb.Sheets[wsname]
                const data = XLSX.utils.sheet_to_json(ws)

                const parsedQuestions = data.map((row, index) => {
                    const correctIdx = parseInt(row.CorrectOption) || 1
                    return {
                        id: Date.now().toString() + index, type: ["MultipleChoice"], marks: row.Marks || 1, isRequired: true,
                        textEn: row.Question || "", textLocal: row.QuestionLocal || "",
                        imageFileEn: null, imagePreviewEn: "", imageFileLocal: null, imagePreviewLocal: "",
                        options: [
                            { id: `o1_${index}`, isCorrect: correctIdx === 1, textEn: row['Option 1'] || "", textLocal: row['Option 1 (Local)'] || "", imageFileEn: null, imagePreviewEn: "", imageFileLocal: null, imagePreviewLocal: "" },
                            { id: `o2_${index}`, isCorrect: correctIdx === 2, textEn: row['Option 2'] || "", textLocal: row['Option 2 (Local)'] || "", imageFileEn: null, imagePreviewEn: "", imageFileLocal: null, imagePreviewLocal: "" },
                            { id: `o3_${index}`, isCorrect: correctIdx === 3, textEn: row['Option 3'] || "", textLocal: row['Option 3 (Local)'] || "", imageFileEn: null, imagePreviewEn: "", imageFileLocal: null, imagePreviewLocal: "" },
                            { id: `o4_${index}`, isCorrect: correctIdx === 4, textEn: row['Option 4'] || "", textLocal: row['Option 4 (Local)'] || "", imageFileEn: null, imagePreviewEn: "", imageFileLocal: null, imagePreviewLocal: "" },
                        ]
                    }
                })

                if (parsedQuestions.length > 0) {
                    setQuestions(parsedQuestions)
                    toaster.create({ title: `Successfully parsed ${parsedQuestions.length} questions`, type: "success" })
                    setIsExcelModalOpen(false)
                    setStep(2)
                } else toaster.create({ title: "Excel sheet appears empty or invalid format", type: "error" })
            } catch (err) {
                toaster.create({ title: "Failed to parse Excel file", type: "error" })
            }
        }
        reader.readAsBinaryString(file)
        e.target.value = null
    }

    // --- AI Generator Logic ---
    const handleAiFileSelect = (e) => {
        const file = e.target.files[0]
        if (!file) return
        if (file.size > 12 * 1024 * 1024) {
            toaster.create({ title: "File too large", description: "Please upload a document under 12MB.", type: "error" })
            e.target.value = null
            return
        }
        setAiFile(file)
    }

    const handleAiGenerate = async () => {
        if (!aiFile) {
            return toaster.create({ title: "No file selected", type: "error" })
        }

        setIsGeneratingAi(true)
        toaster.create({ title: "Generating Questions...", description: "This may take 10-30 seconds depending on document size.", type: "info" })

        try {
            const formData = new FormData()
            formData.append("file", aiFile)
            formData.append("num_questions", numAiQuestions)

            const response = await fetch("https://quiz-forge-rust.vercel.app/generate", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${import.meta.env.VITE_FLASK_API_SECRET}`
                },
                body: formData
            })

            if (!response.ok) {
                const errData = await response.json()
                throw new Error(errData.error || "Failed to generate questions")
            }

            const data = await response.json()
            
            if (!data.questions || data.questions.length === 0) {
                throw new Error("AI returned no valid questions.")
            }

            const aiQuestions = data.questions.map((q, index) => {
                return {
                    id: Date.now().toString() + index, 
                    type: ["MultipleChoice"], 
                    marks: 1, 
                    isRequired: true,
                    textEn: q.question || "", 
                    textLocal: "",
                    imageFileEn: null, imagePreviewEn: "", 
                    imageFileLocal: null, imagePreviewLocal: "",
                    options: [
                        { id: `o1_${index}`, isCorrect: q.correct_option === 0, textEn: q.options[0] || "", textLocal: "", imageFileEn: null, imagePreviewEn: "", imageFileLocal: null, imagePreviewLocal: "" },
                        { id: `o2_${index}`, isCorrect: q.correct_option === 1, textEn: q.options[1] || "", textLocal: "", imageFileEn: null, imagePreviewEn: "", imageFileLocal: null, imagePreviewLocal: "" },
                        { id: `o3_${index}`, isCorrect: q.correct_option === 2, textEn: q.options[2] || "", textLocal: "", imageFileEn: null, imagePreviewEn: "", imageFileLocal: null, imagePreviewLocal: "" },
                        { id: `o4_${index}`, isCorrect: q.correct_option === 3, textEn: q.options[3] || "", textLocal: "", imageFileEn: null, imagePreviewEn: "", imageFileLocal: null, imagePreviewLocal: "" },
                    ]
                }
            })

            setQuestions(aiQuestions)
            if(data.quiz_title) setFormDetails(prev => ({...prev, title: data.quiz_title}))

            toaster.create({ title: `Successfully generated ${aiQuestions.length} questions!`, type: "success" })
            setIsAiModalOpen(false)
            setAiFile(null)
            if (aiFileInputRef.current) aiFileInputRef.current.value = null
            setStep(2)

        } catch (error) {
            console.error("AI Gen Error:", error)
            toaster.create({ title: "AI Generation Failed", description: error.message, type: "error" })
        } finally {
            setIsGeneratingAi(false)
        }
    }

    // --- Question Handlers ---
    const addQuestion = () => setQuestions([...questions, { id: Date.now().toString(), type: ["MultipleChoice"], marks: 1, isRequired: true, textEn: "", textLocal: "", imageFileEn: null, imagePreviewEn: "", imageFileLocal: null, imagePreviewLocal: "", options: createDefaultOptions() }])
    const removeQuestion = (qId) => setQuestions(questions.filter(q => q.id !== qId))
    const updateQuestion = (qId, field, value) => setQuestions(questions.map(q => q.id === qId ? { ...q, [field]: value } : q))
    const addOption = (qId) => setQuestions(questions.map(q => q.id === qId ? { ...q, options: [...q.options, { id: Date.now().toString(), isCorrect: false, textEn: "", textLocal: "", imageFileEn: null, imagePreviewEn: "", imageFileLocal: null, imagePreviewLocal: "" }] } : q))
    const removeOption = (qId, optId) => setQuestions(questions.map(q => q.id === qId ? { ...q, options: q.options.filter(o => o.id !== optId) } : q))

    const updateOption = (qId, optId, field, value) => {
        setQuestions(questions.map(q => {
            if (q.id === qId) {
                const newOptions = q.options.map(o => {
                    if (o.id === optId) return { ...o, [field]: value }
                    if (field === 'isCorrect' && value === true) return { ...o, isCorrect: false }
                    return o
                })
                return { ...q, options: newOptions }
            }
            return q
        }))
    }

    const uploadQuizImage = async (file) => {
        if (!file) return null
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `images/${fileName}`

        const { error: uploadError } = await supabase.storage.from('quiz-media').upload(filePath, file)
        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage.from('quiz-media').getPublicUrl(filePath)
        return publicUrl
    }

    const handleProceedToSettings = () => {
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];

            const hasQContentEn = q.textEn.trim() !== "" || q.imageFileEn !== null;
            if (!hasQContentEn) return toaster.create({ title: `Validation Error`, description: `Question ${i + 1} is missing English content.`, type: "error" });

            if (useSecondaryLang) {
                const hasQContentLocal = q.textLocal.trim() !== "" || q.imageFileLocal !== null;
                if (!hasQContentLocal) return toaster.create({ title: `Validation Error`, description: `Question ${i + 1} is missing Local Language content.`, type: "error" });
            }

            let hasCorrectOption = false;
            for (let j = 0; j < q.options.length; j++) {
                const opt = q.options[j];
                if (opt.isCorrect) hasCorrectOption = true;

                const hasOptContentEn = opt.textEn.trim() !== "" || opt.imageFileEn !== null;
                if (!hasOptContentEn) return toaster.create({ title: `Validation Error`, description: `Option ${j + 1} in Question ${i + 1} is missing English content.`, type: "error" });

                if (useSecondaryLang) {
                    const hasOptContentLocal = opt.textLocal.trim() !== "" || opt.imageFileLocal !== null;
                    if (!hasOptContentLocal) return toaster.create({ title: `Validation Error`, description: `Option ${j + 1} in Question ${i + 1} is missing Local content.`, type: "error" });
                }
            }

            if (!hasCorrectOption) return toaster.create({ title: `Validation Error`, description: `Question ${i + 1} must have a correct option selected.`, type: "error" });
        }
        setStep(3);
    }

    const handleSaveQuiz = async () => {
        if (!formDetails.title || !formDetails.subject) return toaster.create({ title: "Title and Subject are required", type: "error" })
        const isLive = formDetails.quiz_type[0] === 'live'
        if (isLive && (!formDetails.start_date || !formDetails.start_time)) return toaster.create({ title: "Start Date and Time required for Live Quizzes", type: "error" })

        setIsSubmitting(true)
        toaster.create({ title: "Publishing quiz...", description: "Uploading media and saving questions.", type: "info" })

        try {
            const processedQuestions = await Promise.all(questions.map(async (q) => {
                const uploadedQImgEn = q.imageFileEn ? await uploadQuizImage(q.imageFileEn) : null
                const uploadedQImgLocal = (useSecondaryLang && q.imageFileLocal) ? await uploadQuizImage(q.imageFileLocal) : null

                const processedOptions = await Promise.all(q.options.map(async (o) => {
                    const uploadedOImgEn = o.imageFileEn ? await uploadQuizImage(o.imageFileEn) : null
                    const uploadedOImgLocal = (useSecondaryLang && o.imageFileLocal) ? await uploadQuizImage(o.imageFileLocal) : null

                    return {
                        is_correct: o.isCorrect,
                        textEn: o.textEn, textLocal: o.textLocal,
                        imageUrlEn: uploadedOImgEn, imageUrlLocal: uploadedOImgLocal
                    }
                }))

                return {
                    question_type: q.type[0], is_required: q.isRequired, marks: parseFloat(q.marks),
                    textEn: q.textEn, textLocal: q.textLocal,
                    imageUrlEn: uploadedQImgEn, imageUrlLocal: uploadedQImgLocal,
                    options: processedOptions
                }
            }))

            const payload = {
                form: {
                    title: formDetails.title, subject: formDetails.subject, class: formDetails.class[0], quiz_type: formDetails.quiz_type[0],
                    duration_minutes: parseInt(formDetails.duration_minutes), created_by: user.user_id, status: 'published',
                    ...(isLive && { start_date: formDetails.start_date, start_time: formDetails.start_time })
                },
                batch: isGlobal ? [] : [{ batch_id: batchid }],
                questions: processedQuestions.map(q => {
                    return {
                        question: { question_type: q.question_type, is_required: q.is_required, marks: q.marks },
                        questionTexts: [
                            { language_code: 'en', question_text: q.textEn, image_url: q.imageUrlEn },
                            { language_code: 'hi', question_text: useSecondaryLang ? q.textLocal : "", image_url: useSecondaryLang ? q.imageUrlLocal : null }
                        ],
                        options: q.options.map(o => ({ is_correct: o.is_correct })),
                        optionTexts: q.options.flatMap(o => [
                            { language_code: 'en', option_text: o.textEn, image_url: o.imageUrlEn },
                            { language_code: 'hi', option_text: useSecondaryLang ? o.textLocal : "", image_url: useSecondaryLang ? o.imageUrlLocal : null }
                        ])
                    }
                })
            }

            // const response = await fetch("https://vhighahragcgqndcsxmn.supabase.co/functions/v1/upload_quiz", {
            //     method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
            // })
            // const response = await supabase.functions.invoke('upload_quiz', {
            //     body: payload,
            // })
            // if (!response.ok) throw new Error(await response.text())
            const { data, error } = await supabase.functions.invoke('upload-quiz', {
                body: payload,
            })
            if (error) throw new Error(error.message)

            toaster.create({ title: "Quiz Created Successfully!", type: "success" })
            setTimeout(() => navigate(isGlobal ? '/guru/quizzes' : `/guru/batch/${batchid}`), 1500)
        } catch (error) {
            console.error("Submission failed:", error)
            toaster.create({ title: "Failed to create quiz", description: error.message, type: "error" })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Box w="full" p={{ base: 4, md: 8 }} maxW="1000px" mx="auto">
            <Toaster />

            {/* Hidden Inputs for File Uploads */}
            <input type="file" accept=".xlsx, .xls" ref={excelInputRef} style={{ display: "none" }} onChange={handleExcelUpload} />
            <input type="file" accept="image/*" ref={imageInputRef} style={{ display: "none" }} onChange={handleImageChange} />

            {/* HEADER */}
            <Flex justify="space-between" align="center" bg="bg.panel" p={6} borderRadius="lg" border="1px solid" borderColor="border.muted" mb={8}>
                <VStack align="start" gap={1}>
                    <Heading size="xl" fontWeight="bold">
                        {step === 1 ? `Choose Method | ${isGlobal ? 'Global' : (batchName || "Batch")}` :
                            step === 2 ? `Build Questions | ${isGlobal ? 'Global' : (batchName || "Batch")}` :
                                `Quiz Settings | ${isGlobal ? 'Global' : (batchName || "Batch")}`}
                    </Heading>
                    <Text color="fg.muted" fontSize="sm">
                        {step === 1 ? "Select how you want to generate your quiz questions." :
                            step === 2 ? "Add options, set correct answers, and assign marks." :
                                "Configure the final details before publishing."}
                    </Text>
                </VStack>

                <HStack>
                    {step === 1 && <Button variant="outline" onClick={() => navigate(isGlobal ? '/guru/quizzes' : `/guru/batch/${batchid}`)}>Cancel</Button>}
                    {step === 2 && (
                        <>
                            <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft size={16} /> Back</Button>
                            <Button colorPalette="blue" onClick={handleProceedToSettings}>Next: Settings <ArrowRight size={16} /></Button>                        </>
                    )}
                    {step === 3 && (
                        <>
                            <Button variant="outline" onClick={() => setStep(2)}><ArrowLeft size={16} /> Back</Button>
                            <Button colorPalette="green" onClick={handleSaveQuiz} loading={isSubmitting}><Save size={16} /> Publish Quiz</Button>
                        </>
                    )}
                </HStack>
            </Flex>

            {/* ================= STEP 1: CHOOSE METHOD ================= */}
            {step === 1 && (
                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr 1fr" }} gap={4}>
                    <Card.Root variant="outline" cursor="pointer" _hover={{ borderColor: "blue.500", bg: "blue.50", _dark: { bg: "whiteAlpha.100" } }} onClick={() => setIsExcelModalOpen(true)}>
                        <Card.Body as={VStack} gap={3} py={10} textAlign="center">
                            <Upload size={32} color="var(--chakra-colors-blue-500)" />
                            <Heading size="sm">Upload Excel</Heading>
                            <Text fontSize="xs" color="fg.muted">Parse a spreadsheet directly into the builder.</Text>
                        </Card.Body>
                    </Card.Root>

                    <Card.Root variant="outline" cursor="pointer" _hover={{ borderColor: "purple.500", bg: "purple.50", _dark: { bg: "whiteAlpha.100" } }} onClick={() => setIsAiModalOpen(true)}>
                        <Card.Body as={VStack} gap={3} py={10} textAlign="center" position="relative">
                            <Sparkles size={32} color="var(--chakra-colors-purple-500)" />
                            <Heading size="sm">Use AI</Heading>
                            <Text fontSize="xs" color="fg.muted">Generate questions from a document.</Text>
                        </Card.Body>
                    </Card.Root>

                    <Card.Root variant="outline" cursor="pointer" _hover={{ borderColor: "green.500", bg: "green.50", _dark: { bg: "whiteAlpha.100" } }} onClick={() => setStep(2)}>
                        <Card.Body as={VStack} gap={3} py={10} textAlign="center">
                            <PencilRuler size={32} color="var(--chakra-colors-green-500)" />
                            <Heading size="sm">Create Myself</Heading>
                            <Text fontSize="xs" color="fg.muted">Start from scratch using the interactive form.</Text>
                        </Card.Body>
                    </Card.Root>
                </Grid>
            )}

            {/* ================= STEP 2: QUESTION BUILDER ================= */}
            {step === 2 && (
                <VStack gap={6} align="stretch">
                    <Box bg="bg.panel" p={4} borderRadius="lg" border="1px solid" borderColor="border.muted">
                        <Switch checked={useSecondaryLang} onCheckedChange={(e) => setUseSecondaryLang(e.checked)}>
                            Use secondary language (Hindi) for questions and options?
                        </Switch>
                    </Box>

                    {questions.map((q, index) => (
                        <Card.Root key={q.id} variant="outline" borderColor="border.muted">
                            <Card.Header display="flex" flexDirection="row" justifyContent="space-between" alignItems="center" bg="gray.50" _dark={{ bg: "whiteAlpha.50" }} py={3}>
                                <Heading size="sm" m={0}>Question {index + 1}</Heading>
                                <HStack gap={4} align="center">
                                    <HStack gap={2} align="center">
                                        <Text fontSize="xs" fontWeight="bold" color="fg.muted">Marks</Text>
                                        <Input type="number" w="70px" size="sm" textAlign="center" value={q.marks} onChange={e => updateQuestion(q.id, 'marks', e.target.value)} />
                                    </HStack>
                                    <Badge colorPalette="blue" size="md" px={3} h="32px" display="flex" alignItems="center" borderRadius="md">Multiple Choice</Badge>
                                    <IconButton size="sm" variant="ghost" colorPalette="red" onClick={() => removeQuestion(q.id)} disabled={questions.length === 1}><Trash2 size={18} /></IconButton>
                                </HStack>
                            </Card.Header>

                            <Card.Body>
                                <VStack gap={4} align="stretch">
                                    <Grid templateColumns={useSecondaryLang ? "1fr 1fr" : "1fr"} gap={4}>
                                        {/* English Question Input */}
                                        <VStack align="stretch" gap={1}>
                                            <Text fontSize="xs" fontWeight="bold" color="fg.muted">Question {useSecondaryLang ? "(English)" : ""}</Text>
                                            <HStack align="start">
                                                <Textarea placeholder="Type question here..." value={q.textEn} onChange={e => updateQuestion(q.id, 'textEn', e.target.value)} rows={2} flex={1} />
                                                <VStack>
                                                    {q.imagePreviewEn && <Image src={q.imagePreviewEn} boxSize="36px" objectFit="cover" borderRadius="md" border="1px solid" borderColor="border.muted" />}
                                                    <IconButton size="sm" variant="ghost" onClick={() => triggerImageUpload(q.id, null, 'En')}>
                                                        <ImageIcon size={16} />
                                                    </IconButton>
                                                </VStack>
                                            </HStack>
                                        </VStack>

                                        {/* Local Question Input */}
                                        {useSecondaryLang && (
                                            <VStack align="stretch" gap={1}>
                                                <Text fontSize="xs" fontWeight="bold" color="fg.muted">Question (Local Language)</Text>
                                                <HStack align="start">
                                                    <Textarea placeholder="प्रश्न यहाँ टाइप करें..." value={q.textLocal} onChange={e => updateQuestion(q.id, 'textLocal', e.target.value)} rows={2} flex={1} />
                                                    <VStack>
                                                        {q.imagePreviewLocal && <Image src={q.imagePreviewLocal} boxSize="36px" objectFit="cover" borderRadius="md" border="1px solid" borderColor="border.muted" />}
                                                        <IconButton size="sm" variant="ghost" onClick={() => triggerImageUpload(q.id, null, 'Local')}>
                                                            <ImageIcon size={16} />
                                                        </IconButton>
                                                    </VStack>
                                                </HStack>
                                            </VStack>
                                        )}
                                    </Grid>

                                    {/* Options Section */}
                                    <Box mt={4} pl={4} borderLeft="2px solid" borderColor="blue.200">
                                        <Text fontSize="sm" fontWeight="bold" mb={3}>Options</Text>
                                        <VStack gap={3} align="stretch">
                                            {q.options.map((opt, oIndex) => (
                                                <Box
                                                    key={opt.id} p={2} borderRadius="md" transition="all 0.2s"
                                                    bg={opt.isCorrect ? "green.50" : "transparent"}
                                                    _dark={{ bg: opt.isCorrect ? "green.900" : "transparent" }}
                                                    border="1px solid"
                                                    borderColor={opt.isCorrect ? "green.400" : "transparent"}
                                                >
                                                    <Grid templateColumns={useSecondaryLang ? "auto 1fr 1fr auto" : "auto 1fr auto"} gap={3} alignItems="center">

                                                        <IconButton size="sm" variant="ghost" colorPalette={opt.isCorrect ? "green" : "gray"} onClick={() => updateOption(q.id, opt.id, 'isCorrect', !opt.isCorrect)}>
                                                            {opt.isCorrect ? <CheckCircle2 fill="currentColor" /> : <Circle />}
                                                        </IconButton>

                                                        {/* English Option */}
                                                        <HStack>
                                                            <Input size="sm" placeholder={`Option ${oIndex + 1} ${useSecondaryLang ? '(English)' : ''}`} value={opt.textEn} onChange={e => updateOption(q.id, opt.id, 'textEn', e.target.value)} bg="bg.panel" />
                                                            {opt.imagePreviewEn && <Image src={opt.imagePreviewEn} boxSize="32px" objectFit="cover" borderRadius="sm" border="1px solid" borderColor="border.muted" />}
                                                            <IconButton size="sm" variant="ghost" onClick={() => triggerImageUpload(q.id, opt.id, 'En')}><ImageIcon size={14} /></IconButton>
                                                        </HStack>

                                                        {/* Local Option */}
                                                        {useSecondaryLang && (
                                                            <HStack>
                                                                <Input size="sm" placeholder={`Option ${oIndex + 1} (Local)`} value={opt.textLocal} onChange={e => updateOption(q.id, opt.id, 'textLocal', e.target.value)} bg="bg.panel" />
                                                                {opt.imagePreviewLocal && <Image src={opt.imagePreviewLocal} boxSize="32px" objectFit="cover" borderRadius="sm" border="1px solid" borderColor="border.muted" />}
                                                                <IconButton size="sm" variant="ghost" onClick={() => triggerImageUpload(q.id, opt.id, 'Local')}><ImageIcon size={14} /></IconButton>
                                                            </HStack>
                                                        )}

                                                        <IconButton size="sm" variant="ghost" colorPalette="red" onClick={() => removeOption(q.id, opt.id)} disabled={q.options.length <= 2}>
                                                            <Trash2 size={14} />
                                                        </IconButton>
                                                    </Grid>
                                                </Box>
                                            ))}
                                            <Button size="sm" variant="ghost" alignSelf="flex-start" onClick={() => addOption(q.id)} mt={2}><Plus size={14} /> Add Option</Button>
                                        </VStack>
                                    </Box>
                                </VStack>
                            </Card.Body>
                        </Card.Root>
                    ))}
                    <Button variant="outline" borderStyle="dashed" borderWidth="2px" h="60px" onClick={addQuestion}><Plus size={18} /> Add Another Question</Button>
                </VStack>
            )}

            {/* ================= STEP 3: SETTINGS ================= */}
            {step === 3 && (
                <VStack gap={8} align="stretch">
                    <Box bg="bg.panel" p={6} borderRadius="lg" border="1px solid" borderColor="border.muted">
                        <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4} mb={6}>
                            <VStack align="stretch" gap={1}><Text fontSize="xs" fontWeight="bold" color="fg.muted">Quiz Title</Text><Input placeholder="e.g., Weekly Physics Test" value={formDetails.title} onChange={e => setFormDetails({ ...formDetails, title: e.target.value })} fontWeight="bold" /></VStack>
                            <VStack align="stretch" gap={1}><Text fontSize="xs" fontWeight="bold" color="fg.muted">Subject</Text><Input placeholder="e.g., Physics" value={formDetails.subject} onChange={e => setFormDetails({ ...formDetails, subject: e.target.value })} /></VStack>
                            <HStack>
                                <VStack align="stretch" gap={1} flex={1}>
                                    <Text fontSize="xs" fontWeight="bold" color="fg.muted">Class Level</Text>
                                    <SelectRoot collection={classes} value={formDetails.class} onValueChange={e => setFormDetails({ ...formDetails, class: e.value })}><SelectControl><SelectTrigger><SelectValueText placeholder="Select..." /></SelectTrigger></SelectControl><SelectContent>{classes.items.map(c => <SelectItem item={c} key={c.value}>{c.label}</SelectItem>)}</SelectContent></SelectRoot>
                                </VStack>
                                <VStack align="stretch" gap={1} flex={1}>
                                    <Text fontSize="xs" fontWeight="bold" color="fg.muted">Quiz Type</Text>
                                    <SelectRoot collection={quizTypes} value={formDetails.quiz_type} onValueChange={e => setFormDetails({ ...formDetails, quiz_type: e.value })}><SelectControl><SelectTrigger><SelectValueText placeholder="Select..." /></SelectTrigger></SelectControl><SelectContent>{quizTypes.items.map(t => <SelectItem item={t} key={t.value}>{t.label}</SelectItem>)}</SelectContent></SelectRoot>
                                </VStack>
                            </HStack>
                            <VStack align="stretch" gap={1}><Text fontSize="xs" fontWeight="bold" color="fg.muted">Duration (Minutes)</Text><Input type="number" placeholder="30" value={formDetails.duration_minutes} onChange={e => setFormDetails({ ...formDetails, duration_minutes: e.target.value })} /></VStack>
                            {formDetails.quiz_type[0] === 'live' && (
                                <>
                                    <VStack align="start" gap={1}><Text fontSize="xs" fontWeight="bold" color="fg.muted">Live Start Date</Text><Input type="date" value={formDetails.start_date} onChange={e => setFormDetails({ ...formDetails, start_date: e.target.value })} /></VStack>
                                    <VStack align="start" gap={1}><Text fontSize="xs" fontWeight="bold" color="fg.muted">Live Start Time</Text><Input type="time" value={formDetails.start_time} onChange={e => setFormDetails({ ...formDetails, start_time: e.target.value })} /></VStack>
                                </>
                            )}
                        </Grid>
                    </Box>
                </VStack>
            )}

            {/* ================= MODALS ================= */}

            {/* Excel Instructions & Upload Modal */}
            <Dialog.Root open={isExcelModalOpen} onOpenChange={(e) => setIsExcelModalOpen(e.open)}>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Header>
                            <Dialog.Title display="flex" alignItems="center" gap={2}>
                                <Upload size={20} color="var(--chakra-colors-blue-500)"/> Excel Upload Instructions
                            </Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body>
                            <VStack align="stretch" gap={5}>
                                <Text color="fg.muted" fontSize="sm">
                                    To successfully upload your questions, your Excel file <strong>must</strong> have the exact column headers below. 
                                </Text>
                                
                                <Box bg="bg.subtle" p={4} borderRadius="md" border="1px solid" borderColor="border.muted">
                                    <Text fontSize="xs" fontWeight="bold" mb={2}>Required Columns:</Text>
                                    <Flex flexWrap="wrap" gap={2}>
                                        <Badge colorPalette="blue">Question</Badge>
                                        <Badge colorPalette="gray">Option 1</Badge>
                                        <Badge colorPalette="gray">Option 2</Badge>
                                        <Badge colorPalette="gray">Option 3</Badge>
                                        <Badge colorPalette="gray">Option 4</Badge>
                                        <Badge colorPalette="green">CorrectOption</Badge>
                                        <Badge colorPalette="purple">Marks</Badge>
                                    </Flex>

                                    <Text fontSize="xs" fontWeight="bold" mt={4} mb={2}>Optional Local Language Columns:</Text>
                                    <Flex flexWrap="wrap" gap={2}>
                                        <Badge colorPalette="orange" variant="subtle">QuestionLocal</Badge>
                                        <Badge colorPalette="gray" variant="subtle">Option 1 (Local)</Badge>
                                        <Badge colorPalette="gray" variant="subtle">Option 2 (Local)</Badge>
                                        <Badge colorPalette="gray" variant="subtle">Option 3 (Local)</Badge>
                                        <Badge colorPalette="gray" variant="subtle">Option 4 (Local)</Badge>
                                    </Flex>
                                </Box>

                                <Button variant="outline" w="full" onClick={handleDownloadTemplate}>
                                    <Download size={16} /> Download Template Format
                                </Button>
                            </VStack>
                        </Dialog.Body>
                        <Dialog.Footer>
                            <Button variant="ghost" onClick={() => setIsExcelModalOpen(false)}>Cancel</Button>
                            <Button colorPalette="blue" onClick={() => excelInputRef.current?.click()}>
                                Select Excel File
                            </Button>
                        </Dialog.Footer>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Dialog.Root>

            {/* AI GENERATION MODAL */}
            <Dialog.Root open={isAiModalOpen} onOpenChange={(e) => {
                setIsAiModalOpen(e.open)
                if(!e.open) { setAiFile(null); if (aiFileInputRef.current) aiFileInputRef.current.value = null; }
            }}>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Header>
                            <Dialog.Title display="flex" alignItems="center" gap={2}>
                                <Sparkles size={20} color="var(--chakra-colors-purple-500)"/> AI Quiz Generator
                            </Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body>
                            <VStack align="stretch" gap={5}>
                                <Text color="fg.muted" fontSize="sm">
                                    Upload a PDF, Word Document, or Text file. Our AI will automatically extract the content and generate multiple choice questions for you.
                                </Text>

                                <Box 
                                    borderWidth="2px" borderStyle="dashed" borderColor="border.muted" borderRadius="lg" p={6} 
                                    textAlign="center" cursor="pointer" _hover={{ borderColor: "purple.500", bg: "purple.50", _dark: { bg: "whiteAlpha.100"} }}
                                    onClick={() => aiFileInputRef.current?.click()}
                                >
                                    <VStack gap={2}>
                                        <FileText size={32} color="var(--chakra-colors-fg-muted)" />
                                        {aiFile ? (
                                            <Text fontWeight="bold" color="purple.600">{aiFile.name}</Text>
                                        ) : (
                                            <>
                                                <Text fontWeight="bold">Click to Upload Document</Text>
                                                <Text fontSize="xs" color="fg.muted">.pdf, .docx, .txt (Max 12MB)</Text>
                                            </>
                                        )}
                                    </VStack>
                                    <input 
                                        type="file" accept=".pdf,.docx,.txt" ref={aiFileInputRef} 
                                        style={{ display: "none" }} onChange={handleAiFileSelect} 
                                    />
                                </Box>

                                <Field label="Number of Questions to Generate">
                                    <Input 
                                        type="number" min={1} max={20} value={numAiQuestions} 
                                        onChange={(e) => setNumAiQuestions(e.target.value)} 
                                    />
                                </Field>

                                {isGeneratingAi && (
                                    <HStack justify="center" p={4} color="purple.600">
                                        <Spinner size="sm" />
                                        <Text fontSize="sm" fontWeight="bold">Reading document & generating magic...</Text>
                                    </HStack>
                                )}
                            </VStack>
                        </Dialog.Body>
                        <Dialog.Footer>
                            <Button variant="outline" onClick={() => setIsAiModalOpen(false)} disabled={isGeneratingAi}>Cancel</Button>
                            <Button colorPalette="purple" onClick={handleAiGenerate} loading={isGeneratingAi} disabled={!aiFile}>
                                Generate Questions
                            </Button>
                        </Dialog.Footer>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Dialog.Root>
        </Box>
    )
}
