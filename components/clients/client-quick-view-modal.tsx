"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Phone, Mail, Calendar, TrendingUp, Target, Clock } from "lucide-react"
import type { Client } from "@/types/client"

interface ClientQuickViewModalProps {
  client: Client
  isOpen: boolean
  onClose: () => void
}

export function ClientQuickViewModal({ client, isOpen, onClose }: ClientQuickViewModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[672px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="relative">
          <DialogTitle className="text-xl font-semibold pr-8">Client Overview</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute right-0 top-0 h-8 w-8 rounded-full hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-6">
          {/* Client Basic Info */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-16 h-16 rounded-full bg-lime-300 flex items-center justify-center text-xl font-bold text-black">
              {client.initials || client.name?.charAt(0) || "?"}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{client.name || "Unknown Client"}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                {client.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    <span>{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    <span>{client.phone}</span>
                  </div>
                )}
              </div>
              <div className="mt-2">
                <Badge variant={client.status === "Active" ? "default" : "secondary"}>
                  {client.status || "Pending"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{client.sessions?.completed || 0}</div>
              <div className="text-sm text-gray-600">Sessions Completed</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{client.progress || 0}%</div>
              <div className="text-sm text-gray-600">Overall Progress</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{client.completion || 0}%</div>
              <div className="text-sm text-gray-600">Goal Completion</div>
            </div>
          </div>

          {/* Last Workout */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-500" />
              <h4 className="font-medium text-sm">Recent Activity</h4>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              {client.lastWorkout?.name ? (
                <div>
                  <div className="font-medium text-sm">{client.lastWorkout.name}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Completed {client.lastWorkout.date} • {client.lastWorkout.completion}% completion
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-sm text-center py-4">No recent workouts</div>
              )}
            </div>
          </div>

          {/* Current Goals */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-gray-500" />
              <h4 className="font-medium text-sm">Current Goals</h4>
            </div>
            <div className="space-y-2">
              <div className="p-3 bg-lime-50 border border-lime-200 rounded-lg">
                <div className="font-medium text-sm">Primary Goal</div>
                <div className="text-sm text-lime-700 mt-1">
                  {client.goal || "Improve overall fitness and strength"}
                </div>
              </div>
            </div>
          </div>

          {/* Progress Metrics */}
          {client.metrics && client.metrics.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-gray-500" />
                <h4 className="font-medium text-sm">Progress Metrics</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {client.metrics.map((metric, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-sm">{metric.name}</div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-lg font-semibold">{metric.value}</span>
                      {metric.change && (
                        <span
                          className={`text-sm ${metric.change.startsWith("-") ? "text-green-600" : "text-blue-600"}`}
                        >
                          {metric.change}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Trainer Notes</h4>
            <div className="p-4 border border-gray-200 rounded-lg min-h-24 bg-gray-50">
              <p className="text-sm">{client.notes || "No notes available for this client."}</p>
            </div>
          </div>

          {/* Next Session */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-500" />
              <h4 className="font-medium text-sm">Next Session</h4>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="text-sm text-gray-600">No upcoming sessions scheduled</div>
              <Button variant="outline" size="sm" className="mt-2">
                Schedule Session
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
