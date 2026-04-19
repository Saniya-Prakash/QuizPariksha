import { Field as ChakraField } from "@chakra-ui/react"
import * as React from "react"

export const Field = React.forwardRef(function Field(props, ref) {
  const { label, children, helperText, errorText, optionalText, ...rest } = props
  return (
    <ChakraField.Root ref={ref} {...rest}>
      {label && (
        <ChakraField.Label>
          {label}
          <ChakraField.RequiredIndicator fallback={optionalText} />
        </ChakraField.Label>
      )}
      {children}
      {helperText && (
        <ChakraField.HelperText>{helperText}</ChakraField.HelperText>
      )}
      {errorText && (
        <ChakraField.ErrorText>{errorText}</ChakraField.ErrorText>
      )}
    </ChakraField.Root>
  )
})

// Export the individual parts in case you need to compose them manually 
// (which you are doing in your Signup and Login pages!)
export const FieldRoot = ChakraField.Root
export const FieldErrorText = ChakraField.ErrorText
export const FieldHelperText = ChakraField.HelperText
export const FieldLabel = ChakraField.Label
export const FieldRequiredIndicator = ChakraField.RequiredIndicator