"use client"

import { useState } from "react"
import { Search, Plus, ChevronDown, Download, Clock, CreditCard } from "lucide-react"
import { ClientInitials } from "@/components/shared/client-initials"
import { Button } from "@/components/ui/button"
import type React from "react"

interface FinancePageLayoutProps {
  children?: React.ReactNode
  className?: string
  isDemo?: boolean
}

export function FinancePageLayout({ children, className = "", isDemo = false }: FinancePageLayoutProps) {
  const [autoAdjustGoals, setAutoAdjustGoals] = useState(true)

  const getValue = (demoValue: string | number, emptyValue: string | number = "0") => {
    return isDemo ? demoValue : emptyValue
  }

  return (
    <div>
      {/* Main Content */}
      <div>
        {/* Search and Action Buttons */}
        <div className="pb-6">
          <div className="w-full flex justify-between items-center gap-4">
            <div className="flex gap-4 items-center">
              {/* Date Selector */}
              <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-lg border border-gray-200">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm">April 2025</span>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </div>

              {/* Search */}
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white rounded-lg border border-gray-200"
                />
              </div>
            </div>

            <div className="flex gap-3">
              {/* Export Button */}
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </Button>

              {/* New Invoice Button */}
              <Button className="bg-[#CCFF00] text-black hover:bg-[#b8e600] flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span>New Invoice</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Financial Overview Cards */}
        <div className="pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Revenue Card */}
            <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-600">Total Revenue</span>
                <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-3xl font-semibold">{getValue("€4,850", "€0")}</span>
                {isDemo && <span className="text-sm text-green-600">+12% vs last month</span>}
              </div>
              <div className="pt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-500">75% of monthly goal</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full">
                  <div className="w-3/4 h-1.5 bg-black rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Pending Payments Card */}
            <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-600">Pending Payments</span>
                <div className="w-8 h-8 bg-amber-50 rounded-full flex items-center justify-center">
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-3xl font-semibold">{getValue("€1,250", "€0")}</span>
                {isDemo && <span className="text-sm text-amber-600">5 clients</span>}
              </div>
              <div className="pt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-500">20% of total revenue</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full">
                  <div className="w-1/5 h-1.5 bg-gray-400 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Paid Invoices Card */}
            <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-600">Paid Invoices</span>
                <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                  <svg
                    className="h-4 w-4 text-blue-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-3xl font-semibold">{getValue("32", "0")}</span>
                {isDemo && <span className="text-sm text-blue-600">This month</span>}
              </div>
              <div className="pt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-500">90% success rate</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full">
                  <div className="w-[90%] h-1.5 bg-black rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Average Session Value Card */}
            <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-600">Average Session Value</span>
                <div className="w-8 h-8 bg-violet-50 rounded-full flex items-center justify-center">
                  <svg
                    className="h-4 w-4 text-violet-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 6V18M6 12H18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-3xl font-semibold">{getValue("€75", "€0")}</span>
                {isDemo && <span className="text-sm text-green-600">+5% vs last month</span>}
              </div>
              <div className="pt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-500">65% of target value</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full">
                  <div className="w-[65%] h-1.5 bg-gray-400 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (2/3 width) - Major financial content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Revenue Overview */}
            <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Revenue Overview</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-black rounded-full"></div>
                    <span className="text-sm text-gray-600">2025</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span className="text-sm text-gray-600">2024</span>
                  </div>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <span className="text-sm">Monthly</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="h-72 w-full">
                {/* Placeholder for chart */}
                <div className="w-full h-full bg-gray-50 flex items-center justify-center rounded-lg">
                  <span className="text-gray-400">Revenue Chart</span>
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Recent Transactions</h3>
                <span className="text-sm text-gray-600 cursor-pointer hover:underline">View All</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Client</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Amount</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Method</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Transaction Row 1 */}
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <ClientInitials initials="LM" />
                          <span className="font-medium">Lisa Martinez</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">Apr 23, 2025</td>
                      <td className="px-4 py-3 font-medium">€150.00</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">Paid</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <svg
                            className="h-4 w-4 text-gray-600"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
                            <path d="M2 10H22" stroke="currentColor" strokeWidth="2" />
                          </svg>
                          <span className="text-sm text-gray-600">Visa</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100">
                            <svg
                              className="h-4 w-4 text-gray-500"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M7 10L12 15L17 10"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M12 15V3"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                          <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100">
                            <svg
                              className="h-4 w-4 text-gray-500"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M12 5V19M5 12H19"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* More transaction rows would go here */}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Goals */}
            <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Financial Goals</h3>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <input
                      type="checkbox"
                      id="auto-adjust"
                      className="sr-only"
                      checked={autoAdjustGoals}
                      onChange={() => setAutoAdjustGoals(!autoAdjustGoals)}
                    />
                    <label
                      htmlFor="auto-adjust"
                      className={`block w-11 h-6 rounded-full transition-colors duration-200 ease-in-out ${
                        autoAdjustGoals ? "bg-[#CCFF00]" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`block w-4 h-4 mt-1 ml-1 bg-white rounded-full transition-transform duration-200 ease-in-out ${
                          autoAdjustGoals ? "transform translate-x-5" : ""
                        }`}
                      ></span>
                    </label>
                  </div>
                  <span className="text-sm text-gray-600">Auto-adjust goals</span>
                </div>
              </div>

              <div className="space-y-6">
                {/* Monthly Revenue Goal */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <h4 className="font-medium">Monthly Revenue</h4>
                      <p className="text-sm text-gray-500">April 2025</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">€4,850 / €5,000</p>
                      <p className="text-sm text-gray-500">97% achieved</p>
                    </div>
                  </div>
                  <div className="w-full h-2.5 bg-gray-100 rounded-full">
                    <div className="h-2.5 bg-black rounded-full" style={{ width: "97%" }}></div>
                  </div>
                </div>

                {/* Quarterly Revenue Goal */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <h4 className="font-medium">Quarterly Revenue</h4>
                      <p className="text-sm text-gray-500">Q2 2025</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">€9,200 / €15,000</p>
                      <p className="text-sm text-gray-500">61% achieved</p>
                    </div>
                  </div>
                  <div className="w-full h-2.5 bg-gray-100 rounded-full">
                    <div className="h-2.5 bg-black rounded-full" style={{ width: "61%" }}></div>
                  </div>
                </div>

                {/* Annual Revenue Goal */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <h4 className="font-medium">Annual Revenue</h4>
                      <p className="text-sm text-gray-500">2025</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">€18,750 / €60,000</p>
                      <p className="text-sm text-gray-500">31% achieved</p>
                    </div>
                  </div>
                  <div className="w-full h-2.5 bg-gray-100 rounded-full">
                    <div className="h-2.5 bg-gray-400 rounded-full" style={{ width: "31%" }}></div>
                  </div>
                </div>

                {/* Client Acquisition Goal */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <h4 className="font-medium">Client Acquisition</h4>
                      <p className="text-sm text-gray-500">New paying clients</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">8 / 10</p>
                      <p className="text-sm text-gray-500">80% achieved</p>
                    </div>
                  </div>
                  <div className="w-full h-2.5 bg-gray-100 rounded-full">
                    <div className="h-2.5 bg-gray-400 rounded-full" style={{ width: "80%" }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (1/3 width) */}
          <div className="space-y-8">
            {/* Payment Analytics */}
            <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold mb-6">Payment Analytics</h3>
              <div className="h-48 w-full mb-6">
                {/* Placeholder for chart */}
                <div className="w-full h-full bg-gray-50 flex items-center justify-center rounded-lg">
                  <span className="text-gray-400">Payment Analytics Chart</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Success Rate</p>
                  <p className="text-xl font-bold">94%</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Avg. Transaction</p>
                  <p className="text-xl font-bold">€180</p>
                </div>
              </div>
            </div>

            {/* Pending Payments */}
            <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Pending Payments</h3>
                <span className="px-2 py-1 bg-amber-50 text-amber-700 text-sm rounded-full">€1,240 total</span>
              </div>

              <div className="space-y-4">
                {/* Pending Payment Items */}
                <div className="p-4 border border-gray-100 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                      <ClientInitials initials="AS" />
                      <div>
                        <p className="font-medium">Anna Smith</p>
                        <p className="text-sm text-gray-500">Monthly Subscription</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">€180.00</p>
                      <p className="text-xs text-amber-600">Due in 3 days</p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm">
                      Send Reminder
                    </Button>
                    <Button size="sm" className="bg-[#CCFF00] text-black hover:bg-[#b8e600]">
                      Mark as Paid
                    </Button>
                  </div>
                </div>

                {/* Add more pending payment items as needed */}
              </div>

              <div className="mt-4 text-center">
                <Button variant="link" className="text-sm text-gray-600 hover:text-gray-900">
                  View all pending payments
                </Button>
              </div>
            </div>

            {/* Monthly Comparison */}
            <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold mb-6">Monthly Comparison</h3>
              <div className="h-48 w-full">
                {/* Placeholder for chart */}
                <div className="w-full h-full bg-gray-50 flex items-center justify-center rounded-lg">
                  <span className="text-gray-400">Monthly Comparison Chart</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
