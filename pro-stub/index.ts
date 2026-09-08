import { NO_CAPABILITIES, type ProCapabilities, type ProModule } from "@/lib/pro/contract";

/**
 * The commercial module, as the open-source repository sees it.
 *
 * Everything here is off, and — this is the part that matters — off *without a
 * `cta`. A consumer reading `available: false` with nothing to show in its
 * place renders nothing at all, so a clone of this repository is not a free
 * tier of a paid product with the paid parts greyed out. It is a complete
 * planner that happens not to have four optional features compiled into it.
 *
 * `next.config.mjs` picks between this file and `pro/index.ts` at config time,
 * by looking for the latter on disk. Nothing at runtime chooses, and there is
 * no flag to flip: with the private module absent this is the only
 * implementation that exists, and the code that would sell you the features is
 * not in the bundle to be re-enabled.
 */
const stub: ProModule = {
  present: false,

  // The parameter is the contract's, not this implementation's: the stub has
  // nothing to look up, because there is nothing that could be available.
  async capabilitiesFor(_userId: string): Promise<ProCapabilities> {
    return NO_CAPABILITIES;
  },
};

export default stub;
