import { 
  Toaster as ChakraToaster, 
  Portal, 
  Spinner, 
  Stack, 
  Toast, 
  createToaster 
} from "@chakra-ui/react"

// 1. Create the toaster instance
export const toaster = createToaster({
  placement: "top-end", // Changed to Top Right
  pauseOnPageIdle: true,
})

// 2. Create the React Component to render in your app
export const Toaster = () => {
  return (
    <Portal>
      {/* Add pointerEvents="none" to let clicks pass through the invisible container */}
      <ChakraToaster 
        toaster={toaster} 
        insetInline={{ md: "2rem" }} 
        insetBlock={{ base: "1rem", md: "2rem" }}
        pointerEvents="none"
      >
        {(toast) => (
          <Toast.Root 
            width={{ md: "sm" }} 
            p={4} 
            shadow="md"
            pointerEvents="auto"
          >
            {/* Loading Spinner vs Standard Icon */}
            {toast.type === "loading" ? (
              <Spinner size="sm" color="blue.solid" />
            ) : (
              <Toast.Indicator />
            )}

            {/* Title & Description */}
            <Stack gap="1" flex="1" maxWidth="100%">
              {toast.title && <Toast.Title fontWeight="semibold">{toast.title}</Toast.Title>}
              {toast.description && (
                <Toast.Description color="fg.muted">{toast.description}</Toast.Description>
              )}
            </Stack>

            {/* Optional Action Button */}
            {toast.action && (
              <Toast.ActionTrigger>{toast.action.label}</Toast.ActionTrigger>
            )}
            
            {/* Close Button */}
            <Toast.CloseTrigger />
          </Toast.Root>
        )}
      </ChakraToaster>
    </Portal>
  )
}