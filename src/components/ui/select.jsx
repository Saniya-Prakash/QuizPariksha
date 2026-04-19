import { Select as ChakraSelect, Portal } from "@chakra-ui/react"
import * as React from "react"

export const SelectRoot = React.forwardRef(function SelectRoot(props, ref) {
  return (
    <ChakraSelect.Root
      {...props}
      ref={ref}
      positioning={{ gutter: 4, ...props.positioning }}
    >
      {props.asChild ? (
        props.children
      ) : (
        <>
          <ChakraSelect.HiddenSelect />
          {props.children}
        </>
      )}
    </ChakraSelect.Root>
  )
})

export const SelectTrigger = React.forwardRef(function SelectTrigger(
  props,
  ref,
) {
  return (
    <ChakraSelect.Control>
      <ChakraSelect.Trigger {...props} ref={ref}>
        {props.children}
        <ChakraSelect.IndicatorGroup>
          <ChakraSelect.Indicator />
        </ChakraSelect.IndicatorGroup>
      </ChakraSelect.Trigger>
    </ChakraSelect.Control>
  )
})

export const SelectContent = React.forwardRef(function SelectContent(
  props,
  ref,
) {
  const { portalled = true, portalRef, ...rest } = props
  return (
    <Portal disabled={!portalled} container={portalRef}>
      <ChakraSelect.Positioner>
        <ChakraSelect.Content {...rest} ref={ref} />
      </ChakraSelect.Positioner>
    </Portal>
  )
})

export const SelectItem = React.forwardRef(function SelectItem(props, ref) {
  const { item, children, ...rest } = props
  return (
    <ChakraSelect.Item item={item} {...rest} ref={ref}>
      {children ? children : <ChakraSelect.ItemText>{item.label}</ChakraSelect.ItemText>}
      <ChakraSelect.ItemIndicator />
    </ChakraSelect.Item>
  )
})

export const SelectValueText = ChakraSelect.ValueText
export const SelectLabel = ChakraSelect.Label
export const SelectControl = ChakraSelect.Control