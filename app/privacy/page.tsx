import Link from "next/link";
import { CopyEmailButton } from "@/components/copy-email-button";
import { proSection } from "@/lib/pro";

/**
 * A server component, so it can ask the optional module whether there is
 * anything extra to disclose. Without that module there is not, and the page
 * renders exactly what is true of the software in this repository.
 *
 * The contact address is a placeholder for whoever runs the instance. If you
 * are self-hosting, `data@evermind.today` is not your address — change it.
 */

const CONTACT_ADDRESS = "data@evermind.today";
const CONTACT_LABEL = "data [at] evermind (dot) today";

export default function PrivacyPage() {
  // Supplied only by the commercial module. In its absence this page must not
  // name a payment processor, because a build without it does not use one, and
  // saying otherwise would be a false statement about data handling.
  const PaymentProcessing = proSection("privacy-payment");

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>

      <div className="space-y-6 text-gray-700 dark:text-gray-300">
        <section>
          <h2 className="text-2xl font-semibold mb-3">Introduction</h2>
          <p>
            This Privacy Policy describes how Evermind collects, uses, and protects your personal information when you
            use our service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Information We Collect</h2>
          <p className="mb-2">We collect information that you provide directly to us, including:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Account information (email address, name)</li>
            <li>Assignment and task data</li>
            <li>Usage information and preferences</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">How We Use Your Information</h2>
          <p className="mb-2">We use the information we collect to:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Provide, maintain, and improve our services</li>
            <li>Process and complete transactions</li>
            <li>Send you technical notices and support messages</li>
            <li>Respond to your comments and questions</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal information against
            unauthorized access, alteration, disclosure, or destruction.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Data Handling</h2>
          <p>
            We do not sell, trade, or rent your personal information to third parties. We may share your information
            with trusted service providers who assist us in operating our website, conducting our business, or serving
            you.
            <br></br>
            <br></br>
            You can export or delete your data yourself at any time from your{" "}
            <Link href="/settings" className="underline decoration-solid hover:opacity-70 transition-opacity">
              settings page
            </Link>
            . For anything else, contact us at <CopyEmailButton address={CONTACT_ADDRESS} label={CONTACT_LABEL} />
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Third-Party Services</h2>
          <p>
            We use third-party services for authentication and data storage. These services have their own privacy
            policies governing the use of your information.
          </p>
        </section>

        {/*
          Only rendered where the optional module is installed. It adds the
          processor involved in taking a payment, and says that card details
          never reach Evermind.
        */}
        {PaymentProcessing ? <PaymentProcessing /> : null}

        <section>
          <h2 className="text-2xl font-semibold mb-3">How Long We Keep Your Data</h2>
          <p>
            Your account and the assignments in it are kept until you delete them. Deleting your account from the{" "}
            <Link href="/settings" className="underline decoration-solid hover:opacity-70 transition-opacity">
              settings page
            </Link>{" "}
            removes your account and everything filed under it immediately, and we do not keep a copy. There is no grace
            period and nothing is retained for later recovery, so please export first if you want your data.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Your Rights</h2>
          <p className="mb-2">You have the right to:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Access and receive a copy of your personal data</li>
            <li>Request correction of your personal data</li>
            <li>Request deletion of your personal data</li>
            <li>Object to processing of your personal data</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new
            Privacy Policy on this page.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at{" "}
            <CopyEmailButton address={CONTACT_ADDRESS} label={CONTACT_LABEL} />
          </p>
        </section>

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-8">Last updated: September 8, 2026</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Evermind is not affiliated with any educational institution. We are an independent service provider.
        </p>
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
          <Link href="/terms" className="hover:text-foreground underline-offset-4 hover:underline">
            Terms
          </Link>
        </div>
      </footer>
    </div>
  );
}
