import { AssignmentCollector } from "./normalise";
import { fail, ok, type ParseResult } from "./types";

/**
 * Turns XML text into a document. Injectable because `DOMParser` is a browser
 * global with no equivalent in the bun test runtime; the browser passes nothing
 * and gets the real one, the tests pass happy-dom's.
 */
export type XmlReader = (xml: string) => Document;

const domParser: XmlReader = (xml) => new DOMParser().parseFromString(xml, "text/xml");

/** The elements a cartridge might hang an assignment on. Lower case; XML tag names are compared case-insensitively. */
const ITEM_TAGS = ["item", "assignment", "resource"];
const TITLE_TAGS = ["title"];
const DESCRIPTION_TAGS = ["description", "text"];
const DUE_TAGS = ["due_at", "due_date", "date"];

/**
 * Reads an IMS Common Cartridge manifest, or anything else close enough to it.
 *
 * The tag names are matched by walking the tree rather than through
 * `querySelector`, which is what this used to do. Two reasons, and the second is
 * the one that matters: `due_at` is a valid CSS identifier by the spec but not
 * every implementation agrees, so the selector was a portability bet for no
 * gain; and XML tag names are case-sensitive where CSS type selectors are not,
 * so a cartridge writing `<Title>` would have been matched by a rule that then
 * behaved differently depending on the parser.
 *
 * The tags accepted are loose on purpose, because the cartridges different LMS
 * versions produce disagree about which element carries an assignment. Whatever
 * is found goes into a preview the user confirms, so over-matching costs a
 * glance and under-matching costs an assignment.
 */
export function parseCanvasXml(text: string, read: XmlReader = domParser): ParseResult {
  const doc = read(text);

  // `parseFromString` does not throw on malformed input. It returns a document
  // whose root is <parsererror>, which matches none of the tags below — so a
  // broken file used to arrive at the UI as "no assignments found in file",
  // sending the student off to check an export that was never the problem.
  if (findFirst(doc, ["parsererror"]) !== null) return fail({ kind: "invalid-xml" });

  const collector = new AssignmentCollector();

  for (const item of findAll(doc, ITEM_TAGS)) {
    collector.add({
      title: textOf(findFirst(item, TITLE_TAGS)) ?? item.getAttribute("title"),
      // The manifest names the course once, at the top. Without this every row
      // imported as "Imported" and had to be re-filed by hand.
      subject: courseTitle(doc),
      description: textOf(findFirst(item, DESCRIPTION_TAGS)),
      dueAt: textOf(findFirst(item, DUE_TAGS)),
    });
  }

  return ok(collector.collected());
}

/**
 * The course name, from `<manifest><metadata>`.
 *
 * Scoped to the metadata block rather than searched for document-wide: a bare
 * hunt for the first `<title>` finds the first *assignment's* title and files
 * the entire course under it.
 */
function courseTitle(doc: Document): string | null {
  const manifest = childByTag(doc, "manifest") ?? doc.documentElement;
  if (!manifest) return null;

  const metadata = childByTag(manifest, "metadata");
  if (!metadata) return null;

  return textOf(findFirst(metadata, TITLE_TAGS));
}

function childByTag(parent: Document | Element, name: string): Element | null {
  for (const child of Array.from(parent.children)) {
    if (child.tagName.toLowerCase() === name) return child;
  }
  return null;
}

function findAll(scope: Document | Element, tags: string[]): Element[] {
  const wanted = new Set(tags);
  return Array.from(scope.getElementsByTagName("*")).filter((el) => wanted.has(el.tagName.toLowerCase()));
}

function findFirst(scope: Document | Element, tags: string[]): Element | null {
  const wanted = new Set(tags);
  for (const el of Array.from(scope.getElementsByTagName("*"))) {
    if (wanted.has(el.tagName.toLowerCase())) return el;
  }
  return null;
}

function textOf(element: Element | null): string | null {
  const text = element?.textContent?.trim();
  return text ? text : null;
}
