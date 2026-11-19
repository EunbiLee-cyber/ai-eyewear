import { content } from "../config/content";

type Note = {
  readonly headline: string;
  readonly body: readonly (readonly [string, boolean])[];
};

/** 인터랙션 섹션 하단의 설명 텍스트(S02·S03 공용). 일반 문서 흐름에 놓이며 애니메이션이 없다. */
export function ReinterpretNote({ note = content.reinterpret.note }: { note?: Note }) {
  const { headline, body } = note;

  return (
    <section className="reinterpret-note">
      <div className="reinterpret-note-inner">
        <h3 className="reinterpret-note-headline">{headline}</h3>
        <p className="reinterpret-note-body">
          {body.map(([text, strong], i) => (strong ? <strong key={i}>{text}</strong> : text))}
        </p>
      </div>
    </section>
  );
}
