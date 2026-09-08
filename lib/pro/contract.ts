/**
 * The boundary between the open-source app and the commercial edition.
 *
 * This file is the *entire* public surface of that boundary, and it is
 * deliberately written without any billing vocabulary. There is no `isPro`, no
 * tier, no plan, no price and no mention of a payment processor anywhere in the
 * public repository — because the public repository does not have a paid tier.
 * It has capabilities which may or may not be present.
 *
 * That distinction is what makes the gate structural rather than cosmetic. A
 * flag saying `pro: false` is one line for anyone to delete; a module that is
 * not in the repository cannot be enabled by editing the repository.
 *
 * Three states, and the difference between the last two is the whole design:
 *
 *   available: true                 the feature works, render it
 *   available: false, no cta        the module is absent — render nothing at all
 *   available: false, with a cta    the module is present and says this user
 *                                   cannot use the feature yet; render the cta
 *                                   it supplied, whatever it happens to say
 *
 * A consuming component therefore never asks "has this person paid". It asks
 * "can I show this", and if not, "were you given anything to show instead". The
 * same component renders correctly in a self-hosted install, in a free account
 * and in a paid one, without knowing which it is in.
 */

/** What to render in place of a feature that exists but is not available to this user. */
export interface CapabilityCta {
  /** Button or link text. Supplied by the commercial module, never hardcoded here. */
  readonly label: string;
  readonly href: string;
  /** One sentence explaining what the feature does, shown next to the label. */
  readonly blurb: string;
}

export interface Capability {
  readonly available: boolean;
  /**
   * Absent whenever the commercial module is absent. A consumer that finds
   * `available: false` and no `cta` must render nothing — not a disabled
   * control, not a placeholder, nothing.
   */
  readonly cta?: CapabilityCta;
}

/**
 * The optional features. Named for what they do, so this list reads the same
 * whether or not any of them are ever sold.
 */
export interface ProCapabilities {
  /** A subscribable calendar feed the user can add to Google, Apple or Outlook. */
  readonly calendarFeed: Capability;
  /** Pulling coursework from the Canvas API on a schedule, rather than from a file. */
  readonly canvasSync: Capability;
  /** Files attached to an assignment. */
  readonly attachments: Capability;
  /** Reminder scheduling beyond the single daily digest everyone gets. */
  readonly reminderRules: Capability;
}

export interface ProModule {
  /**
   * False in the stub. Consumers should not normally need this — prefer checking
   * the individual capability — but route shells use it to decide between
   * serving and returning a 404.
   */
  readonly present: boolean;

  capabilitiesFor(userId: string): Promise<ProCapabilities>;
}

/** Every capability off, with nothing to render in their place. */
export const NO_CAPABILITIES: ProCapabilities = {
  calendarFeed: { available: false },
  canvasSync: { available: false },
  attachments: { available: false },
  reminderRules: { available: false },
};
