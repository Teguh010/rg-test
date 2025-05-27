import React, { useState, useCallback, useRef } from 'react'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deselectCustomer } from '@/models/manager/session'
import { useUser } from '@/context/UserContext'
import { useSelectedCustomerStore } from '@/store/selected-customer'
import toast from 'react-hot-toast'

const CustomSelect = ({
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  label = undefined,
  disabled = false,
  className,
  onClear 
}) => {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef(null)
  const { operations: { getUserRef } } = useUser()
  const { clearSelectedCustomer } = useSelectedCustomerStore()

  const handleClear = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    onClear?.()
    
    const currentUser = getUserRef()
    if (!currentUser?.token) return

    try {
      const response = await deselectCustomer(currentUser.token)
      if (response?.success) {
        clearSelectedCustomer()
        toast.success(t("success.customer_deselected"))
      } else {
        toast.error(t("error.deselect_customer"))
      }
    } catch (error) {
      console.error('Error deselecting customer:', error)
      toast.error(t("error.deselect_customer"))
    }
  }

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSearchChange = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setSearchQuery(e.target.value)
  }, [])

  const handleInputClick = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    inputRef.current?.focus()
  }, [])

  const handleSelectChange = useCallback((val) => {
    onChange(val)
    setOpen(false)
    setSearchQuery('')
  }, [onChange])

  return (
    <div className={className}>
      {label && <label className='block text-sm font-small text-gray-500'>{label}</label>}
      <div className='relative'>
        <Select
          value={value}
          onValueChange={handleSelectChange}
          disabled={disabled}
          open={open}
          onOpenChange={setOpen}
        >
          <SelectTrigger className='px-2 border rounded-md w-full my-0 py-0 h-8'>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent
            onCloseAutoFocus={(e) => e.preventDefault()}
            onInteractOutside={(e) => {
              const target = e.target
              if (target.closest('.select-search-input')) {
                e.preventDefault()
              }
            }}
            position='popper'
            sideOffset={5}
          >
            <div
              className='px-2 py-2 sticky top-0 bg-background z-10'
              onClick={handleInputClick}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <Input
                ref={inputRef}
                placeholder={t('Search...')}
                value={searchQuery}
                onChange={handleSearchChange}
                className='h-8 w-full select-search-input'
                autoComplete='off'
                onKeyDown={(e) => {
                  e.stopPropagation()
                  if (e.key === 'Escape') {
                    setOpen(false)
                  }
                }}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                autoFocus
              />
            </div>
            <ScrollArea className='h-[200px]'>
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className='cursor-pointer'
                    onFocus={(e) => {
                      e.preventDefault()
                      inputRef.current?.focus()
                    }}
                    onClick={(e) => {
                      e.preventDefault()
                      handleSelectChange(option.value)
                    }}
                  >
                    {option.label}
                  </SelectItem>
                ))
              ) : (
                <div className='py-2 px-2 text-sm text-gray-500'>{t('No results found')}</div>
              )}
            </ScrollArea>
          </SelectContent>
        </Select>
        {value && (
          <div
            className='absolute top-1/2 right-6 -translate-y-1/2 p-1 z-10'
            onClick={handleClear}
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
          >
            <X className='h-4 w-4 cursor-pointer text-gray-500 hover:text-gray-600' />
          </div>
        )}
      </div>
    </div>
  )
}

export default CustomSelect
