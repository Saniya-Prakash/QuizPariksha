import { VStack, Heading, Separator } from "@chakra-ui/react"


export const Branding = () => {
    return (
        <VStack align="start" mb={6} gap={0} w="full">
            <Heading 
                size="sm" 
                fontWeight="black" 
                textTransform="uppercase" 
                letterSpacing="widest" 
                bgGradient="to-r" 
                gradientFrom="blue.600" 
                gradientTo="purple.600" 
                bgClip="text"
            >
                Quiz Pariksha
            </Heading>
            <Separator mt={2} borderColor="blue.100" />
        </VStack>
    )
}
