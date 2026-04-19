import { useEffect, useState, useCallback } from "react"
import {
  Box, Grid, Heading, Text, VStack, Card, Spinner, Flex, Badge, HStack, Separator,
  Dialog, Input, Button
} from "@chakra-ui/react"
import { useNavigate } from "react-router"
import { Calendar, Hash, ArrowRight, BookOpen, Plus } from "lucide-react"
import { useStudent } from "../../../contexts/StudentContext"
import { supabase } from "../../../lib/supabase"
import { Branding } from "../../../components/ui/branding"
import { Toaster, toaster } from "../../../components/ui/toaster"

export function Dashboard() {
  const { user } = useStudent()
  const navigate = useNavigate()

  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)

  // --- Join Batch State ---
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)
  const [joinCode, setJoinCode] = useState("")
  const [joinLoading, setJoinLoading] = useState(false)

  const fetchBatches = useCallback(async () => {
    if (!user) return;
    setLoading(true)
    const { data, error } = await supabase
      .from('batchstudent')
      .select(`
        batch:batch_id ( batch_id, batch_name, description, batch_code, created_at )
      `)
      .eq('student_id', user.user_id)
      .eq('status', 'approved') // Only approved students

    if (!error && data) {
      const userBatches = data.map(item => item.batch).filter(Boolean).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setBatches(userBatches)
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchBatches()
  }, [fetchBatches])

  // --- Join Batch Logic ---
  const handleJoinBatch = async () => {
    if (!joinCode.trim()) {
      return toaster.create({ title: "Please enter a batch code", type: "error" })
    }

    setJoinLoading(true)

    try {
      // 1. Verify the code and get the batch_id
      const { data: batchData, error: batchError } = await supabase
        .from('batch')
        .select('batch_id, batch_name')
        .eq('batch_code', joinCode.trim())
        .single()

      if (batchError || !batchData) {
        throw new Error("Invalid batch code. Please check and try again.")
      }

      const targetBatchId = batchData.batch_id

      // 2. Check if the user already has a record in this batch
      const { data: existingRecord } = await supabase
        .from('batchstudent')
        .select('status, is_blocked, removed_by_teacher')
        .eq('batch_id', targetBatchId)
        .eq('student_id', user.user_id)
        .maybeSingle()

      if (existingRecord) {
        // Check for bans / removals
        if (existingRecord.is_blocked || existingRecord.status === 'removed' || existingRecord.status === 'rejected') {
          throw new Error("You do not have permission to join this batch.")
        }
        if (existingRecord.status === 'approved') {
          throw new Error("You are already enrolled in this batch.")
        }

        // If they previously 'left' or 'requested', update them to approved
        const { error: updateError } = await supabase
          .from('batchstudent')
          .update({
            status: 'approved',
            joined_at: new Date().toISOString()
          })
          .match({ batch_id: targetBatchId, student_id: user.user_id })

        if (updateError) throw updateError

      } else {
        // 3. No existing record, insert a new one
        const { error: insertError } = await supabase
          .from('batchstudent')
          .insert({
            batch_id: targetBatchId,
            student_id: user.user_id,
            status: 'approved' // Automatically approve via code
          })

        if (insertError) throw insertError
      }

      toaster.create({ title: `Successfully joined ${batchData.batch_name}!`, type: "success" })
      setIsJoinModalOpen(false)
      setJoinCode("")
      fetchBatches() // Refresh the dashboard

    } catch (error) {
      toaster.create({ title: error.message, type: "error" })
    } finally {
      setJoinLoading(false)
    }
  }

  if (loading) return <Flex w="full" h="100vh" justify="center" align="center"><Spinner size="xl" color="blue.500" /></Flex>

  return (
    <Box p={{ base: 4, md: 8 }}>
      <Toaster />
      <Branding />

      {/* Header Area */}
      <Flex justify="space-between" align="center" mb={8}>
        <Heading size="2xl">My Batches</Heading>
        <Button colorPalette="blue" onClick={() => setIsJoinModalOpen(true)}>
          <Plus size={18} /> Join Batch
        </Button>
      </Flex>

      {/* Batches Grid */}
      {batches.length === 0 ? (
        <Flex border="2px dashed" borderColor="border.muted" borderRadius="xl" h="300px" justify="center" align="center" bg="bg.subtle" direction="column" gap={4}>
          <Box p={4} bg="bg.panel" borderRadius="full" shadow="sm"><BookOpen size={32} color="gray" /></Box>
          <VStack gap={1}>
            <Heading size="md">Not enrolled yet</Heading>
            <Text color="fg.muted">Click 'Join Batch' and enter your Guru's code.</Text>
          </VStack>
        </Flex>
      ) : (
        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={6}>
          {batches.map((batch) => (
            <Card.Root key={batch.batch_id} variant="outline" cursor="pointer" onClick={() => navigate(`/student/batch/${batch.batch_id}`)} _hover={{ borderColor: "blue.400", transform: "translateY(-4px)", shadow: "md" }} transition="all 0.2s">
              <Card.Body p={6}>
                <Flex justify="space-between" align="start" mb={3}>
                  <Heading size="md" lineClamp={1}>{batch.batch_name}</Heading>
                  <HStack>
                    <Badge size="md" variant="subtle" colorPalette="blue">
                      <Hash size={12} />{batch.batch_code}
                    </Badge>
                  </HStack>
                </Flex>
                <Text fontSize="sm" color="fg.muted" lineClamp={2} h="2.5em">{batch.description || "No description."}</Text>
              </Card.Body>
              <Separator />
              <Card.Footer px={6} py={3} bg="bg.subtle">
                <Flex justify="space-between" align="center" w="full">
                  <HStack gap={2} color="fg.subtle"><Calendar size={14} /><Text fontSize="xs">{new Date(batch.created_at).toLocaleDateString()}</Text></HStack>
                  <HStack gap={1} color="blue.500" fontWeight="semibold" fontSize="xs"><Text>Enter Batch</Text><ArrowRight size={12} /></HStack>
                </Flex>
              </Card.Footer>
            </Card.Root>
          ))}
        </Grid>
      )}

      {/* --- Join Batch Modal --- */}
      <Dialog.Root open={isJoinModalOpen} onOpenChange={(e) => {
        setIsJoinModalOpen(e.open)
        if (!e.open) setJoinCode("")
      }}>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Join a Batch</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Text mb={4} color="fg.muted" fontSize="sm">
                Ask your Guru for the unique batch code, then enter it below.
              </Text>
              <Input
                placeholder="e.g. AFKESF"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                autoFocus
              />
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={() => setIsJoinModalOpen(false)}>Cancel</Button>
              <Button
                colorPalette="blue"
                disabled={!joinCode.trim()}
                loading={joinLoading}
                onClick={handleJoinBatch}
              >
                Join
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

    </Box>
  )
}