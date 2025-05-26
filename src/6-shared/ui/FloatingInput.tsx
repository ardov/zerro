import React, { useCallback, useEffect, useState } from 'react'
import { TextField, Box, Popover, PopoverProps } from '@mui/material'
import { useFormik } from 'formik'

export function useFloatingInput(
  ref: React.MutableRefObject<any>,
  onSubmit: (v: string) => void
) {
  const [value, setValue] = useState('')
  const [open, setOpen] = useState(false)

  const openInput = useCallback((val: string) => {
    setValue(val)
    setOpen(true)
  }, [])

  return {
    open: openInput,
    render: () => (
      <FloatingInput
        value={value}
        open={open}
        onSubmit={newVal => {
          setOpen(false)
          if (newVal !== value) onSubmit(newVal)
        }}
        anchorEl={ref.current}
      />
    ),
  }
}

function FloatingInput(props: {
  value: string
  open: boolean
  anchorEl?: PopoverProps['anchorEl']
  onSubmit: (v: string) => void
}) {
  const { value, onSubmit, open, anchorEl } = props

  const { values, handleSubmit, handleChange, setFieldValue, submitForm } =
    useFormik({
      initialValues: { name: value || '' },
      onSubmit: values => onSubmit(values.name),
      enableReinitialize: true,
    })

  useEffect(() => {
    if (open) setFieldValue('name', value)
  }, [open, setFieldValue, value])

  return (
    <Popover open={open} onClose={submitForm} anchorEl={anchorEl}>
      <Box component="form" onSubmit={handleSubmit} sx={{ p: 0, width: 280 }}>
        <TextField
          fullWidth
          autoFocus
          name="name"
          value={values.name}
          onChange={handleChange}
          onBlur={submitForm}
          slotProps={{ htmlInput: { autoComplete: 'off' } }}
        />
      </Box>
    </Popover>
  )
}
