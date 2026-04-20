"use client"

import * as React from "react"
import { Check, PlusCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"

interface DataTableFacetedFilterProps {
  title?: string
  options: {
    label: string
    value: string
    icon?: React.ComponentType<{ className?: string }>
  }[]
  selectedValues?: string[]
  onSelect: (values: string[]) => void
}

export function DataTableFacetedFilter({
  title,
  options,
  selectedValues = [],
  onSelect,
}: DataTableFacetedFilterProps) {
  const selectedSet = new Set(selectedValues)

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="sm" className="h-7 border-none bg-transparent hover:bg-blue-50 text-blue-600 px-2 flex items-center gap-2 font-bold transition-all">
            <PlusCircle className="mr-0.5 h-3 w-3" />
            <span className="text-[10px] uppercase">{title}</span>
            {selectedValues.length > 0 && (
              <>
                <Separator orientation="vertical" className="mx-1 h-3 bg-blue-200" />
                <Badge
                  variant="secondary"
                  className="rounded-sm px-1 font-normal lg:hidden"
                >
                  {selectedValues.length}
                </Badge>
                <div className="hidden space-x-1 lg:flex">
                  {selectedValues.length > 2 ? (
                    <Badge
                      variant="secondary"
                      className="rounded-sm px-1 font-normal bg-blue-100 text-blue-700"
                    >
                      {selectedValues.length} selected
                    </Badge>
                  ) : (
                    options
                      .filter((option) => selectedSet.has(option.value))
                      .map((option) => (
                        <Badge
                          variant="secondary"
                          key={option.value}
                          className="rounded-sm px-1 font-normal bg-blue-100 text-blue-700 text-[9px]"
                        >
                          {option.label}
                        </Badge>
                      ))
                  )}
                </div>
              </>
            )}
          </Button>
        }
      />
      <PopoverContent className="w-[200px] p-0 bg-white" align="start">
        <Command className="bg-white">
          <CommandInput placeholder={title} />
          <CommandList className="bg-white">
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup className="bg-white">
              {options.map((option) => {
                const isSelected = selectedSet.has(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                      const newSelected = new Set(selectedSet)
                      if (isSelected) {
                        newSelected.delete(option.value)
                      } else {
                        newSelected.add(option.value)
                      }
                      onSelect(Array.from(newSelected))
                    }}
                    className="bg-white"
                  >
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <Check className={cn("h-4 w-4")} />
                    </div>
                    {option.icon && (
                      <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                    )}
                    <span>{option.label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {selectedValues.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => onSelect([])}
                    className="justify-center text-center bg-white"
                  >
                    Clear filters
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
