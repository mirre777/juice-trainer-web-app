"use client"

import { clientsPageStyles } from "../../../app/clients-new-design/styles"
import Image from "next/image"

export function NoClientSelected() {
  return (
    <div className={clientsPageStyles.noClientSelectedCard}>
      {/* Telescope and Person Icon */}
      <div className={clientsPageStyles.noClientIconContainer}>
        <Image src="/images/no-clients-selected.svg" alt="No client selected" width={270} height={238} />
      </div>

      {/* Text content */}
      <div className={clientsPageStyles.noClientTextContainer}>
        <h2 className={clientsPageStyles.noClientTitle}>Waiting for client connection.</h2>
        <p className={clientsPageStyles.noClientSubtitle}>Find the invite link in your Settings to (re)send.</p>
      </div>
    </div>
  )
}
