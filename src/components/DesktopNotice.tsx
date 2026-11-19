import { content } from "../config/content";

export function DesktopNotice() {
  const { brand, headline, body } = content.notice;
  return (
    <main className="notice">
      <p className="notice-brand">{brand}</p>
      <h1 className="notice-headline">{headline}</h1>
      <p className="notice-body">{body}</p>
    </main>
  );
}
