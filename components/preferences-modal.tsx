"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog"

export interface DietPreferences {
  dietOptions: string[]
  ageGroup: string
  gender: string
}

interface PreferencesModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (preferences: DietPreferences) => void
  initialPreferences?: DietPreferences
}

const DefaultDietOptions = ["Dairy", "Plants", "Legumes", "Meat", "Fish", "Eggs", "Nuts"]
const DefaultAgeOptions = ["4 to 8", "9 to 13", "14 to 50", "51 and above"]
const DEFAULT_GENDERS = ["Male", "Female"]

export function PreferencesModal({ isOpen, onClose, onSave, initialPreferences }: PreferencesModalProps) {
  const [formData, setFormData] = useState<DietPreferences>({
    dietOptions: initialPreferences?.dietOptions || [...DefaultDietOptions],
    ageGroup: initialPreferences?.ageGroup || "",
    gender: initialPreferences?.gender || "",
  })

  useEffect(() => {
    if (initialPreferences) {
      setFormData(initialPreferences)
    }
  }, [initialPreferences])

  const handleDietToggle = (option: string) => {
    setFormData((prev) => ({
      ...prev,
      dietOptions: prev.dietOptions.includes(option)
        ? prev.dietOptions.filter((item) => item !== option)
        : [...prev.dietOptions, option],
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Diet Preferences</DialogTitle>
            <DialogClose />
          </DialogHeader>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">Diet Options</label>
              <div className="grid grid-cols-4 gap-2">
                {DefaultDietOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleDietToggle(option)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      formData.dietOptions.includes(option)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">Age Group</label>
              <div className="space-y-2">
                {DefaultAgeOptions.map((group) => (
                  <label key={group} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="ageGroup"
                      value={group}
                      checked={formData.ageGroup === group}
                      onChange={(e) => setFormData((prev) => ({ ...prev, ageGroup: e.target.value }))}
                      className="w-4 h-4 accent-primary"
                    />
                    <span className="text-foreground">{group}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">Gender</label>
              <div className="space-x-2 flex flex-row">
                {DEFAULT_GENDERS.map((gender) => (
                  <label key={gender} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value={gender}
                      checked={formData.gender === gender}
                      onChange={(e) => setFormData((prev) => ({ ...prev, gender: e.target.value }))}
                      className="w-4 h-4 accent-primary"
                    />
                    <span className="text-foreground">{gender}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={!formData.ageGroup || !formData.gender || formData.dietOptions.length === 0}
              className="w-full bg-primary text-primary-foreground py-2 rounded-md font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Save Preferences
            </button>
          </form>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}
