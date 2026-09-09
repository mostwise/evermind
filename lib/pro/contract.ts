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

import type { ReactNode } from "react";

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
  /**
   * Reading and writing assignments and classes over HTTP from outside the app
   * — a script, a shortcut, another program — authenticated by a token the user
   * issues rather than by the session cookie a browser carries.
   *
   * Absent here does not mean "your data is closed to you". The app itself
   * never uses this; it talks to Postgres directly, and anyone running their
   * own instance holds the database credentials, which is strictly more than
   * this offers.
   */
  readonly programmaticApi: Capability;
}

/** A server route the optional module supplies the body of. */
export type ProRequestHandler = (request: Request) => Promise<Response>;

/**
 * A block of page content the optional module supplies.
 *
 * This exists for the legal pages, and the reason is not tidiness — it is that
 * the alternative is a false statement. A self-hosted instance that shipped a
 * terms page describing something it does not sell, or a privacy notice naming
 * a processor it does not use, would be making a claim about its own data
 * handling that is simply untrue. Those paragraphs are only correct where the
 * module is installed, so they live with the module.
 */
export type ProSection = () => ReactNode;

export interface ProModule {
  /**
   * False in the stub. Consumers should not normally need this — prefer checking
   * the individual capability — but route shells use it to decide between
   * serving and returning a 404.
   */
  readonly present: boolean;

  capabilitiesFor(userId: string): Promise<ProCapabilities>;

  /**
   * Server routes this edition adds, looked up by name.
   *
   * Next.js requires a file under `app/` for every route, so the public
   * repository carries thin shells that find their handler here and answer 404
   * when there is none. The shells are the one place a reader can learn that a
   * commercial edition exists, and they learn it from a directory name and
   * nothing else — no request shape, no fields, no processor.
   *
   * The keys are plain strings rather than a named union on purpose. A union
   * would have to spell out what each route is for, in this file, which is the
   * one file that is supposed to describe optional capabilities without
   * describing a business model.
   */
  readonly handlers?: Readonly<Record<string, ProRequestHandler | undefined>>;

  /**
   * Page content this edition adds, looked up by name. Absent in the stub, so
   * the public pages render only what is true of a build without the module.
   */
  readonly sections?: Readonly<Record<string, ProSection | undefined>>;
}

/** Every capability off, with nothing to render in their place. */
export const NO_CAPABILITIES: ProCapabilities = {
  calendarFeed: { available: false },
  canvasSync: { available: false },
  attachments: { available: false },
  reminderRules: { available: false },
  programmaticApi: { available: false },
};
