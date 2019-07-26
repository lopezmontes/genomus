\include "lilypond-book-preamble.ly"

\paper { oddFooterMarkup = ##f }

\version "2.19.36"

global = {
  \key c \major
  \time 16/4
     \override Staff.TimeSignature #'stencil = ##f

}

violin = \relative c'' {
  \global
  % \override Stem.length = #0
  es,4--\mp ges'16.\ff-. aes,2..\mf

}

\score {
  \new Staff \with {
    instrumentName = ""
    midiInstrument = "violin"
  } \violin
  \layout { }
  \midi {
    \tempo 4=100
  }
}