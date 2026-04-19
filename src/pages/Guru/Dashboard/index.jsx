import { useEffect, useState } from "react"
import { 
  Box, 
  Grid, 
  Heading, 
  Text, 
  VStack, 
  Card, 
  Spinner, 
  Flex, 
  Badge, 
  HStack, 
  Button,
  Separator,
  Dialog,
  Input,
  Textarea,
  Field
} from "@chakra-ui/react"
import { useNavigate } from "react-router"
import { 
  Plus, 
  Calendar, 
  Hash, 
  ArrowRight, 
  Users 
} from "lucide-react"
import { useGuru } from "../../../contexts/GuruContext"
import { supabase } from "../../../lib/supabase"
import { Toaster, toaster } from "../../../components/ui/toaster" 

export function Dashboard() {
  const { user } = useGuru() 
  const navigate = useNavigate()
  
  // Data State
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({ name: "", description: "" })

// --- Fetch Batches ---
  useEffect(() => {
    const fetchBatches = async () => {
      if (!user) return;

      // 1. Fetch from batchteacher and join the batch details
      const { data, error } = await supabase
        .from('batchteacher')
        .select(`
          batch:batch_id (
            batch_id,
            batch_name,
            description,
            batch_code,
            created_at,
            created_by
          )
        `)
        .eq('teacher_id', user.user_id)

      if (!error && data) {
        // 2. Flatten the nested structure: data is [{ batch: {...} }, { batch: {...} }]
        // We filter out any null results just in case of data inconsistency
        const userBatches = data
          .map(item => item.batch)
          .filter(batch => batch !== null)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        setBatches(userBatches)
      } else {
        console.error("Error fetching batches:", error)
      }
      setLoading(false)
    }

    fetchBatches()
  }, [user])

// --- Create Batch Logic ---
  const handleCreateBatch = async () => {
    if (!formData.name.trim()) return;
    
    setIsCreating(true)
    
    // Generate a random 6-character alphanumeric code
    const generatedCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const newBatch = {
        batch_name: formData.name,
        description: formData.description,
        batch_code: generatedCode,
        created_by: user.user_id
    }

    // 1. Create the Batch
    const { data: batchData, error: batchError } = await supabase
        .from('batch')
        .insert([newBatch])
        .select()

    if (batchError) {
        console.error("Error creating batch", batchError)
        toaster.create({ title: "Error creating batch", type: "error" })
        setIsCreating(false)
        return
    }

    // 2. If Batch created successfully, insert into batchteacher
    if (batchData && batchData.length > 0) {
        const createdBatch = batchData[0]

        const { error: relationError } = await supabase
            .from('batchteacher')
            .insert([{
                batch_id: createdBatch.batch_id,
                teacher_id: user.user_id,
                role: 1
            }])

        if (relationError) {
            console.error("Error assigning teacher role", relationError)
            toaster.create({ title: "Batch created, but teacher assignment failed", type: "warning" })
        } else {
            toaster.create({ title: "Batch created successfully", type: "success" })
        }

        // Update local state regardless of relation error (since batch exists now)
        setBatches([createdBatch, ...batches])
        setFormData({ name: "", description: "" })
        setIsModalOpen(false)
    }
    
    setIsCreating(false)
  }

  if (loading || !user) {
    return (
      <Flex w="full" h="100vh" justify="center" align="center">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    )
  }

  return (
    <Box p={{ base: 4, md: 8 }}>
      <Toaster />
      
      {/* Header Section */}
      <Flex justify="space-between" align="center" mb={8}>
        <VStack align="start" gap={0}>
            <Heading size="2xl">Dashboard</Heading>
        </VStack>

        {/* --- Create Batch Modal --- */}
        <Dialog.Root open={isModalOpen} onOpenChange={(e) => setIsModalOpen(e.open)}>
            <Dialog.Trigger asChild>
                <Button colorPalette="blue">
                    <Plus size={16} /> New Batch
                </Button>
            </Dialog.Trigger>
            <Dialog.Backdrop />
            
            <Dialog.Positioner>
                <Dialog.Content>
                    <Dialog.Header>
                        <Dialog.Title fontSize="lg">Create New Batch</Dialog.Title>
                    </Dialog.Header>
                    
                    <Dialog.Body>
                        <VStack gap={5}>
                            <Field.Root>
                                <Field.Label fontWeight="medium">Batch Name</Field.Label>
                                <Input 
                                    size="md"
                                    placeholder="e.g. Physics Class 101" 
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                />
                            </Field.Root>
                            
                            <Field.Root>
                                <Field.Label fontWeight="medium">Description (Optional)</Field.Label>
                                <Textarea 
                                    size="md"
                                    placeholder="Brief description about this batch..." 
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value.slice(0, 150)})}
                                />
                                <Field.HelperText>Max 150 characters. {150 - formData.description.length} left.</Field.HelperText>
                            </Field.Root>
                        </VStack>
                    </Dialog.Body>

                    <Dialog.Footer>
                        <Button variant="outline" disabled={isCreating} onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button 
                            colorPalette="blue"
                            onClick={handleCreateBatch} 
                            loading={isCreating}
                            disabled={!formData.name.trim()}
                        >
                            Create Batch
                        </Button>
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog.Positioner>
        </Dialog.Root>
      </Flex>

      {/* Empty State */}
      {batches.length === 0 ? (
        <Flex 
            border="2px dashed" 
            borderColor="border.muted" 
            borderRadius="xl" 
            h="300px" 
            justify="center" 
            align="center"
            bg="bg.subtle"
            direction="column"
            gap={4}
        >
            <Box p={4} bg="bg.panel" borderRadius="full" shadow="sm">
                <Users size={32} color="gray" />
            </Box>
            <VStack gap={1}>
                <Heading size="md">No batches found</Heading>
                <Text color="fg.muted">Create your first batch to get started!</Text>
            </VStack>
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)}>
                Create Batch
            </Button>
        </Flex>
      ) : (
        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={6}>
          {batches.map((batch) => (
            <Card.Root 
                key={batch.batch_id} 
                variant="outline"
                overflow="hidden"
                cursor="pointer"
                onClick={() => navigate(`/guru/batch/${batch.batch_id}`)}
                transition="all 0.2s ease-in-out"
                borderColor="border.muted"
                bg="bg.panel"
                _hover={{ 
                    borderColor: "blue.400", 
                    transform: "translateY(-4px)", 
                    shadow: "md" 
                }}
            >
              <Card.Body p={6}>
                 <Flex justify="space-between" align="start" mb={3}>
                    <Heading size="md" lineClamp={1} title={batch.batch_name} mr={4}>
                        {batch.batch_name || "Unnamed Batch"}
                    </Heading>

                    <Badge 
                        size="md" 
                        variant="subtle" 
                        colorPalette="blue" 
                        px={2} 
                        py={1}
                        borderRadius="md"
                        whiteSpace="nowrap"
                    >
                        <Hash size={12} style={{ marginRight: '4px', display: 'inline' }} />
                        {batch.batch_code || "N/A"}
                    </Badge>
                 </Flex>

                 <Text fontSize="sm" color="fg.muted" lineClamp={2} h="2.5em">
                    {batch.description || "No description provided."}
                 </Text>
              </Card.Body>

              <Separator borderColor="border.subtle" />

              <Card.Footer px={6} py={3} bg="bg.subtle">
                <Flex justify="space-between" align="center" w="full">
                    <HStack gap={2} color="fg.subtle">
                        <Calendar size={14} />
                        <Text fontSize="xs" fontWeight="medium">
                            {new Date(batch.created_at).toLocaleDateString(undefined, {
                                month: 'short', day: 'numeric', year: 'numeric'
                            })}
                        </Text>
                    </HStack>

                    <HStack 
                        gap={1} 
                        color="blue.500" 
                        fontWeight="semibold" 
                        fontSize="xs"
                        _groupHover={{ color: "blue.600" }}
                    >
                        <Text>View</Text>
                        <ArrowRight size={12} />
                    </HStack>
                </Flex>
              </Card.Footer>
            </Card.Root>
          ))}
        </Grid>
      )}
    </Box>
  )
}