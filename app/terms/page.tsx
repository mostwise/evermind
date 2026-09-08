import Link from "next/link";
import { CopyEmailButton } from "@/components/copy-email-button";
import { proSection } from "@/lib/pro";

/**
 * Terms of use.
 *
 * Everything here is true of Evermind as it stands in this repository: a
 * planner you can use, self-host or fork, with no charge and nothing sold. If
 * the optional module is installed, it adds the section describing what is sold
 * and on what terms — which is why that section is not written here, where it
 * would be false for every self-hosted instance.
 */

const CONTACT_ADDRESS = "data@evermind.today";
const CONTACT_LABEL = "data [at] evermind (dot) today";

export default function TermsPage() {
  const PurchaseTerms = proSection("terms-purchase");

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-6">Terms of Service</h1>

      {/*
        Deliberately loud, and deliberately not removed by whoever drafted it.
        These terms are written to describe what the software actually does,
        which is not the same as being sufficient. Anyone running an instance
        that takes money should have them reviewed by someone qualified before
        it does.
      */}
      <div className="mb-8 rounded-lg border border-amber-500/50 bg-amber-50 dark:bg-amber-950/30 p-4">
        <p className="text-sm text-amber-900 dark:text-amber-200">
          <strong>Operator note — not legal advice.</strong> This document was drafted to describe accurately how
          Evermind works. It has not been reviewed by a lawyer. If you run an instance of Evermind, and especially if it
          takes payment, have these terms reviewed and replace this notice before you rely on them.
        </p>
      </div>

      <div className="space-y-6 text-gray-700 dark:text-gray-300">
        <section>
          <h2 className="text-2xl font-semibold mb-3">What Evermind Is</h2>
          <p>
            Evermind is a planner for coursework: you record assignments, when they are due and which class they belong
            to, and it shows you what is coming. It is provided as-is, for your own use. It is not affiliated with any
            school, college or university, and it is not a system of record — your institution&rsquo;s own deadlines are
            authoritative, not ours.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Your Account</h2>
          <p>
            You need an account to use Evermind, and you are responsible for what happens under it. Keep your sign-in
            secure, and tell us if you believe someone else has used it. You must be old enough to agree to these terms
            in your own country; if you are not, a parent or guardian must agree on your behalf.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Your Data Is Yours</h2>
          <p>
            The assignments and classes you put into Evermind belong to you. We claim no ownership of them and we do not
            sell them. You can export everything or delete your account at any time from the{" "}
            <Link href="/settings" className="underline decoration-solid hover:opacity-70 transition-opacity">
              settings page
            </Link>
            . Deletion is immediate and complete, so export first if you want a copy. How we handle your data is
            described in our{" "}
            <Link href="/privacy" className="underline decoration-solid hover:opacity-70 transition-opacity">
              Privacy Policy
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Acceptable Use</h2>
          <p className="mb-2">Please do not:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Use Evermind to store or share anything unlawful</li>
            <li>Attempt to access another person&rsquo;s account or data</li>
            <li>Probe, overload or disrupt the service or the infrastructure behind it</li>
            <li>Use automated means to hammer the service beyond ordinary personal use</li>
          </ul>
          <p className="mt-2">
            We may suspend an account that is doing any of these, and will say why where we reasonably can.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">The Software Is Open Source</h2>
          <p>
            Evermind is published under the GNU General Public License v3.0 or later. You are free to read it, run it,
            change it and share it under that licence — including running your own instance. These terms govern your use
            of <em>this</em> hosted instance; they do not limit the rights the GPL grants you over the software itself.
            Where the two ever appear to conflict about the software, the licence wins.
          </p>
        </section>

        {/*
          Supplied by the optional module. A build without it sells nothing, so
          there is nothing here to describe — and describing it anyway would be
          a false statement in a document people rely on.
        */}
        {PurchaseTerms ? <PurchaseTerms /> : null}

        <section>
          <h2 className="text-2xl font-semibold mb-3">Availability</h2>
          <p>
            We try to keep Evermind running and your data safe, but we do not promise it will always be available or
            error-free. It is a planner, not a safety-critical system: do not rely on it as the only record of a
            deadline that matters to you. We may change or discontinue features, and we will give reasonable notice
            before removing something people depend on.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Liability</h2>
          <p>
            To the extent the law allows, Evermind is provided without warranties, and we are not liable for a missed
            deadline, a lost grade or any other loss arising from your use of it. Nothing here limits liability that
            cannot lawfully be limited — including for death or personal injury caused by negligence, or for fraud.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Changes to These Terms</h2>
          <p>
            We may update these terms. If a change materially affects you, we will give notice before it takes effect —
            and if you have paid for something, we will not use a change of terms to take away what you paid for.
            Continuing to use Evermind after a change means you accept the updated terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Ending It</h2>
          <p>
            You can stop using Evermind and delete your account at any time, for any reason, without telling us why. We
            may close an account that breaks these terms. If we close yours without cause, and you have paid for
            something you can no longer use, we will refund it.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Contact</h2>
          <p>
            Questions about these terms can go to <CopyEmailButton address={CONTACT_ADDRESS} label={CONTACT_LABEL} />
          </p>
        </section>

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-8">Last updated: September 8, 2026</p>
      </div>

      <footer className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-muted-foreground">
          <Link href="/auth/login" className="hover:text-foreground underline-offset-4 hover:underline">
            Login
          </Link>
          <span className="hidden sm:inline">·</span>
          <Link href="/preview" className="hover:text-foreground underline-offset-4 hover:underline">
            Preview
          </Link>
          <span className="hidden sm:inline">·</span>
          <Link href="/privacy" className="hover:text-foreground underline-offset-4 hover:underline">
            Privacy
          </Link>
        </div>
      </footer>
    </div>
  );
}
