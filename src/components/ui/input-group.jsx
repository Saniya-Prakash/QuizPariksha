import { Group, InputElement } from "@chakra-ui/react"
import * as React from "react"

export const InputGroup = React.forwardRef(function InputGroup(props, ref) {
  const {
    startElement,
    startElementProps,
    endElement,
    endElementProps,
    children,
    ...rest
  } = props

  return (
    <Group ref={ref} {...rest}>
      {startElement && (
        <InputElement placement="start" pointerEvents="none" {...startElementProps}>
          {startElement}
        </InputElement>
      )}
      
      {children}
      
      {endElement && (
        <InputElement placement="end" {...endElementProps}>
          {endElement}
        </InputElement>
      )}
    </Group>
  )
})