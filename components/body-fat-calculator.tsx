"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Dumbbell } from "lucide-react"

interface BodyFatResult {
  bodyFatPercentage: number
  fatMass: number
  leanMass: number
  category: string
}

export function BodyFatCalculator() {
  const [units, setUnits] = useState<"us" | "metric">("us")
  const [gender, setGender] = useState<"male" | "female">("female")
  const [weight, setWeight] = useState<number>(130)
  const [heightFt, setHeightFt] = useState<number>(5)
  const [heightIn, setHeightIn] = useState<number>(6)
  const [heightCm, setHeightCm] = useState<number>(168)
  const [waist, setWaist] = useState<number>(29)
  const [hip, setHip] = useState<number>(38)
  const [neck, setNeck] = useState<number>(12)
  const [result, setResult] = useState<BodyFatResult | null>(null)

  // Convert height to inches or cm based on units
  const getHeight = (): number => {
    if (units === "us") {
      return heightFt * 12 + heightIn
    } else {
      return heightCm
    }
  }

  // Calculate body fat percentage using US Navy formula
  const calculateBodyFat = () => {
    let bodyFatPercentage = 0
    const height = getHeight()

    if (gender === "male") {
      // Male formula: 86.010 × log10(waist - neck) - 70.041 × log10(height) + 36.76
      bodyFatPercentage = 86.01 * Math.log10(waist - neck) - 70.041 * Math.log10(height) + 36.76
    } else {
      // Female formula: 163.205 × log10(waist + hip - neck) - 97.684 × log10(height) - 78.387
      bodyFatPercentage = 163.205 * Math.log10(waist + hip - neck) - 97.684 * Math.log10(height) - 78.387
    }

    // Calculate fat mass and lean mass
    const weightInLbs = units === "us" ? weight : weight * 2.20462
    const fatMass = (bodyFatPercentage / 100) * weightInLbs
    const leanMass = weightInLbs - fatMass

    // Determine body fat category
    let category = "Unknown"
    if (gender === "female") {
      if (bodyFatPercentage < 14) category = "Essential Fat"
      else if (bodyFatPercentage < 21) category = "Athletes"
      else if (bodyFatPercentage < 25) category = "Fitness"
      else if (bodyFatPercentage < 32) category = "Acceptable"
      else category = "Obese"
    } else {
      if (bodyFatPercentage < 6) category = "Essential Fat"
      else if (bodyFatPercentage < 14) category = "Athletes"
      else if (bodyFatPercentage < 18) category = "Fitness"
      else if (bodyFatPercentage < 25) category = "Acceptable"
      else category = "Obese"
    }

    setResult({
      bodyFatPercentage: Math.round(bodyFatPercentage * 10) / 10,
      fatMass: Math.round(fatMass),
      leanMass: Math.round(leanMass),
      category,
    })
  }

  // Calculate on mount with default values
  useEffect(() => {
    calculateBodyFat()
  }, [])

  return (
    <Card>
      <CardHeader className="bg-gray-50 rounded-t-lg border-b">
        <CardTitle className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-gray-700" />
          Body Fat Calculator (US Navy Formula)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs defaultValue="calculator" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="calculator">Calculator</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          <TabsContent value="calculator">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <Label>Units</Label>
                  <div className="flex border rounded-md overflow-hidden">
                    <button
                      className={`px-4 py-2 text-sm ${
                        units === "us" ? "bg-gray-700 text-white" : "bg-white text-gray-700"
                      }`}
                      onClick={() => setUnits("us")}
                    >
                      US
                    </button>
                    <button
                      className={`px-4 py-2 text-sm ${
                        units === "metric" ? "bg-gray-700 text-white" : "bg-white text-gray-700"
                      }`}
                      onClick={() => setUnits("metric")}
                    >
                      Metric
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Gender</Label>
                  <div className="flex border rounded-md overflow-hidden">
                    <button
                      className={`px-4 py-2 text-sm ${
                        gender === "female" ? "bg-gray-700 text-white" : "bg-white text-gray-700"
                      }`}
                      onClick={() => setGender("female")}
                    >
                      Female
                    </button>
                    <button
                      className={`px-4 py-2 text-sm ${
                        gender === "male" ? "bg-gray-700 text-white" : "bg-white text-gray-700"
                      }`}
                      onClick={() => setGender("male")}
                    >
                      Male
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="weight">Weight {units === "us" ? "(lbs)" : "(kg)"}</Label>
                    <Input
                      id="weight"
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>

                  {units === "us" ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="height-ft">Height (ft)</Label>
                        <Input
                          id="height-ft"
                          type="number"
                          value={heightFt}
                          onChange={(e) => setHeightFt(Number(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="height-in">Height (in)</Label>
                        <Input
                          id="height-in"
                          type="number"
                          value={heightIn}
                          onChange={(e) => setHeightIn(Number(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="height-cm">Height (cm)</Label>
                      <Input
                        id="height-cm"
                        type="number"
                        value={heightCm}
                        onChange={(e) => setHeightCm(Number(e.target.value))}
                        className="mt-1"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="waist">Waist {units === "us" ? "(in)" : "(cm)"} (at narrowest)</Label>
                    <Input
                      id="waist"
                      type="number"
                      value={waist}
                      onChange={(e) => setWaist(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="hip">Hip {units === "us" ? "(in)" : "(cm)"} (at widest)</Label>
                    <Input
                      id="hip"
                      type="number"
                      value={hip}
                      onChange={(e) => setHip(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="neck">Neck {units === "us" ? "(in)" : "(cm)"} (at narrowest)</Label>
                    <Input
                      id="neck"
                      type="number"
                      value={neck}
                      onChange={(e) => setNeck(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <Button onClick={calculateBodyFat} className="w-full bg-gray-700 hover:bg-gray-800">
                Calculate
              </Button>

              {result && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-lg font-semibold mb-4">Results</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Body Fat</div>
                      <div className="text-2xl font-bold">{result.bodyFatPercentage}%</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Category</div>
                      <div className="text-2xl font-bold">{result.category}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Fat Mass</div>
                      <div className="text-2xl font-bold">{result.fatMass} lbs</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Lean Mass</div>
                      <div className="text-2xl font-bold">{result.leanMass} lbs</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="about">
            <div className="space-y-4">
              <p>
                The US Navy Body Fat formula is a method for estimating body fat percentage using only a tape measure.
                It's based on circumference measurements at specific body points.
              </p>

              <h3 className="font-semibold">How to measure:</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Waist:</strong> Measure at the narrowest point, usually around the navel.
                </li>
                <li>
                  <strong>Hip:</strong> Measure at the widest point around the buttocks.
                </li>
                <li>
                  <strong>Neck:</strong> Measure at the narrowest point, just below the larynx (Adam's apple).
                </li>
              </ul>

              <h3 className="font-semibold">The formulas used:</h3>
              <p>
                <strong>For men:</strong> % body fat = 86.010 × log10(waist - neck) - 70.041 × log10(height) + 36.76
              </p>
              <p>
                <strong>For women:</strong> % body fat = 163.205 × log10(waist + hip - neck) - 97.684 × log10(height) -
                78.387
              </p>

              <p>
                <strong>Note:</strong> This calculator provides an estimate and should not replace professional medical
                advice. For the most accurate body composition assessment, consider methods like DEXA scans or
                hydrostatic weighing.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
