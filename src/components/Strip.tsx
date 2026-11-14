import Image from "next/image";
import { Fragment } from "react";
import s from "./Strip.module.css";

const WORDS = ["CULTURE", "SOUND", "PEOPLE", "ATMOSPHERE"];

/** The purple strip under the hero: the four words, an owl between each, spread across the full width. */
export default function Strip() {
  return (
    <div className={s.strip}>
      <p className={s.row}>
        {WORDS.map((word, i) => (
          <Fragment key={word}>
            {i > 0 && <Image className={s.owl} src="/images/strip-owl.png" alt="" width={40} height={40} />}
            <span className={s.word}>{word}</span>
          </Fragment>
        ))}
      </p>
    </div>
  );
}
